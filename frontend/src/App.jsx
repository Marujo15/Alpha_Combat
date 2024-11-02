import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
// import GamePage from "./pages/GamePage/GamePage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
// import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
// import RoomsPage from "./pages/RoomsPage/RoomsPage.jsx";

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* <Route path="/game" element={<GamePage />} /> */}
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/register" element={<RegisterPage />} />
          <Route path="/rooms" element={<RoomsPage />} /> */}
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
