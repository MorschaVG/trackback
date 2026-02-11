import './App.css'
import { Routes, Route } from 'react-router-dom'
import Layout from "./Layout.jsx";
import Home from "../pages/Home.jsx";
import Favorites from "../pages/Favorites.jsx";
import Login from "../pages/Login.jsx";
import History from "../pages/History.jsx";
import Profile from "../pages/Profile.jsx";
import NotFound from "../pages/NotFound.jsx";


function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="profile" element={<Profile />} />
                <Route path="login" element={<Login />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}


export default App
