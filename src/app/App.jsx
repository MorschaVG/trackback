import './App.css'
import { Routes, Route } from 'react-router-dom'
import Layout from "./Layout.jsx";
import Home from "../pages/Home.jsx";
import Favorites from "../pages/Favorites.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import History from "../pages/History.jsx";
import Profile from "../pages/Profile.jsx";
import NotFound from "../pages/NotFound.jsx";
import Contact from "../pages/Contact.jsx";
import About from "../pages/About.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "../routes/PublicOnlyRoute.jsx";


function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route element={<PublicOnlyRoute />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="profile" element={<Profile />} />
                    <Route path="favorites" element={<Favorites />} />
                </Route>
                <Route path="contact" element={<Contact />} />
                <Route path="about" element={<About />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}


export default App
