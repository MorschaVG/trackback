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
                Home
            </NavLink>

            {isAuthenticated ? (
                <NavLink
                    to="/favorites"
                    className={({ isActive }) =>
                        `${segmentClassName({ isActive })} nav-pill__segment--middle`
                    }
                >
                    Favorites
                </NavLink>
            ) : (
                <button
                    type="button"
                    className="nav-pill__segment nav-pill__segment--middle nav-pill__segment--disabled"
                    disabled
                >
                    Favorites
                </button>
            )}

            {isAuthenticated ? (
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `${segmentClassName({ isActive })} nav-pill__segment--right`
                    }
                >
                    Profile
                </NavLink>
            ) : (
                <NavLink
                    to="/login"
                    className={({ isActive }) =>
                        `${segmentClassName({ isActive })} nav-pill__segment--right`
                    }
                >
                    Login / Signup
                </NavLink>
            )}
        </nav>
    );
}
