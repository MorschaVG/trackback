import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await login({ email: email.trim(), password });
            navigate("/profile", { replace: true });
        } catch {
            setError("Login failed. Check your credentials and config headers.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section style={{ maxWidth: 420 }}>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    style={{ display: "block", marginBottom: 12, width: "100%" }}
                />
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    style={{ display: "block", marginBottom: 12, width: "100%" }}
                />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>
                {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            </form>
        </section>
    );
}
