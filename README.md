# StreamSmart – Adaptive Video Streaming Optimization

StreamSmart is a full-stack video streaming optimization platform designed to study and improve video playback performance under different network conditions.

The project focuses on **Adaptive Bitrate Streaming (ABR)**, network simulation, edge caching, and playback performance analysis. It compares traditional fixed-quality streaming with a custom Adaptive Bitrate (ABR) algorithm to understand how intelligent quality selection can improve the streaming experience.

## 1. Project Overview

Imagine a user watching a video while connected to a slow internet network.

With traditional fixed-quality streaming, the video continues using the selected quality even when network bandwidth decreases. This can cause buffering and interruptions.

StreamSmart addresses this problem by using Adaptive Bitrate Streaming.

For example:

- When the internet connection is fast, the player can select 1080p.
- When bandwidth decreases, it can switch to 720p.
- When the connection becomes slower, it can select 360p.

This allows the player to adapt video quality according to available network bandwidth.

## 2. Main Objectives

- Understand how video streaming works using HLS.
- Implement a custom Adaptive Bitrate (ABR) algorithm.
- Simulate different network conditions, including bandwidth, latency, and packet loss.
- Compare fixed-quality and adaptive-quality streaming.
- Implement edge caching to reduce repeated requests to the origin server.
- Measure and analyze streaming performance using playback telemetry.
- Store experiment results and review performance through a dashboard.

## 3. Technology Stack

| Technology   | Purpose           | Why We Use It                                                            |
| ------------ | ----------------- | ------------------------------------------------------------------------ |
| React.js     | Frontend          | Builds an interactive user interface.                                    |
| Vite         | Frontend tooling  | Provides a fast development server and build process.                    |
| Node.js      | Backend runtime   | Runs JavaScript on the server.                                           |
| Express.js   | Backend framework | Handles APIs, authentication, video requests, and streaming routes.      |
| MongoDB      | Database          | Stores users, videos, and experiment records.                            |
| Mongoose     | ODM               | Defines database models and manages MongoDB operations.                  |
| HLS.js       | Streaming library | Plays HLS videos in browsers that do not natively support HLS.           |
| FFmpeg       | Video processing  | Converts source videos into HLS playlists and multiple quality versions. |
| Multer       | File uploads      | Handles video uploads from users.                                        |
| JWT          | Authentication    | Secures protected API endpoints.                                         |
| Lucide React | Icons             | Provides icons for the dashboard and player interface.                   |
| Bootstrap    | UI styling        | Helps create responsive interface components.                            |

## 4. Main Features

### A. Video Library

Users can upload their own video files or add externally hosted video URLs.

Supported video formats include:

- MP4
- WebM
- OGG
- HLS (.m3u8)

Uploaded video files are stored on the backend, while video information such as title, description, URL, and format is stored in MongoDB.

### B. HLS Video Streaming

StreamSmart uses HTTP Live Streaming (HLS) to deliver video content through playlists and smaller media segments.

An HLS stream can contain multiple quality levels.

Example:

```text
master.m3u8
│
├── 360p/
│   ├── playlist.m3u8
│   └── segments
│
├── 720p/
│   ├── playlist.m3u8
│   └── segments
│
└── 1080p/
    ├── playlist.m3u8
    └── segments
```

The master playlist provides information about the available video qualities.

FFmpeg is used to generate these HLS versions from the original video.

### C. Adaptive Bitrate Streaming (ABR)

Adaptive Bitrate Streaming dynamically selects video quality based on network conditions.

StreamSmart implements a custom ABR algorithm that considers:

- Available network bandwidth.
- Current buffer length.
- Previous playback quality.
- Quality upgrade history.

Example:

| Network Bandwidth | Possible Video Quality |
| ----------------- | ---------------------- |
| 8 Mbps            | 1080p                  |
| 4 Mbps            | 720p                   |
| 1 Mbps            | 360p                   |

These values are illustrative; actual quality selection depends on the available HLS levels and the ABR algorithm.

### D. Network Simulation

The Network Lab allows users to test video streaming under different network conditions.

Users can experiment with:

- Bandwidth limitations.
- Network latency.
- Packet loss.

Example:

A user can reduce available bandwidth and observe how video buffering and quality selection change.

This helps understand how network conditions affect streaming performance.

### E. Edge Caching

StreamSmart includes an edge caching system for externally hosted HLS resources.

Instead of repeatedly requesting the same resource from the origin server, the Edge Server can temporarily store eligible resources.

The basic workflow is:

```text
Video Player
     |
     v
Edge Server
     |
     v
Check Cache
     |
     ├── Cache Hit
     |      |
     |      v
     |   Return Cached Resource
     |
     └── Cache Miss
            |
            v
       Origin Server
            |
            v
       Store Resource
            |
            v
       Return Resource
```

