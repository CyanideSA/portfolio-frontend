import axios from "axios";

// Priority:
// 1) VITE_API_BASE_URL (set in Vercel/Netlify env vars)
// 2) If dev mode -> localhost
// 3) Otherwise -> your Render backend
const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.MODE === "development"
    ? "http://localhost:8080/api"
    : "https://portfolio-f91h.onrender.com/api");

export const api = axios.create({ baseURL });

export const getProfile = () => api.get("/profile");
export const getProjects = () => api.get("/projects");
export const saveProfile = (data) => api.put("/profile", data);
