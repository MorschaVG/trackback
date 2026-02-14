import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../hooks/useFavorites.js";
import { deleteFavoriteById } from "../services/noviApiService.js";
import { useEffect, useState } from "react";
import { formatUtcRfc2822NoSecondsNoZone } from "../helpers/formatDate.js";
import SongCard from "../components/SongCard/SongCard.jsx";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
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
            setActionError("Favoriet verwijderen mislukt.");
        } finally {
            setPendingDeleteId(null);
        }
    }

    function handleReplaySearch(item) {
        navigate("/", {
            state: {
                replaySearch: {
                    title: item.title,
                    artist: item.artist,
                    requestId: `${Date.now()}-${item.id}`,
                },
            },
        });
    }

    return (
        <section>
            <h1>Favorites</h1>
            {isLoading ? <p>Favorieten laden...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {actionError ? <p style={{ color: "crimson" }}>{actionError}</p> : null}
            {!isLoading && !error && items.length === 0 ? (
                <p>Je hebt nog geen favorieten.</p>
            ) : null}
            <ul className="song-card-list">
                {items.map((item) => (
                    <li key={item.id}>
                        <SongCard
                            artist={item.artist}
                            title={item.title}
                            year={item.year}
                            verdict={item.verdict}
                            timestamp={formatUtcRfc2822NoSecondsNoZone(item.timestamp)}
                            onSelect={() => handleReplaySearch(item)}
                            selectLabel={`Replay search for ${item.title} by ${item.artist}`}
                            actions={
                                <button
                                    type="button"
                                    onClick={() => handleRemove(item.id)}
                                    disabled={pendingDeleteId === item.id}
                                >
                                    {pendingDeleteId === item.id ? "Removing..." : "Remove"}
                                </button>
                            }
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
