import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Load base URL from .env (fallback to '/api' if not set)
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const instance = axios.create({
  baseURL,
});

// ✨ Auth-related endpoints: login/register etc. (no token needed)
const NO_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// 🔐 REQUEST INTERCEPTOR – attach token safely
instance.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const token = localStorage.getItem("token");

    // 1️⃣ For login/register/etc → ignore token completely
    if (NO_AUTH_PATHS.some((p) => url.includes(p))) {
      return config;
    }

    // 2️⃣ No token → normal request (public routes)
    if (!token) return config;

    try {
      const decoded = jwtDecode(token);

      if (decoded?.exp) {
        const isExpired = Date.now() >= decoded.exp * 1000;

        if (isExpired) {
          console.warn("⏰ JWT expired, clearing and forcing logout");
          localStorage.clear();
          window.dispatchEvent(new Event("force-logout"));
          // ❗ IMPORTANT: don't block the request, just don't attach token
          return config;
        }
      }

      // ✅ Valid token → attach header
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.error("⚠️ Invalid token in localStorage, clearing…", err);
      localStorage.clear();
      window.dispatchEvent(new Event("force-logout"));
      // again, let request go without token
      return config;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🌐 RESPONSE INTERCEPTOR – handle 401 (protected routes only)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const token = localStorage.getItem("token");

    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/google") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    const is401 = status === 401;

    // 401 from protected APIs only
    if (is401 && token && !isAuthEndpoint) {
      console.warn("🔒 401 on protected endpoint, logging out");
      localStorage.clear();
      window.dispatchEvent(new Event("force-logout"));
    }

    return Promise.reject(error);
  }
);

export default instance;
