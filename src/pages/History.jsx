import { useAuth } from "../context/AuthContext.jsx";
import { useHistory } from "../hooks/useHistory.js";
import { deleteHistoryById } from "../services/noviApiService.js";
import { useEffect, useState } from "react";
import { formatUtcRfc2822NoSecondsNoZone } from "../helpers/formatDate.js";
import SongCard from "../components/SongCard/SongCard.jsx";
import { Pillbox } from "../components/Pillbox/Pillbox.jsx";
import { useNavigate } from "react-router-dom";
import "./History.css";

export default function History({ showHeader = true, showActions = true }) {
    const { user, token } = useAuth();
    const navigate = useNavigate();
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
            setActionError("Geschiedenis wissen mislukt.");
        } finally {
            setIsClearing(false);
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
            {showHeader ? <h1>History</h1> : null}
            {showActions ? (
                <Pillbox
                    as="button"
                    type="button"
                    onClick={handleClearHistory}
                    disabled={isLoading || isClearing || items.length === 0}
                    size="small"
                    width={167}
                    className="versions-button"
                >
                    {isClearing ? "Wissen..." : "Geschiedenis wissen"}
                </Pillbox>
            ) : null}
            {isLoading ? <p>Geschiedenis laden...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {actionError ? <p style={{ color: "crimson" }}>{actionError}</p> : null}
            {!isLoading && !error && items.length === 0 ? (
                <p>Je hebt nog geen geschiedenis.</p>
            ) : null}
            <ul className="history-list">
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
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
