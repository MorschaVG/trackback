import { Outlet } from 'react-router-dom'
import NavBar from "../components/NavBar/Navbar.jsx";
import Footer from "../components/Footer/Footer.jsx";
import "./Layout.css";

export default function Layout() {
    return (
        <div className="layout-shell">
            <NavBar />
            <main className="layout-main">
                <div className="layout-content">
                    <Outlet />
                </div>
            </main>
            <Footer />
        </div>
    );
}
