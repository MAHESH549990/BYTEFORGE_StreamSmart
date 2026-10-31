# 🚀 StreamSmart
### Intelligent Video Streaming Optimization Platform

<p align="center">
  <strong>Smarter Streaming. Better Experience.</strong>
</p>

<p align="center">
  <a href="https://byteforge-streamsmart-1.onrender.com/">
    <img src="https://img.shields.io/badge/Live%20Demo-Launch%20StreamSmart-00C7D9?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</p>

---

## 🌐 Live Demo

Experience StreamSmart online:

<p align="center">
  <a href="https://byteforge-streamsmart-1.onrender.com/">
    <img src="https://img.shields.io/badge/OPEN%20LIVE%20APPLICATION-StreamSmart-blue?style=for-the-badge" alt="Open StreamSmart" />
  </a>
</p>

**Live Application:** https://byteforge-streamsmart-1.onrender.com/

---

## 📌 Project Overview

StreamSmart is an intelligent video streaming optimization platform designed to improve the video playback experience through network monitoring, adaptive video quality, performance analytics, and network simulation.

Video streaming performance depends on several network parameters, including bandwidth, latency, jitter, and packet loss. Unstable network conditions can result in buffering, playback interruptions, and reduced video quality.

StreamSmart aims to address these challenges by bringing video playback, network experimentation, and performance insights together in one integrated platform.

The platform provides a user interface, dashboard modules, video playback functionality, and backend APIs supported by MongoDB.

---

## 🎯 Project Objectives

- Improve understanding of video streaming optimization.
- Explore adaptive bitrate streaming concepts.
- Analyze the impact of network conditions on video playback.
- Monitor streaming performance and playback quality.
- Provide tools for network experimentation.
- Visualize streaming-related metrics and analytics.
- Build an integrated platform for video streaming evaluation.

---

## ✨ Key Features

### 📺 1. Video Streaming
- Video library and playback interface.
- HLS video playback support using HLS.js.
- Video quality and playback-related controls.
- Video management through backend APIs.

### ⚡ 2. Network Simulation
- Network experimentation interface.
- Bandwidth and latency-related testing.
- Network condition analysis.
- Experiment management.

### 📊 3. Performance Analytics
- Streaming performance dashboard.
- Playback analytics and visualizations.
- Performance comparison tools.
- Session history and monitoring interfaces.

### 🧠 4. Adaptive Streaming
- Adaptive bitrate streaming concepts.
- Video quality selection based on network conditions.
- Buffer health monitoring.
- Streaming performance evaluation.

### 👤 5. User Management
- User registration and login.
- Authentication-related functionality.
- User profile interface.
- Dashboard experiences.

### 🛠️ 6. Admin & Dashboard
- Dashboard interface.
- Video management modules.
- Analytics and monitoring pages.
- Experiment-related interfaces.

---

## 🧰 Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, JavaScript |
| Build Tool | Vite |
| Routing | React Router |
| UI Framework | Bootstrap 5 |
| Styling | CSS |
| Icons | Lucide React, Font Awesome |
| Video Streaming | HLS.js |
| Charts & Visualization | Recharts |
| Backend | Node.js, Express.js 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| API Middleware | CORS, Express Middleware |
| File Uploads | Multer |
| Environment Configuration | dotenv |
| Code Quality | Oxlint |
| Version Control | Git, GitHub |
| Deployment | Render |

---

## 🏗️ Project Architecture

StreamSmart follows a frontend-backend architecture.

```text
StreamSmart/
│
├── src/
│   ├── Components/
│   ├── Dashboard/
│   ├── landing/
│   ├── videos/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── videoRoutes.js
│   │   └── experimentRoutes.js
│   │
│   ├── uploads/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

*This is a simplified overview of the main project structure.*

---

## ⚙️ Installation & Setup

Follow these steps to run StreamSmart locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB](https://www.mongodb.com/) or MongoDB Atlas
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/MAHESH549990/BYTEFORGE_StreamSmart.git
```

