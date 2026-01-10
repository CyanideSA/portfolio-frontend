import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Use your existing pages:
import Home from "../pages/Home.jsx";
import Projects from "../pages/Projects.jsx";
import Contact from "../pages/Contact.jsx";
import Admin from "../pages/Admin.jsx";

const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="pageStage">
      {/* black overlay during transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.key + "-overlay"}
          className="blackOverlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 1, transition: { duration: 0.5 } }}
        />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={page}
          initial="initial"
          animate="animate"
          exit="exit"
          className="pageWrap"
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
  );
}
