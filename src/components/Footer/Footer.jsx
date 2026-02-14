import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Footer.css";

function footerLinkClassName({ isActive }) {
    return isActive ? "app-footer__link app-footer__link--active" : "app-footer__link";
}

export default function Footer() {
    const { logout, isAuthenticated } = useAuth();

    return (
        <footer className="app-footer" aria-label="Footer">
            <div className="app-footer__logo" aria-hidden="true" />
            <nav className="app-footer__links" aria-label="Footer links">
                <NavLink to="/contact" className={footerLinkClassName}>
                    Contact
                </NavLink>
                <NavLink to="/about" className={footerLinkClassName}>
                    About
                </NavLink>
                <button
                    type="button"
                    onClick={logout}
                    disabled={!isAuthenticated}
                    className="app-footer__link app-footer__logout"
                >
                    Logout
                </button>
            </nav>
        </footer>
    );
}
