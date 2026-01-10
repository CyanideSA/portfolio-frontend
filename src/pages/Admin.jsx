import { useMemo, useState } from "react";
import GlassCard from "../components/GlassCard.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import {
  adminUpdateProfile,
  adminCreateProject,
  adminDeleteProject,
} from "../api/client.js";

function toBasicAuth(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}

export default function Admin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const auth = useMemo(() => {
    if (!user || !pass) return "";
    return toBasicAuth(user, pass);
  }, [user, pass]);

  const [profile, setProfile] = useState({ name: "", title: "", bio: "" });
  const [project, setProject] = useState({
    title: "",
    description: "",
    techStack: "",
    githubUrl: "",
    liveUrl: "",
  });
  const [deleteId, setDeleteId] = useState("");
  const [status, setStatus] = useState("");

  async function onSaveProfile() {
    try {
      setStatus("Saving profile…");
      await adminUpdateProfile(profile, auth);
      setStatus("✅ Profile updated");
    } catch {
      setStatus("❌ Failed (check backend admin endpoint + auth)");
    }
  }

  async function onCreateProject() {
    try {
      setStatus("Creating project…");
      await adminCreateProject(project, auth);
      setStatus("✅ Project created");
    } catch {
      setStatus("❌ Failed (check backend admin endpoint + auth)");
    }
  }

  async function onDeleteProject() {
    try {
      setStatus("Deleting project…");
      await adminDeleteProject(deleteId, auth);
      setStatus("✅ Project deleted");
    } catch {
      setStatus("❌ Failed (check backend admin endpoint + auth)");
    }
  }

  return (
    <div className="page space-y-6">
      <SectionTitle
        eyebrow="ADMIN"
        title="Edit content"
        subtitle="This UI sends requests to your Spring Boot admin endpoints."
      />

      <GlassCard className="p-6 space-y-4">
        <div className="text-sm text-white/70">
          Admin Login (Basic Auth) — use the username/password you set in backend
          (Render env vars or application.properties).
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
            placeholder="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
            placeholder="password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <div className="text-xs text-white/60">
          Auth header preview:{" "}
          <span className="break-all">{auth || "(enter credentials)"}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-3">
        <div className="font-semibold">Update Profile</div>
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Title"
          value={profile.title}
          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
        />
        <textarea
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none min-h-[120px]"
          placeholder="Bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        />
        <button
          onClick={onSaveProfile}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          disabled={!auth}
          title={!auth ? "Enter username + password first" : ""}
        >
          Save Profile
        </button>
      </GlassCard>

      <GlassCard className="p-6 space-y-3">
        <div className="font-semibold">Create Project</div>
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Title"
          value={project.title}
          onChange={(e) => setProject({ ...project, title: e.target.value })}
        />
        <textarea
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none min-h-[110px]"
          placeholder="Description"
          value={project.description}
          onChange={(e) =>
            setProject({ ...project, description: e.target.value })
          }
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Tech Stack (comma separated)"
          value={project.techStack}
          onChange={(e) =>
            setProject({ ...project, techStack: e.target.value })
          }
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="GitHub URL"
          value={project.githubUrl}
          onChange={(e) =>
            setProject({ ...project, githubUrl: e.target.value })
          }
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Live URL"
          value={project.liveUrl}
          onChange={(e) =>
            setProject({ ...project, liveUrl: e.target.value })
          }
        />
        <button
          onClick={onCreateProject}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          disabled={!auth}
          title={!auth ? "Enter username + password first" : ""}
        >
          Create Project
        </button>
      </GlassCard>

      <GlassCard className="p-6 space-y-3">
        <div className="font-semibold">Delete Project</div>
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Project ID"
          value={deleteId}
          onChange={(e) => setDeleteId(e.target.value)}
        />
        <button
          onClick={onDeleteProject}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          disabled={!auth || !deleteId}
          title={!auth ? "Enter username + password first" : ""}
        >
          Delete
        </button>
      </GlassCard>

      {status && <p className="text-white/70">{status}</p>}
    </div>
  );
}
