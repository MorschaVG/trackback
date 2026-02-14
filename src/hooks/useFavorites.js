import { useEffect, useState } from "react";
import { getFavoritesByUser } from "../services/noviApiService.js";

export function useFavorites(userId, token) {
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!userId || !token) return;
        let isMounted = true;
        async function loadFavorites() {
            setIsLoading(true);
            setError("");
            try {
                const data = await getFavoritesByUser(userId, token);
                if (isMounted) {
                    setFavorites(Array.isArray(data) ? data : []);
                }
            } catch {
                if (isMounted) {
                    setError("Favorieten laden mislukt.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        loadFavorites();
        return () => {
            isMounted = false;
        };
    }, [userId, token]);

    return { favorites, isLoading, error };
}
