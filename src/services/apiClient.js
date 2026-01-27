import axios from "axios";

const DISCOGS_TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;

export const discogsClient = axios.create({
    baseURL: "https://api.discogs.com",
    headers: {
        Authorization: `Discogs token=${DISCOGS_TOKEN}`,
    },
});