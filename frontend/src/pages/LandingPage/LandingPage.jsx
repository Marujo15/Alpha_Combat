import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-container">
            <h1 className="title">Alpha Combat</h1>
            <Button className="go-to-login-btn" onClick={() => navigate('/login')}></Button>
            <p>O Alpha Combat é um jogo muiltplayer feito para jogar com seu amigo</p>
        </div>
    );
};

export default LandingPage;