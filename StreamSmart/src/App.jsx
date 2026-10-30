import { Routes, Route } from "react-router-dom";

import Navbar from "./Components/navbar";
import Footer from "./Components/footer";
import Login from "./form/login";

function App() {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;