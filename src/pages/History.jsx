import { useAuth } from "../context/AuthContext.jsx";
import { useHistory } from "../hooks/useHistory.js";
import { deleteHistoryById } from "../services/noviApiService.js";
import { useEffect, useState } from "react";
import { formatUtcRfc2822NoSecondsNoZone } from "../helpers/formatDate.js";

export default function History() {
    const { user, token } = useAuth();
    const { history, isLoading, error } = useHistory(user?.userId, token);
    const [items, setItems] = useState([]);
    const [isClearing, setIsClearing] = useState(false);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        setItems(history);
    }, [history]);

    async function handleClearHistory() {
        if (items.length === 0) return;
        setActionError("");
        setIsClearing(true);
        try {
            await Promise.all(items.map((item) => deleteHistoryById(item.id, token)));
            setItems([]);
        } catch {
            setActionError("Could not clear history.");
        } finally {
            setIsClearing(false);
        }
    }

    return (
        <section>
            <h1>History</h1>
            <button
                type="button"
                onClick={handleClearHistory}
                disabled={isLoading || isClearing || items.length === 0}
            >
                {isClearing ? "Clearing..." : "Clear history"}
            </button>
            {isLoading ? <p>Loading history...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {actionError ? <p style={{ color: "crimson" }}>{actionError}</p> : null}
            {!isLoading && !error && items.length === 0 ? (
                <p>No history yet.</p>
            ) : null}
            <ul>
                {items.map((item) => (
                    <li key={item.id}>
                        {item.artist} - {item.title}
                        {item.year ? ` (${item.year})` : ""}
                        {" | "}
                        {item.verdict}
                        {" | "}
                        {formatUtcRfc2822NoSecondsNoZone(item.timestamp)}
                    </li>
                ))}
            </ul>
        </section>
    );
}
