import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Navbar from "./components/Navbar";
import KanbanBoard from "./components/KanbanBoard";
import Documents from "./components/Documents";
import DocumentList from "./components/DocumentList";
import axios from "axios";
import { useDispatch } from "react-redux";
import { kanbanActions } from "./store/kanbanSlice";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GroupManagement from "./pages/GroupManagement";
import MyBoards from "./pages/MyBoards";
import BoardView from "./pages/BoardView";

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const email = localStorage.getItem("userEmail");
    if (token) {
      setIsLoggedIn(true);
      if (email) setUserEmail(email);
    }
  }, []);

  const handleLoginSuccess = async (response: any) => {
    const { credential } = response;
    if (credential) {
      try {
        localStorage.setItem("authToken", credential);
        const res = await axios.post("http://localhost:5001/api/login", {
          tokenId: credential,
        });
        const userData = res.data.user;
        localStorage.setItem("userEmail", userData.email);
        setUserEmail(userData.email);
        dispatch(kanbanActions.setBoard({ columns: userData.tasks ?? [] }));
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Login failed:", error);
      }
    } else {
      console.error("Google login response does not contain 'credential'.");
    }
  };

  const handleLoginFailure = () => {
    console.error("Login Error");
  };

  return (
    <GoogleOAuthProvider clientId="1069732843909-eq4iupt4u7rqaan4qfuebkfghi8nrsqd.apps.googleusercontent.com">
      <Router>
        <div className="app-container">
          <Navbar userEmail={userEmail} />

          {!isLoggedIn ? (
            <div className="welcome-section">
              <h1 className="welcome-title">
                Welcome to <span className="highlight">Matador Board</span>
              </h1>
              <p className="welcome-subtitle">
                An efficient system for document approval and workflow designed
                for CSUN staff and faculty.
              </p>
              <div className="login-container mt-4">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginFailure}
                />
              </div>
            </div>
          ) : (
            <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/document-list" element={<DocumentList />} />
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route path="/group" element={<GroupManagement />} />
            <Route path="/my-boards" element={<MyBoards />} />
            <Route path="/board/:boardId" element={<BoardView />} /> 
          </Routes>
          
          )}

          <footer className="footer">
            <p>
              Matador Board &copy; 2025 | California State University,
              Northridge
            </p>
          </footer>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
