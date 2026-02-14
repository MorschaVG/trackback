import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../hooks/useFavorites.js";
import { deleteFavoriteById } from "../services/noviApiService.js";
import { useEffect, useState } from "react";
import { formatUtcRfc2822NoSecondsNoZone } from "../helpers/formatDate.js";
import SongCard from "../components/SongCard/SongCard.jsx";
import { useNavigate } from "react-router-dom";
import trashIcon from "../assets/trash-bin-icon-flat-by-Vexels.png";
import "./Favorites.css";

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
            <p className="favorites-intro">Jouw opgeslagen zoekopdrachten:</p>
            <p className="favorites-tip">
                <span className="favorites-tip__label">Tip:</span> Klik op de titel van een opgeslagen zoekopdracht om die opnieuw te activeren. Dan kun je ook weer de andere versies bekijken!
            </p>
            {isLoading ? <p>Favorieten laden...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {actionError ? <p style={{ color: "crimson" }}>{actionError}</p> : null}
            {!isLoading && !error && items.length === 0 ? (
                <p>Je hebt nog geen favorieten.</p>
            ) : null}
            <ul className="favorites-list">
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
                                    aria-label="Verwijderen"
                                    className="song-card__icon-button"
                                >
                                    <img
                                        className="song-card__icon"
                                        src={trashIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                </button>
                            }
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
