import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  Upload,
  Play,
  Film,
  Link2,
  Clock3
} from "lucide-react";

import "./VideoLibrary.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Send the logged-in user's JWT token to the backend.
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

// Format video duration as MM:SS or HH:MM:SS.
const formatDuration = (seconds) => {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(Number(seconds)) ||
    Number(seconds) <= 0
  ) {
    return "Duration unknown";
  }

  const totalSeconds = Math.floor(Number(seconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export default function VideoLibrary() {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [showExternal, setShowExternal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch videos belonging to the logged-in user.
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/videos`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load videos");
      }

      setVideos(data.videos || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Upload video.
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("video", videoFile);

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/api/videos/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setShowUpload(false);

      await fetchVideos();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add external video URL.
  const handleExternalVideo = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/api/videos/external`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          videoUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add video");
      }

      setTitle("");
      setDescription("");
      setVideoUrl("");
      setShowExternal(false);

      await fetchVideos();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Search and filter videos.
  const filteredVideos = videos.filter((video) =>
    (video.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="video-library">

      <div className="library-header">
        <div>
          <span className="library-label">STREAMSMART / MEDIA</span>

          <h2>Video Library</h2>

          <p>
            Choose a video to explore its streaming performance.
          </p>
        </div>

        <div className="library-actions">
          <button
            className="library-btn secondary-btn"
            onClick={() => {
              setShowExternal(false);
              setShowUpload(!showUpload);
            }}
          >
            <Upload size={17} />
            Upload Video
          </button>

          <button
            className="library-btn primary-btn"
            onClick={() => {
              setShowUpload(false);
              setShowExternal(!showExternal);
            }}
          >
            <Link2 size={17} />
            Add External URL
          </button>
        </div>
      </div>

      {error && (
        <div className="library-alert">
          {error}
        </div>
      )}

      {/* Upload form */}
      {showUpload && (
        <form className="library-form" onSubmit={handleUpload}>
          <h3>Upload a video</h3>

          <input
            type="text"
            placeholder="Video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={(e) =>
              setVideoFile(e.target.files[0] || null)
            }
            required
          />

          <button
            className="library-btn primary-btn"
            disabled={saving}
          >
            {saving ? "Uploading..." : "Upload Video"}
          </button>
        </form>
      )}

      {/* External URL form */}
      {showExternal && (
        <form
          className="library-form"
          onSubmit={handleExternalVideo}
        >
          <h3>Add an external video</h3>

          <input
            type="text"
            placeholder="Video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="url"
            placeholder="Direct MP4 or HLS URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
          />

          <button
            className="library-btn primary-btn"
            disabled={saving}
          >
            {saving ? "Adding..." : "Add Video"}
          </button>
        </form>
      )}

      {/* Library summary */}
      <div className="library-summary">

        <div>
          <Film size={20} />

          <div>
            <strong>{videos.length}</strong>
            <span>Available videos</span>
          </div>
        </div>

        <div>
          <Play size={20} />

          <div>
            <strong>
              {videos.filter(
                (v) => v.sourceType === "platform"
              ).length}
            </strong>

            <span>Platform videos</span>
          </div>
        </div>

        <div>
          <Upload size={20} />

          <div>
            <strong>
              {videos.filter(
                (v) => v.sourceType === "upload"
              ).length}
            </strong>

            <span>Your uploads</span>
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="library-search">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Video grid */}
      <div className="video-grid">

        {loading ? (
          <p>Loading videos...</p>
        ) : filteredVideos.length === 0 ? (
          <div className="empty-library">
            <Film size={38} />

            <h3>No videos found</h3>

            <p>
              Upload a video or add an external video URL to get started.
            </p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div className="video-card" key={video._id}>

              <div className="video-thumbnail">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                  />
                ) : (
                  <Film size={40} />
                )}

                <span className="video-format">
                  {video.format?.toUpperCase()}
                </span>
              </div>

              <div className="video-card-content">

                <div className="video-card-meta">
                  <span>{video.sourceType}</span>

                  <span>
                    <Clock3 size={13} />
                    {formatDuration(video.duration)}
                  </span>
                </div>

                <h3>{video.title}</h3>

                <p>
                  {video.description || "No description available."}
                </p>

                <Link
                  to={`/dashboard/player?videoId=${video._id}`}
                  state={{ video }}
                  className="watch-video-btn"
                >
                  <Play size={16} />
                  Open Player
                </Link>

              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}