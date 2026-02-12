import { useEffect, useState } from "react";
import { getHistoryByUser } from "../services/noviApiService.js";

export function useHistory(userId, token) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!userId || !token) return;
        let isMounted = true;
        async function loadHistory() {
            setIsLoading(true);
            setError("");
            try {
                const data = await getHistoryByUser(userId, token);
                if (isMounted) {
                    setHistory(Array.isArray(data) ? data : []);
                }
            } catch {
                if (isMounted) {
                    setError("Could not load history.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        loadHistory();
        return () => {
            isMounted = false;
        };
    }, [userId, token]);

    return { history, isLoading, error };
}
