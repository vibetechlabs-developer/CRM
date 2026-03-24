import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || "";

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !url.includes("/api/auth/login/") &&
      !url.includes("/api/auth/refresh/") &&
      !url.includes("/api/auth/logout/")
    ) {
      originalRequest._retry = true;

      try {
        // Refresh is handled via HttpOnly cookie on the backend.
        await api.post(`/api/auth/refresh/`, {});
        return api(originalRequest);
      } catch (err) {
        // Refresh expired/invalid -> send user to login
        if (window.location.pathname !== "/login") {
          window.dispatchEvent(new Event("auth:unauthorized"));
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export const fetchAllPages = async (url: string) => {
  let results: unknown[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await api.get(nextUrl);
    
    if (response.data && Array.isArray(response.data.results)) {
      results = [...results, ...response.data.results];
      nextUrl = response.data.next;
      
      // If DRF returns an absolute URL for next, convert it to a relative patch
      // since the api client automatically prepends baseURL.
      if (nextUrl && nextUrl.startsWith('http')) {
        const urlObj = new URL(nextUrl);
        nextUrl = urlObj.pathname + urlObj.search;
      }
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      break;
    }
  }

  return results;
};

export default api;