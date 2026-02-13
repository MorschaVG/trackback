import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/noviApiService.js";
import { PillboxInput } from "../components/Pillbox/Pillbox.jsx";
import "./AuthPages.css";

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            setError("Email and password are required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await registerUser({ email: trimmedEmail, password });
            navigate("/login", { replace: true });
        } catch {
            setError("Registration failed. Try a different email.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="auth-page">
            <h1>Register</h1>
            <form onSubmit={handleSubmit} className="auth-form">
                <label htmlFor="register-email" className="auth-label">Email</label>
                <PillboxInput
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="auth-input"
                />
                <label htmlFor="register-password" className="auth-label">Password</label>
                <PillboxInput
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="auth-input"
                />
                <label htmlFor="register-confirm-password" className="auth-label">Confirm password</label>
                <PillboxInput
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="auth-input"
                />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create account"}
                </button>
                {error ? <p className="auth-error">{error}</p> : null}
            </form>
        </section>
    );
}
