import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import './DashboardPage.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(UserContext);

    useEffect(() => {
        if (!user) {
          navigate("/login");
        }

        console.log("User logged in:", user);
      }
    , [user, navigate]);

    const handleStartGame = () => {
        console.log("Starting game...");
        // Verifies if waiting queue has player
        // if true, make request to start match and navigate to room
        // else, add player to waiting queue
    };

    const handleLogout = () => {
        logout();
        localStorage.removeItem("token");
        navigate("/login");
      };

    return (
        <div className='dash-page-main-div'>
            <Logo />
            <Button type="submit" className={"start-game-btn"} onClick={() => {handleStartGame}}>INICIAR PARTIDA</Button>
            <Button type="submit" className={"ranking-btn"} onClick={() => navigate('/rankings')}>RANKINGS</Button>
            <Button type="submit" className={"tutorial-btn"} onClick={() => navigate('/tutorial')}>COMO JOGAR</Button>
            <Button type="submit" className={"logout-btn"} onClick={handleLogout}>SAIR</Button>
        </div>
    );
};

export default DashboardPage;