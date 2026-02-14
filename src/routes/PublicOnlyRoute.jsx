import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PublicOnlyRoute() {
    const { isAuthenticated, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return <p>Rechten checken...</p>;
    }
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}
