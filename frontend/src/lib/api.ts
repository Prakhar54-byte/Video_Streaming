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
    // Add token from localStorage if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
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
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1"}/users/refresh-token`,
            { refreshToken },
            { withCredentials: true },
          );

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } =
              response.data.data;

            // Update tokens
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            // Update header and retry request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Fall through to redirect
      }

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
