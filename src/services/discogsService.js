import { discogsClient } from "./discogsClient.js";

export async function searchReleases(query, token) {
    const endpoint = "/database/search";
    const response = await discogsClient.get(endpoint, {
        params: {
            q: query,
            type: "release",
            token,
        },
    });
    return response.data.results;
}
