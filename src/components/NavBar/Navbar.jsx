import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import logoNav from "../../assets/logo-nav.png";
import "./Navbar.css";

function segmentClassName({ isActive }) {
    return isActive ? "nav-pill__segment nav-pill__segment--active" : "nav-pill__segment";
}

export default function NavBar() {
    const { isAuthenticated } = useAuth();

    return (
        <nav className="nav-pill" aria-label="Main navigation">
            <NavLink to="/" className={({ isActive }) =>
                `${segmentClassName({ isActive })} nav-pill__segment--left`
            }
            >
                <img src={logoNav} alt="" aria-hidden="true" className="nav-pill__brand-logo" />
                HOME
            </NavLink>

            {isAuthenticated ? (
                <NavLink
                    to="/favorites"
                    className={({ isActive }) =>
                        `${segmentClassName({ isActive })} nav-pill__segment--middle`
                    }
                >
                    FAVORITES
                </NavLink>
            ) : (
                <span
                    role="button"
                    aria-disabled="true"
                    className="nav-pill__segment nav-pill__segment--middle nav-pill__segment--disabled"
                    tabIndex={0}
                >
                    FAVORITES
                    <span className="nav-pill__tooltip">
                        Log in om je favorieten te bekijken!
                    </span>
                </span>
            )}

            {isAuthenticated ? (
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `${segmentClassName({ isActive })} nav-pill__segment--right`
                    }
                >
                    PROFILE
                </NavLink>
            ) : (
                <NavLink
                    to="/login"
                    className={({ isActive }) =>
                        `${segmentClassName({ isActive })} nav-pill__segment--right`
                    }
                >
                    LOGIN / SIGNUP
                </NavLink>
            )}
        </nav>
    );
}
