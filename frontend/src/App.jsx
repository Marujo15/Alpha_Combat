import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProvider } from './context/UserContext';
import { RoomProvider } from './context/RoomContext';
import LandingPage from './pages/LandingPage/LandingPage';
import GamePage from './pages/GamePage/GamePage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import TutorialPage from './pages/TutorialPage/TutorialPage';
import RankingPage from './pages/RankingPage/RankingPage';
import WaitingPage from './pages/WaitingPage/WaitingPage';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import SetPass from "./pages/SetPass/SetPass.jsx";

const oAuthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider clientId={oAuthClientId}>
      <UserProvider>
        <RoomProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/game/:matchId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/set-password" element={<SetPass />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/tutorial" element={<ProtectedRoute><TutorialPage /></ProtectedRoute>} />
              <Route path="/rankings" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
              <Route path="/waiting/:matchId" element={<ProtectedRoute><WaitingPage /></ProtectedRoute>} />
            </Routes>
          </Router>
        </RoomProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
