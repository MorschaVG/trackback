import { useAuth } from "../context/AuthContext.jsx";
import { useHistory } from "../hooks/useHistory.js";

export default function History() {
    const { user, token } = useAuth();
    const { history, isLoading, error } = useHistory(user?.userId, token);

    return (
        <section>
            <h1>History</h1>
            {isLoading ? <p>Loading history...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {!isLoading && !error && history.length === 0 ? (
                <p>No history yet.</p>
            ) : null}
            <ul>
                {history.map((item) => (
                    <li key={item.id}>
                        {item.artist} - {item.title}
                        {item.year ? ` (${item.year})` : ""}
                        {" | "}
                        {item.verdict}
                        {" | "}
                        {item.timestamp}
                    </li>
                ))}
            </ul>
        </section>
    );
}
