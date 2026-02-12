import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
    const { user } = useAuth();

    return (
        <section>
            <h1>Profile</h1>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {String(user?.userId ?? "unknown")}</p>
            <p><strong>Roles:</strong> {(user?.roles || []).join(", ")}</p>
            <p>
                <Link to="/favorites">Go to Favorites</Link>
            </p>
            <p>
                <Link to="/history">Go to History</Link>
            </p>
        </section>
    );
}
