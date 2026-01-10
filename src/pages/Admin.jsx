import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { api, adminUpdateProfile, adminCreateProject, adminDeleteProject } from "../api/client.js";

function toBasicAuth(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}

async function validateAdminAuth(authHeader) {
  // Any status other than 401/403 means auth worked (even 404/405 is fine)
  const res = await api.get("/admin/profile", {
    headers: { Authorization: authHeader },
    validateStatus: () => true,
  });
  return res.status !== 401 && res.status !== 403;
}

export default function Admin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const [auth, setAuth] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [loginStatus, setLoginStatus] = useState(""); // messages for login only
  const [status, setStatus] = useState(""); // messages for admin actions

  const [profile, setProfile] = useState({ name: "", title: "", bio: "" });
  const [project, setProject] = useState({
    title: "",
    description: "",
    techStack: "",
    githubUrl: "",
    liveUrl: "",
  });
  const [deleteId, setDeleteId] = useState("");

  // Optional: keep login across refresh (session)
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_basic_auth");
    if (!saved) return;

    (async () => {
      const ok = await validateAdminAuth(saved);
      if (ok) {
        setAuth(saved);
        setLoggedIn(true);
        setLoginStatus("");
      } else {
        sessionStorage.removeItem("admin_basic_auth");
      }
    })();
  }, []);

  const candidateAuth = useMemo(() => {
    if (!user || !pass) return "";
    return toBasicAuth(user, pass);
  }, [user, pass]);

  async function onLogin(e) {
    e.preventDefault();
    setLoginStatus("Checking credentials...");

    if (!candidateAuth) {
      setLoginStatus("❌ Enter username and password");
      return;
    }

    try {
      const ok = await validateAdminAuth(candidateAuth);
      if (!ok) {
        setLoginStatus("❌ Wrong username or password");
        return;
      }

      setAuth(candidateAuth);
      setLoggedIn(true);
      sessionStorage.setItem("admin_basic_auth", candidateAuth);
      setLoginStatus("✅ Logged in!");
    } catch {
      setLoginStatus("❌ Could not reach backend!");
    }
  }

  function onLogout() {
    setLoggedIn(false);
    setAuth("");
    setUser("");
    setPass("");
    setLoginStatus("");
    setStatus("");
    sessionStorage.removeItem("admin_basic_auth");
  }

  async function onSaveProfile() {
    try {
      setStatus("Saving profile…");
      await adminUpdateProfile(profile, auth);
      setStatus("✅ Profile updated");
    } catch {
      setStatus("❌ Failed (check backend /api/admin/** + auth)");
    }
  }

  async function onCreateProject() {
    try {
      setStatus("Creating project…");
      await adminCreateProject(project, auth);
      setStatus("✅ Project created");
      setProject({ title: "", description: "", techStack: "", githubUrl: "", liveUrl: "" });
    } catch {
      setStatus("❌ Failed (check backend /api/admin/** + auth)");
    }
  }

  async function onDeleteProject() {
    try {
      setStatus("Deleting project…");
      await adminDeleteProject(deleteId, auth);
      setStatus("✅ Project deleted");
      setDeleteId("");
    } catch {
      setStatus("❌ Failed (check backend /api/admin/** + auth)");
    }
  }

  // ---------------- UI ----------------
  if (!loggedIn) {
    return (
      <div className="space-y-6">
        <SectionTitle
          eyebrow="ADMIN"
          title="Login"
          subtitle="Enter credentials to unlock editing."
        />

        <GlassCard className="p-6 space-y-4">
          <form onSubmit={onLogin} className="space-y-3">
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              placeholder="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              placeholder="password"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />

            <button
              type="submit"
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
            >
              Login
            </button>

            {loginStatus && <div className="text-sm text-white/70">{loginStatus}</div>}

            <div className="text-xs text-white/50">
              Only Admin has access to log in!
            </div>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="ADMIN"
        title="Edit portfolio"
        subtitle="You’re logged in. Changes are sent to Spring Boot admin endpoints."
      />

      <div className="flex items-center gap-3">
        <button
          onClick={onLogout}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          type="button"
        >
          Logout
        </button>
        {status && <div className="text-sm text-white/70">{status}</div>}
      </div>

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
          type="button"
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
          onChange={(e) => setProject({ ...project, description: e.target.value })}
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Tech Stack (comma separated)"
          value={project.techStack}
          onChange={(e) => setProject({ ...project, techStack: e.target.value })}
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="GitHub URL"
          value={project.githubUrl}
          onChange={(e) => setProject({ ...project, githubUrl: e.target.value })}
        />
        <input
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          placeholder="Live URL"
          value={project.liveUrl}
          onChange={(e) => setProject({ ...project, liveUrl: e.target.value })}
        />
        <button
          onClick={onCreateProject}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          type="button"
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
          type="button"
        >
          Delete
        </button>
      </GlassCard>
    </div>
  );
}
