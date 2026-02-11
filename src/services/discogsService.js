import { discogsClient } from "./discogsClient.js";

export async function searchReleases(query, token, { perPage = 10, page = 1 } = {}) {
    const endpoint = "/database/search";
    const response = await discogsClient.get(endpoint, {
        params: {
            q: query,
            type: "release",
            per_page: perPage,
            page,
            token,
        },
    });
    return response.data.results;
}

export async function getMaster(masterId, token) {
    if (!masterId) {
        throw new Error("masterId is required");
    }
    const endpoint = `/masters/${masterId}`;
    const response = await discogsClient.get(endpoint, {
        params: { token },
    });
    return response.data;
}

export async function getRelease(releaseId, token) {
    if (!releaseId) {
        throw new Error("releaseId is required");
    }
    const endpoint = `/releases/${releaseId}`;
    const response = await discogsClient.get(endpoint, {
        params: { token },
    });
    return response.data;
}
