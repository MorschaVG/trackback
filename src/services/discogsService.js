import { discogsClient } from "./apiClient.js";

export async function searchReleases(query) {
    const response = await discogsClient.get("/database/search", {
        params: {
            q: query,
            type: "release",
        },
    });
    return response.data.results;
}