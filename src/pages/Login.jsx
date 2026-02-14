import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import BrandHeader from "../components/BrandHeader/BrandHeader.jsx";
import { PillboxInput } from "../components/Pillbox/Pillbox.jsx";
import "./AuthPages.css";

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
        <div className="auth-screen">
            <BrandHeader />
            <section className="auth-page">
                <h1>Login</h1>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="email" className="auth-label">Email</label>
                    <PillboxInput
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="auth-input"
                    />
                    <label htmlFor="password" className="auth-label">Password</label>
                    <PillboxInput
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="auth-input"
                    />
                    <p className="auth-helper">
                        Nog geen account?
                        <br />
                        klik <Link to="/register" className="auth-helper-link">hier</Link>
                    </p>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                    {error ? <p className="auth-error">{error}</p> : null}
                </form>
            </section>
        </div>
    );
}
