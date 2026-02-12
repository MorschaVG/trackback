import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../hooks/useFavorites.js";

export default function Favorites() {
    const { user, token } = useAuth();
    const { favorites, isLoading, error } = useFavorites(user?.userId, token);

    return (
        <section>
            <h1>Favorites</h1>
            {isLoading ? <p>Loading favorites...</p> : null}
            {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            {!isLoading && !error && favorites.length === 0 ? (
                <p>No favorites yet.</p>
            ) : null}
            <ul>
                {favorites.map((item) => (
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
