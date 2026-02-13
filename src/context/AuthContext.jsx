/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginUser } from "../services/noviApiService.js";

const AUTH_STORAGE_KEY = "trackback.auth";

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(normalized);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function getTokenExpiryMs(token) {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp || typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
}

function isTokenExpired(token) {
    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return false;
    return Date.now() >= expiryMs;
}

function buildUser(loginResponse, token) {
    const payload = decodeJwtPayload(token);
    const responseUser = loginResponse?.user || {};
    const userId = payload?.userId ?? responseUser.id ?? null;
    const email = responseUser.email ?? payload?.email ?? "";
    const rawRoles = responseUser.roles ?? payload?.role ?? [];
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    return { userId, email, roles };
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
            setIsAuthLoading(false);
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.token && parsed?.user) {
                if (isTokenExpired(parsed.token)) {
                    localStorage.removeItem(AUTH_STORAGE_KEY);
                    setIsAuthLoading(false);
                    return;
                }
                setToken(parsed.token);
                setUser(parsed.user);
            } else {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            }
        } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    async function login(credentials) {
        const response = await loginUser(credentials);
        const nextToken = response?.token;
        if (!nextToken) {
            throw new Error("Login succeeded without token.");
        }
        const nextUser = buildUser(response, nextToken);
        setToken(nextToken);
        setUser(nextUser);
        localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ token: nextToken, user: nextUser })
        );
    }

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }, []);

    useEffect(() => {
        if (!token) return undefined;
        const expiryMs = getTokenExpiryMs(token);
        if (!expiryMs) return undefined;

        const timeoutMs = expiryMs - Date.now();
        if (timeoutMs <= 0) {
            logout();
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            logout();
        }, timeoutMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [token, logout]);

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token),
            isAuthLoading,
            login,
            logout,
        }),
        [token, user, isAuthLoading, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }
    return context;
}
