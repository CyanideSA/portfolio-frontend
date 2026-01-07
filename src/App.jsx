import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AmbientBackground from "./components/AmbientBackground.jsx";
import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import Admin from "./pages/Admin.jsx";
import Contact from "./pages/Contact.jsx";

export default function App() {
  return (
    <div className="min-h-screen text-white">
      <AmbientBackground />
      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-white/50">
        © {new Date().getFullYear()} Suvo Ahmed
      </footer>
    </div>
  );
}
