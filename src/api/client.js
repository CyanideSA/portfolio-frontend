import axios from "axios";

/**
 * PROD (Vercel): set VITE_API_BASE_URL=https://portfolio-f91h.onrender.com
 * DEV (localhost): leave it unset → uses "/api" (vite proxy)
 */

const PROD_FALLBACK_ORIGIN = "https://portfolio-f91h.onrender.com";

const isDev = import.meta.env.DEV;

// If env is set, treat it as an ORIGIN (no /api) OR full /api URL
let raw = import.meta.env?.VITE_API_BASE_URL || (isDev ? "" : PROD_FALLBACK_ORIGIN);
raw = (raw || "").replace(/\/+$/, ""); // trim trailing slashes

let baseURL;

// DEV: use proxy
if (isDev) {
  baseURL = "/api";
} else {
  // PROD: allow both styles:
  // - https://domain.com
  // - https://domain.com/api
  baseURL = raw.endsWith("/api") ? raw : `${raw}/api`;
}

export const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
});

export function setAdminAuth(basicAuth) {
  if (basicAuth) {
    api.defaults.headers.common.Authorization = basicAuth;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Public endpoints
export const getProfile = () => api.get("/profile");
export const getProjects = () => api.get("/projects");
export const sendContactMessage = (payload) => api.post("/contact", payload);

// Admin endpoints (Basic Auth)
export const adminPing = (basicAuth) =>
  api.get("/admin/ping", { headers: { Authorization: basicAuth } });

export const adminUpdateProfile = (profile, basicAuth) =>
  api.put("/admin/profile", profile, { headers: { Authorization: basicAuth } });

export const adminCreateProject = (project, basicAuth) =>
  api.post("/admin/projects", project, { headers: { Authorization: basicAuth } });

export const adminDeleteProject = (id, basicAuth) =>
  api.delete(`/admin/projects/${id}`, { headers: { Authorization: basicAuth } });
