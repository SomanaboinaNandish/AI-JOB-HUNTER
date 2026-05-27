import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; full_name: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updatePreferences: (prefs: Record<string, unknown>) =>
    api.put("/auth/me/preferences", prefs),
}

// ── Jobs ──────────────────────────────────────────────────────
export const jobsApi = {
  list: (params: Record<string, unknown>) => api.get("/jobs", { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  save: (id: string) => api.post(`/jobs/${id}/save`),
  apply: (id: string) => api.post(`/jobs/${id}/apply`),
  saved: () => api.get("/jobs/saved/list"),
  applied: () => api.get("/jobs/applied/list"),
}

// ── Resume ────────────────────────────────────────────────────
export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post("/resume/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  me: () => api.get("/resume/me"),
  match: (jobId: string) => api.post(`/resume/match/${jobId}`),
  coverLetter: (jobId: string) => api.post(`/resume/cover-letter/${jobId}`),
  analysis: () => api.get("/resume/analysis"),
}

// ── Search ────────────────────────────────────────────────────
export const searchApi = {
  semantic: (q: string, page = 1) => api.get("/search", { params: { q, page } }),
  suggestions: (q: string) => api.get("/search/suggestions", { params: { q } }),
}

// ── Analytics ────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get("/analytics/dashboard"),
}

// ── Notifications ────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
}

// ── Agents ───────────────────────────────────────────────────
export const agentsApi = {
  triggerSearch: () => api.post("/agents/trigger/search"),
  triggerMatch: () => api.post("/agents/trigger/match"),
  status: () => api.get("/agents/status"),
}
