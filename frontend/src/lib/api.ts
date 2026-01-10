import axios from 'axios';

// Singleton for handling token refresh queue
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // console.log(`[API] Attaching token to ${config.url}:`, token.substring(0, 10) + "...");
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // console.warn(`[API] No access token found for ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // console.error(`[API] Error for ${originalRequest?.url}:`, error.response?.status, error.message);

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        console.log("[API] Refresh already in progress, queuing request to", originalRequest.url);
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      console.log("[API] 401 detected. Starting token refresh...");
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // console.log("[API] Found refreshToken, calling /users/refresh-token");
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1'}/users/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );

          if (response.data.success) {
            console.log("[API] Token refresh successful");
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            // Update tokens in active storage
            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            
            // --- FIX: Sync with account_tokens for Multi-Account support ---
            try {
              // Decode user ID from JWT (middle part)
              const payloadPart = accessToken.split('.')[1];
              if (payloadPart) {
                const decodedJson = JSON.parse(atob(payloadPart));
                const userId = decodedJson._id;

                if (userId) {
                   const accountTokensStr = localStorage.getItem("account_tokens");
                   const currentMap = accountTokensStr ? JSON.parse(accountTokensStr) : {};
                   
                   // Update the record for the current user
                   currentMap[userId] = {
                       accessToken: accessToken,
                       refreshToken: newRefreshToken || currentMap[userId]?.refreshToken
                   };
                   
                   localStorage.setItem("account_tokens", JSON.stringify(currentMap));
                   console.log("[API] Updated account_tokens map for user:", userId);
                }
              }
            } catch (syncErr) {
               console.error("[API] Failed to sync account_tokens:", syncErr);
            }
            // -------------------------------------------------------------

            // Update header and retry request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            // Process queue
            processQueue(null, accessToken);
            
            return apiClient(originalRequest);
          } else {
            console.error("[API] Token refresh response failed:", response.data);
            processQueue(new Error("Token refresh response failed"), null);
          }
        } else {
            console.warn("[API] No refreshToken found in localStorage");
            processQueue(new Error("No refresh token"), null);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError, null);
        // Fall through to redirect
      } finally {
        isRefreshing = false;
      }

      // Redirect to login if unauthorized and not already on auth pages
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        console.log("[API] Redirecting to login due to 401 and failed refresh");
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
