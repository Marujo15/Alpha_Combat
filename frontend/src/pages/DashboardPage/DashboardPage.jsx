import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import './DashboardPage.css';

const DashboardPage = () => {
    const navigate = useNavigate();

    const handleStartGame = () => {
        // Verifies if waiting queue has player
        // if true, make request to start match and navigate to room
        // else, add player to waiting queue
    };



    return (
        <div className='dash-page-main-div'>
            <Logo />
            <Button type="submit" className={"start-game-btn"} onClick={() => {handleStartGame}}>INICIAR PARTIDA</Button>
            <Button type="submit" className={"ranking-btn"} onClick={() => navigate('/ranking')}>RANKINGS</Button>
            <Button type="submit" className={"tutorial-btn"} onClick={() => navigate('/tutorial')}>COMO JOGAR</Button>
        </div>
    );
};

export default DashboardPage;