import { NavLink } from "react-router-dom";
import "./Footer.css";

function footerLinkClassName({ isActive }) {
    return isActive ? "app-footer__link app-footer__link--active" : "app-footer__link";
}

export default function Footer() {
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
            </nav>
        </footer>
    );
}
