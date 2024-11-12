// App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext.jsx";
import { RoomProvider } from "./context/RoomContext.jsx";
import { WaitingRoomProvider } from "./context/WaitingRoomContext.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import GamePage from "./pages/GamePage/GamePage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage/DashboardPage.jsx";
import TutorialPage from "./pages/TutorialPage/TutorialPage.jsx";
import RankingPage from "./pages/RankingPage/RankingPage.jsx";
import WaitingPage from "./pages/WaitingPage/WaitingPage.jsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import SetPass from "./pages/SetPass/SetPass.jsx";
import BackgroundMusic from "../../public/sounds/background-music.mp4";

const oAuthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider clientId={oAuthClientId}>
      <UserProvider>
        <WaitingRoomProvider>
          <RoomProvider>
            <BackgroundMusic />
            <Router>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/game/:matchId" element={<GamePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/set-password" element={<SetPass />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tutorial" element={<TutorialPage />} />
                <Route path="/rankings" element={<RankingPage />} />
                <Route path="/waiting/:matchId" element={<WaitingPage />} />
              </Routes>
            </Router>
          </RoomProvider>
        </WaitingRoomProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
