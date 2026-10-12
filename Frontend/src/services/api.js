import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

let refreshRequest;
let refreshFailureHandler;

export function setRefreshFailureHandler(handler) {
  refreshFailureHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url;
    const isSessionRequest = [
      "/auth/login",
      "/auth/refresh",
      "/auth/logout"
    ].includes(requestUrl);

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isSessionRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest ??= api
        .post("/auth/refresh")
        .catch((refreshError) => {
          refreshFailureHandler?.();
          throw refreshError;
        })
        .finally(() => {
          refreshRequest = undefined;
        });
      await refreshRequest;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;