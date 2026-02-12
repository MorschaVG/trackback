import axios from "axios";

const baseURL = import.meta.env.VITE_NOVI_API_BASE_URL;
const projectId = import.meta.env.VITE_NOVI_PROJECT_ID;
const projectHeader =
    import.meta.env.VITE_NOVI_PROJECT_HEADER || "novi-education-project-id";

export const noviClient = axios.create({
    baseURL,
});

noviClient.interceptors.request.use((config) => {
    if (projectId) {
        config.headers[projectHeader] = projectId;
    }
    return config;
});
