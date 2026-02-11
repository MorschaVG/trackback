import axios from "axios";

export const discogsClient = axios.create({
    baseURL: "/discogs",
});
