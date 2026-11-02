import axios from "axios";

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

API.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const organizationId = localStorage.getItem("organizationId");

      if (token) {
        config.headers.token = token;
      }

      if (organizationId) {
        config.headers["x-organization-id"] = organizationId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default API;