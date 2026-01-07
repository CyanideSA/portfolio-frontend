import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionTitle from "../components/SectionTitle.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import { getProjects } from "../api/Client.js";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    getProjects()
      .then((res) => setProjects(res.data ?? []))
      .catch(() => setErr("Could not load projects from backend."));
  }, []);

  return (
    <div>
      <SectionTitle
        eyebrow="WORK"
        title="Projects"
        subtitle="A selection of things I’ve built (loaded from Spring Boot)."
      />

      {err && <p className="text-red-300 mb-5">{err}</p>}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {projects.length === 0 ? (
          <p className="text-white/60">No projects found. Add some in DB or via Admin API.</p>
        ) : (
          projects.map((p) => <ProjectCard key={p.id ?? p.title} project={p} />)
        )}
      </motion.div>
    </div>
  );
}
