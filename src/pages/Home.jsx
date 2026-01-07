import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getProfile } from "../api/client.js";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setErr("Could not load profile from backend."));
  }, []);

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionTitle
          eyebrow="FULL-STACK DEVELOPER"
          title={profile?.name ?? "Loading…"}
          subtitle={profile?.title ?? "Connecting to backend…"}
        />

        <GlassCard className="p-6">
          <p className="text-white/70 leading-relaxed">
            {err ? err : profile?.bio ?? "Please ensure backend is running and /api/profile returns JSON."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="text-xs rounded-full bg-white/10 px-3 py-1">Java</span>
            <span className="text-xs rounded-full bg-white/10 px-3 py-1">Spring Boot</span>
            <span className="text-xs rounded-full bg-white/10 px-3 py-1">React</span>
            <span className="text-xs rounded-full bg-white/10 px-3 py-1">MySQL</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
