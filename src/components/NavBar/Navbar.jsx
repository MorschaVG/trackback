import { NavLink } from "react-router-dom";

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
    return (
        <nav style={{ padding: 12, borderBottom: "2px solid #000" }}>
            <NavLink to="/" style={linkStyle}>Home</NavLink>
            <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
            <NavLink to="/login" style={linkStyle}>Login</NavLink>
            <NavLink to="/favorites" style={linkStyle}>Favorites</NavLink>
        </nav>
    );
}