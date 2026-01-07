import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  [
    "px-3 py-2 rounded-lg text-sm transition",
    isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
  ].join(" ");

export default function Navbar() {
  return (
    <header className="relative z-10 sticky top-0 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold tracking-wide">
          <span className="text-white">Suvo</span>
          <span className="text-white/50">.</span>
        </div>

        <nav className="flex gap-2">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>
        </nav>
      </div>
    </header>
  );
}
