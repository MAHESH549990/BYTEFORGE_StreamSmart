
import { Routes, Route } from "react-router-dom";

import Navbar from "./Components/navbar";
import Footer from "./Components/footer";

import Login from "./form/login";
import Register from "./form/register";

function App() {
  console.log("Updated StreamSmart App is running");

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="*"
            element={<h2>404 - Page Not Found</h2>}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
