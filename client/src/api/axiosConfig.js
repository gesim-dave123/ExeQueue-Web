import axios from "axios";
import backendConnection from "./backendConnection.js";

// Helper function for backend URL
const getBackendURL = () => {
  return backendConnection() || "http://localhost:5000";
};

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: getBackendURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Public endpoints that don't need auth token
const publicEndpoints = [
  "/api/auth/staff/login",
  "/api/auth/getOTP",
  "/api/auth/verify-email",
  "/api/auth/reset-password",
  "/api/auth/staff/check-login",
];

axiosInstance.interceptors.request.use(
  (config) => {
    console.log("URL: ", config?.url);
    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    // Check if Authorization header is already set manually
    const hasManualAuth = config.headers.Authorization;

    // Only add token if:
    // 1. Not a public endpoint
    // 2. No manual Authorization header
    if (!isPublicEndpoint && !hasManualAuth) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code within 2xx triggers this function
    return response;
  },
  (error) => {
    // Any status code outside 2xx triggers this function

    if (error.response) {
      const { status } = error.response;

      // Handle 401 Unauthorized (token expired/invalid)
      if (status === 401) {
        localStorage.removeItem("auth_token");

        // Optional: Redirect to login (uncomment if needed)
        // window.location.href = '/login';
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error("Access forbidden");
      }

      // Handle 500 Server Error
      if (status === 500) {
        console.error("Server error occurred");
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("No response from server");
    } else {
      // Something else happened
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
