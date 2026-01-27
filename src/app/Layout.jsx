import { Outlet } from 'react-router-dom'
import NavBar from "../components/NavBar/Navbar.jsx";

export default function Layout() {
    return (
        <>
            <NavBar />
            <main style={{ padding: 16 }}>
                <Outlet />
            </main>
        </>
    );
}
