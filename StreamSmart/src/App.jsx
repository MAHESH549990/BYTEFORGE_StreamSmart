import Navbar from "./Components/navbar";
import Footer from "./Components/footer";
import Dashboard from "./Components/Dashboard";

function App() {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <Dashboard/>
      </main>

      <Footer />
    </div>
  );
}

export default App;