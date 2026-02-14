import { useAuth } from "../context/AuthContext.jsx";
import History from "./History.jsx";
import "./Profile.css";

export default function Profile() {
    const { user } = useAuth();

    return (
        <section>
            <h1>Je profiel:</h1>
            <p className="profile-email"><strong>Email:</strong> {user?.email}</p>
            <h1>Je zoekgeschiedenis:</h1>
            <History showHeader={false} showActions={true} />
        </section>
    );
}
