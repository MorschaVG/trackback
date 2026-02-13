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

export async function registerUser({ email, password }) {
    const response = await noviClient.post("/users", {
        email,
        password,
        roles: ["user"],
    });
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

export async function createFavorite(payload, token) {
    const response = await noviClient.post("/favorites", payload, withAuth(token));
    return response.data;
}

export async function createHistoryEntry(payload, token) {
    const response = await noviClient.post("/history", payload, withAuth(token));
    return response.data;
}

export async function deleteFavoriteById(id, token) {
    await noviClient.delete(`/favorites/${id}`, withAuth(token));
}

export async function deleteHistoryById(id, token) {
    await noviClient.delete(`/history/${id}`, withAuth(token));
}
