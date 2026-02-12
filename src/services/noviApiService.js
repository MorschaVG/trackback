import { noviClient } from "./noviClient.js";

function withAuth(token) {
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
}

export async function loginUser({ email, password }) {
    const response = await noviClient.post("/login", { email, password });
    return response.data;
}

export async function getFavoritesByUser(userId, token) {
    const response = await noviClient.get("/favorites", {
        ...withAuth(token),
        params: {
            userId,
            sort: "-timestamp",
        },
    });
    return response.data;
}

export async function getHistoryByUser(userId, token) {
    const response = await noviClient.get("/history", {
        ...withAuth(token),
        params: {
            userId,
            sort: "-timestamp",
        },
    });
    return response.data;
}

