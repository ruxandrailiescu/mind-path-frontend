import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorResponse: ApiError = {
      message: "An unexpected error occurred",
      status: error.response?.status || 500,
      data: error.response?.data,
    };

    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;

      if (data.detail && typeof data.detail === "string") {
        errorResponse.message = data.detail;
      } else if (data.message && typeof data.message === "string") {
        errorResponse.message = data.message;
      } else if (typeof data === "object" && !Array.isArray(data)) {
        const fieldErrors = Object.values(data)
          .filter((value): value is string => typeof value === "string")
          .join(", ");

        if (fieldErrors) {
          errorResponse.message = fieldErrors;
        }
      }
    }

    return Promise.reject(errorResponse);
  }
);

export default apiClient;
