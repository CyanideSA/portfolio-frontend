import axios from "axios";

/**
 * Vite env var (recommended):
 *   VITE_API_BASE_URL=https://portfolio-f91h.onrender.com/api
 *
 * Fallback:
 *   https://portfolio-f91h.onrender.com/api
 */
const FALLBACK_API = "https://portfolio-f91h.onrender.com/api";

// If you set VITE_API_BASE_URL, we use it. Otherwise use Render fallback.
let baseURL = import.meta.env?.VITE_API_BASE_URL || FALLBACK_API;

// Normalize: remove trailing slash (avoids // in requests)
baseURL = baseURL.replace(/\/+$/, "");

// Normalize: ensure it ends with /api (avoid missing api or double api)
if (!baseURL.endsWith("/api")) baseURL += "/api";

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Public endpoints
export const getProfile = () => api.get("/profile");
export const getProjects = () => api.get("/projects");
export const sendContactMessage = (payload) => api.post("/contact", payload);

// Admin endpoints (Basic Auth)
export const adminUpdateProfile = (profile, basicAuth) =>
  api.put("/admin/profile", profile, { headers: { Authorization: basicAuth } });

export const adminCreateProject = (project, basicAuth) =>
  api.post("/admin/projects", project, { headers: { Authorization: basicAuth } });

export const adminDeleteProject = (id, basicAuth) =>
  api.delete(`/admin/projects/${id}`, { headers: { Authorization: basicAuth } });
