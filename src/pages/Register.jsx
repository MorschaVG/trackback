import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/noviApiService.js";

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
        <section style={{ maxWidth: 420 }}>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="register-email">Email</label>
                <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    style={{ display: "block", marginBottom: 12, width: "100%" }}
                />
                <label htmlFor="register-password">Password</label>
                <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    style={{ display: "block", marginBottom: 12, width: "100%" }}
                />
                <label htmlFor="register-confirm-password">Confirm password</label>
                <input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    style={{ display: "block", marginBottom: 12, width: "100%" }}
                />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create account"}
                </button>
                {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
            </form>
        </section>
    );
}

