import React, { useMemo, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Welcome from "./components/Welcome.jsx";
import WaterNav from "./components/WaterNav.jsx";

import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import Admin from "./pages/Admin.jsx";
import Contact from "./pages/Contact.jsx";

// ✅ Your background photo for the whole portfolio:
import suvoPhoto from "./assets/suvo.jpg";

export default function App() {
  const [entered, setEntered] = useState(false);
  const location = useLocation();

  const buttons = useMemo(
    () => [
      { id: "admin", label: "Admin", to: "/admin", pos: "topRight" },
      { id: "home", label: "Home", to: "/", pos: "topLeft" },
      { id: "projects", label: "Projects", to: "/projects", pos: "bottomLeft" },
      { id: "contact", label: "Contact", to: "/contact", pos: "bottomRight" },
    ],
    []
  );

  return (
    // ✅ Provide background image to CSS via variable
    <div className="appRoot" style={{ "--app-bg": `url(${suvoPhoto})` }}>
      {/* Welcome panel slides+fades away */}
      <Welcome entered={entered} onEnter={() => setEntered(true)} />

      {/* Site fades in as welcome fades out */}
      <div className={`siteShell ${entered ? "entered" : ""}`}>
        <WaterNav buttons={buttons} />

        <div className="pageStage">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="pageMotion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
