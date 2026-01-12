import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Welcome from "./components/Welcome.jsx";
import WaterNav from "./components/WaterNav.jsx";

import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import Admin from "./pages/Admin.jsx";
import Contact from "./pages/Contact.jsx";

// ✅ Live chat
import LiveChatWidget from "./components/LiveChatWidget.jsx";
import LiveChat from "./pages/LiveChat.jsx";

// ✅ Global admin auth (so refresh on /admin/live-chat stays logged in)
import { setAdminAuth } from "./api/client.js";

// ✅ Your background photo for the whole portfolio:
import suvoPhoto from "./assets/suvo.jpg";

export default function App() {
  const [entered, setEntered] = useState(false);
  const location = useLocation();

  const isAdminArea = location.pathname.startsWith("/admin");

  // ✅ Apply saved admin auth globally on app load (works for admin + live chat page)
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_basic_auth");
    if (saved) setAdminAuth(saved);
  }, []);

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
    <div className="appRoot" style={{ "--app-bg": `url(${suvoPhoto})` }}>
      {/* Welcome panel */}
      <Welcome entered={entered} onEnter={() => setEntered(true)} />

      {/* Site fades in as welcome fades out */}
      <div className={`siteShell ${entered ? "entered" : ""}`}>
        <WaterNav buttons={buttons} />

        {/* ✅ Visitor live chat widget:
            - only after welcome entered
            - hidden on /admin pages (admin uses /admin/live-chat page instead)
            - inline launcher only on /contact
        */}
        {entered && !isAdminArea && (
          <LiveChatWidget inlineOnContact={location.pathname === "/contact"} />
        )}

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

                {/* Admin */}
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/live-chat" element={<LiveChat />} />
              </Routes>

              <div style={{ height: 24 }} />
            </motion.div>
          </AnimatePresence>

          {/* Footer (stable) */}
          <footer
            style={{
              padding: "18px",
              textAlign: "center",
              color: "rgba(255,255,255,0.7)",
              fontSize: "14px",
            }}
          >
            © {new Date().getFullYear()} CyanideSA. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
