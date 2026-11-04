
import axios from "axios";

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
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

        // Let Axios/browser set the multipart boundary for FormData.
        if (typeof FormData !== "undefined" && config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else if (config.data) {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default API;
