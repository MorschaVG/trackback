import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/noviApiService.js";
import BrandHeader from "../components/BrandHeader/BrandHeader.jsx";
import { Pillbox, PillboxInput } from "../components/Pillbox/Pillbox.jsx";
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
            setError("Email en wachtwoord zijn verplicht.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Wachtwoorden komen niet overeen.");
            return;
        }

        setIsSubmitting(true);
        try {
            await registerUser({ email: trimmedEmail, password });
            navigate("/login", { replace: true });
        } catch {
            setError("Registreren mislukt. Probeer een andere email.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-screen">
            <BrandHeader />
            <section className="auth-page">
                <h3>Vul de gegevens hieronder in om een account aan te maken!</h3>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="register-email" className="auth-label">Email</label>
                    <PillboxInput
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        width={367}
                        className="auth-input"
                    />
                    <label htmlFor="register-password" className="auth-label">Wachtwoord</label>
                    <PillboxInput
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        width={367}
                        className="auth-input"
                    />
                    <label htmlFor="register-confirm-password" className="auth-label">Bevestig wachtwoord</label>
                    <PillboxInput
                        id="register-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        width={367}
                        className="auth-input"
                    />
                    <Pillbox
                        as="button"
                        type="submit"
                        size="small"
                        width={167}
                        disabled={isSubmitting}
                        className="auth-submit"
                    >
                        {isSubmitting ? "Creating account..." : "Maak account"}
                    </Pillbox>
                    {error ? <p className="auth-error">{error}</p> : null}
                </form>
            </section>
        </div>
    );
}
