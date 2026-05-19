import axios from "axios";

let API_URL = "http://localhost:8000/api";

try {
  const domainsRaw = import.meta.env.VITE_API_DOMAINS;

  if (domainsRaw) {
    const apiDomains = JSON.parse(domainsRaw);
    const currentHost = window.location.hostname;

    // Matched loop using Object.entries
    for (const [domain, apiUrl] of Object.entries(apiDomains)) {
      if (currentHost.includes(domain)) {
        API_URL = apiUrl;
        break;
      }
    }
  } else if (import.meta.env.VITE_API_URL) {
    API_URL = import.meta.env.VITE_API_URL;
  }
} catch (error) {
  console.error("Error setting API URL:", error);
}

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem("accessToken", response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

          return api(originalRequest);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
