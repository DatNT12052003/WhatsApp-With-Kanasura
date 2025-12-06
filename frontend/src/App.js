import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/user-login/Login";
import HomePage from "./components/HomePage";
import { ProtectedRoute, PublicRoute } from "./Protected";
import UserDetail from "./components/UserDetail";
import Status from "./pages/statusSection/Status";
import Setting from "./pages/settingSection/Setting";
import useUserStore from "./store/useUserStore";
import { disconnectSocket, initializeSocket } from "./services/chat.service";
import { useChatStore } from "./store/chatStore";

function App() {
    const { user } = useUserStore();
    const { setCurrentUser, initSocketListeners, cleanup } = useChatStore();

    useEffect(() => {
        if (user?._id) {
            const socket = initializeSocket();

            if (socket) {
                setCurrentUser(user);
                initSocketListeners();
            }
        }
        return () => {
            cleanup();
            disconnectSocket();
        };
    }, [user, setCurrentUser, initSocketListeners]);
    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Router>
                <Routes>
                    <Route element={<PublicRoute />}>
                        <Route path="/user-login" element={<Login />} />
                    </Route>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/user-profile" element={<UserDetail />} />
                        <Route path="/status" element={<Status />} />
                        <Route path="/setting" element={<Setting />} />
                    </Route>
                </Routes>
            </Router>
        </>
    );
}

export default App;