The objective is to reduce repeated origin requests and improve resource delivery when cached resources are available.

### F. Playback Telemetry

StreamSmart collects playback information to evaluate streaming performance.

Important metrics include:

- Time to First Frame (TTFF).
- Rebuffer Count.
- Buffer Length.
- Total Rebuffer Duration.
- Current Bitrate.
- Estimated Throughput.
- Video Resolution.
- Quality Switches.

These metrics help understand how different network conditions and streaming strategies affect playback.

### G. Streaming Experiments

The Experiment Module compares two streaming approaches:

**1. Baseline – Fixed Quality**

The player uses a manually selected video quality level during the experiment.

**2. Optimized – Custom ABR**

The player uses the custom Adaptive Bitrate algorithm to select quality according to measured streaming conditions.

Both tests can be performed using the same HLS video and comparable network conditions.

Currently, experiments require an HLS video with at least two available quality levels.

### H. Dashboard and Analytics

The dashboard provides an overview of completed streaming experiments.

It includes performance information such as:

- Total Tests.
- Average Startup Time.
- Average Buffering Duration.
- Average Bitrate.
- Cache Hit Rate, when cache metrics are recorded.

Experiment results are stored in MongoDB for later analysis.

## 5. Example: How StreamSmart Works

Consider a user watching a video with three available quality levels:

```text
360p  →  500 Kbps
720p  →  1500 Kbps
1080p →  3000 Kbps
```

These are illustrative bitrate values.

Suppose the network bandwidth initially supports 1080p playback.

The user then experiences a decrease in bandwidth.

The custom ABR algorithm evaluates the available bandwidth and playback buffer and can select a lower quality level.

The player then continues playback with the newly selected quality.

This allows StreamSmart to compare adaptive streaming against fixed-quality playback.

## 6. Project Architecture

```text
StreamSmart/
│
├── src/
│   ├── videos/
│   │   ├── VideoPlayer.jsx
│   │   ├── ABREngine.js
│   │   └── Telemetry.js
│   │
│   ├── Dashboard/
│   │   ├── DashboardHome.jsx
│   │   ├── network/
│   │   └── edge/
│   │
│   ├── utils/
│   │   ├── networkSimulation.js
│   │   └── SimulatedNetworkLoader.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── upload.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Video.js
│   │   └── Experiment.js
│   │
│   ├── routes/
│   ├── services/
│   │   └── edgeCache.js
│   │
│   ├── uploads/
│   ├── app.js
│   └── server.js
│
├── package.json
└── README.md
```

_This is a simplified representation of the project structure._

## 7. Installation and Setup

### Prerequisites

Install the following tools:

- Node.js
- MongoDB
- Git
- FFmpeg

### Step 1: Clone the Repository

```bash
git clone https://github.com/MAHESH549990/BYTEFORGE_StreamSmart.git
```

```bash
cd BYTEFORGE_StreamSmart/StreamSmart
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
EDGE_ALLOWED_HOSTS=your-approved-cdn-hostname.com
```

Use the MongoDB variable name expected by your backend database connection code. Configure the Edge hostname only when your HLS resources require an additional approved CDN host.

Create a frontend `.env` file in the React project root:

```env
VITE_API_URL=http://localhost:5000
```

Replace the backend URL and port with your actual configuration.

### Step 5: Start the Backend

From the backend directory:

```bash
node server.js
```

### Step 6: Start the Frontend

Open another terminal in the frontend project directory:

```bash
npm run dev
```

Open the local URL displayed by Vite, normally:

```text
http://localhost:5173
```

## 8. Important Technical Notes

- MP4 videos are supported for normal playback.
- HLS videos are required for the current fixed-quality versus adaptive-quality experiment workflow.
- HLS experiments require at least two available quality levels.
- FFmpeg can generate multiple HLS quality levels from a source video.
- The Edge caching implementation currently uses temporary in-memory caching.
- Network profile selection in the experiment configuration is separate from applying actual network simulation in the Network Lab.
- Local uploaded files and externally hosted resources follow different delivery paths.

## 9. Future Improvements

- Automatic MP4-to-HLS conversion after upload.
- Improved ABR algorithms and quality selection strategies.
- More advanced cache replacement policies.
- Persistent edge caching.
- Detailed comparison charts and reports.
- More realistic network simulation.
- Support for cloud-based video storage.
- Enhanced streaming performance analytics.

## 10. Conclusion

StreamSmart is a practical project focused on understanding video streaming technologies and optimizing playback performance.

By combining React, Node.js, Express, MongoDB, HLS.js, FFmpeg, network simulation, and a custom ABR algorithm, the platform provides an environment to experiment with video quality adaptation and streaming performance.

The main objective is to understand how adaptive streaming and caching techniques can help deliver a smoother video playback experience under changing network conditions.

---

**Developed as a Full-Stack Video Streaming Optimization Project.**
