import { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getProfile, sendContactMessage } from "../api/client.js";

export default function Contact() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("Sending…");
    try {
      await sendContactMessage(form);
      setStatus("✅ Sent! I’ll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("❌ Could not send. Please try again later.");
    }
  }

  return (
    <div className="page space-y-6">
      <SectionTitle
        eyebrow="CONTACT"
        title="Let’s talk"
        subtitle="Send a message or reach me via email and social links."
      />

      <div className="grid md:grid-cols-2 gap-5">
        <GlassCard className="p-6 space-y-3">
          <div className="text-sm text-white/70">Direct</div>

          <p className="text-white/70">
            Email:{" "}
            <a
              className="text-white hover:underline"
              href={profile?.email ? `mailto:${profile.email}` : "#"}
            >
              {profile?.email ?? "(connect backend to load)"}
            </a>
          </p>

          <p className="text-white/70">
            GitHub:{" "}
            {profile?.github ? (
              <a
                className="text-white hover:underline"
                href={profile.github}
                target="_blank"
                rel="noreferrer"
              >
                {profile.github.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <span className="text-white/60">(connect backend to load)</span>
            )}
          </p>

          <p className="text-white/70">
            LinkedIn:{" "}
            {profile?.linkedin ? (
              <a
                className="text-white hover:underline"
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                {profile.linkedin.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <span className="text-white/60">(connect backend to load)</span>
            )}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm text-white/70 mb-3">Send a message</div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              placeholder="Your email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <textarea
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none min-h-[140px]"
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />

            <button
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
              type="submit"
            >
              Send
            </button>

            {status && <div className="text-sm text-white/70">{status}</div>}
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