### 2. Navigate to the Project Directory

```bash
cd BYTEFORGE_StreamSmart/StreamSmart
```

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 🔐 Environment Configuration

Create a `.env` file inside the `backend/` directory.

Add the following configuration:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

CLIENT_URL=http://localhost:5173
```

Replace `your_mongodb_connection_string` with your actual MongoDB connection URI.

**Important Security Notes:**

- Never upload your `.env` file to GitHub.
- Keep database credentials and secret keys private.
- Make sure MongoDB is accessible before starting the backend.
- Configure production environment variables separately on your deployment platform.

---

## ▶️ Running the Application

StreamSmart requires the frontend and backend to run separately during local development.

### Terminal 1 — Start Backend

From the backend directory:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Backend health-check endpoint:

```text
http://localhost:5000/api/health
```

### Terminal 2 — Start Frontend

Open another terminal and navigate to the `StreamSmart` project directory:

```bash
cd BYTEFORGE_StreamSmart/StreamSmart
npm run dev
```

Open the application in your browser:

```text
http://localhost:5173
```

---

## 📡 API Overview

The backend exposes the following API route groups:

| Endpoint | Purpose |
|---|---|
| `/api/health` | Backend health check |
| `/api/auth` | Authentication routes |
| `/api/videos` | Video-related operations |
| `/api/experiments` | Experiment-related operations |
| `/uploads` | Uploaded file access |

---

## 🧪 Development Commands

### Frontend Commands

Run these commands from the `StreamSmart/` directory.

| Command | Description |
|---|---|
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start Vite development server |
| `npm run build` | Generate production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |

### Backend Commands

Run these commands from the `StreamSmart/backend/` directory.

| Command | Description |
|---|---|
| `npm install` | Install backend dependencies |
| `npm run dev` | Start backend with Nodemon |
| `npm start` | Start backend with Node.js |

---

## 🚀 Future Enhancements

Some potential areas for further development include:

- Advanced adaptive bitrate optimization algorithms.
- Real-time network monitoring and visualization.
- Intelligent buffering prediction.
- AI-powered streaming quality recommendations.
- Edge computing and CDN performance analysis.
- Advanced Quality of Experience (QoE) evaluation.
- Detailed streaming performance reports.
- Enhanced real-time analytics.

---

## 🔒 Security

StreamSmart uses security-related technologies and practices, including:

- Environment variables for sensitive configuration.
- Password hashing using bcryptjs.
- JWT-based authentication dependencies.
- CORS configuration for frontend-backend communication.
- Private database credentials and environment secrets.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Commit your changes.

```bash
git add .
git commit -m "Add: your feature description"
```

5. Push your branch.

```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request.

---

## 👥 Contributors

StreamSmart is built through the collaborative efforts of our development team.

| Contributor | GitHub Profile |
|---|---|
| **svg185** | [@svg185](https://github.com/svg185) |
| **MAHESH549990** | [@MAHESH549990](https://github.com/MAHESH549990) |
| **Ashi-engf** | [@Ashi-engf](https://github.com/Ashi-engf) |
| **gayatripadalia** | [@gayatripadalia](https://github.com/gayatripadalia) |
| **yjoshioo07** | [@yjoshioo07](https://github.com/yjoshioo07) |

### 🙌 Teamwork Makes It Possible

Thanks to all contributors for their collaboration, creativity, and dedication towards building StreamSmart.

---

## 📄 License

A license has not yet been specified for this repository. Add a `LICENSE` file before distributing the project under a particular open-source license.

---

<p align="center">
  <strong>StreamSmart 🚀</strong>
  <br />
  Smarter Streaming. Better Experience.
  <br /><br />
  <a href="https://byteforge-streamsmart-1.onrender.com/">
    Live Demo
  </a>
  |
  <a href="https://github.com/MAHESH549990/BYTEFORGE_StreamSmart">
    GitHub Repository
  </a>
</p>
