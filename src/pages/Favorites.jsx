import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../hooks/useFavorites.js";
import { deleteFavoriteById } from "../services/noviApiService.js";
import { useEffect, useState } from "react";
import { formatUtcRfc2822NoSecondsNoZone } from "../helpers/formatDate.js";

export default function Favorites() {
    const { user, token } = useAuth();
    const { favorites, isLoading, error } = useFavorites(user?.userId, token);
    const [items, setItems] = useState([]);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        setItems(favorites);
    }, [favorites]);

    async function handleRemove(itemId) {
        setActionError("");
        setPendingDeleteId(itemId);
        try {
            await deleteFavoriteById(itemId, token);
            setItems((current) => current.filter((item) => item.id !== itemId));
        } catch {
            setActionError("Could not remove favorite.");
        } finally {
            setPendingDeleteId(null);
        }
    }

    return (
        <section>
            <h1>Favorites</h1>
            {isLoading ? <p>Loading favorites...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {actionError ? <p style={{ color: "crimson" }}>{actionError}</p> : null}
            {!isLoading && !error && items.length === 0 ? (
                <p>No favorites yet.</p>
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
                        {" "}
                        <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            disabled={pendingDeleteId === item.id}
                        >
                            {pendingDeleteId === item.id ? "Removing..." : "Remove"}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
