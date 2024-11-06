import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import GamePage from "./pages/GamePage/GamePage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage/DashboardPage.jsx";
import TutorialPage from "./pages/TutorialPage/TutorialPage.jsx";
import RankingPage from "./pages/RankingPage/RankingPage.jsx";
import WaitingPage from "./pages/WaitingPage/WaitingPage.jsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import SetPassAfterGoogleoAuthFormPage from "./pages/SetPassAfterGoogleoAuthFormPage/SetPassAfterGoogleoAuthFormPage.jsx";

const App = () => {
  return (
    <GoogleOAuthProvider clientId="911355440047-ou9u9fjvti6gqk0vdrhifog3h9q5epdm.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/set-password" element={<SetPassAfterGoogleoAuthFormPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tutorial" element={<TutorialPage />} />
            <Route path="/rankings" element={<RankingPage />} />
            <Route path="/waiting" element={<WaitingPage />} />
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
