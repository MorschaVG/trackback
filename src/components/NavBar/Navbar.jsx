import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const linkStyle = ({ isActive }) => ({
    padding: "6px 10px",
    marginRight: 8,
    border: "1px solid #000",
    textDecoration: "none",
    background: isActive ? "#000" : "#fff",
    color: isActive ? "#fff" : "#000",
    fontFamily: "Verdana, sans-serif",
    fontSize: 12,
});

export default function NavBar() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <nav style={{ padding: 12, borderBottom: "2px solid #000" }}>
            <NavLink to="/" style={linkStyle}>Home</NavLink>
            {isAuthenticated ? (
                <>
                    <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
                    <NavLink to="/favorites" style={linkStyle}>Favorites</NavLink>
                    <NavLink to="/history" style={linkStyle}>History</NavLink>
                    <button
                        type="button"
                        onClick={logout}
                        style={{
                            ...linkStyle({ isActive: false }),
                            cursor: "pointer",
                        }}
                    >
                        Logout
                    </button>
                    <span style={{ marginLeft: 10, fontSize: 12 }}>
                        {user?.email}
                    </span>
                </>
            ) : (
                <NavLink to="/login" style={linkStyle}>Login</NavLink>
            )}
        </nav>
    );
}
