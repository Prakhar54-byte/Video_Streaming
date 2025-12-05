import axios from "axios";

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized and not already on auth pages
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/auth")
      ) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
