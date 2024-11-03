import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import Logo from '../../components/Logo/Logo.jsx';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container">
            <Logo />
            <h1 className="title">Welcome to the Landing Page</h1>
            <Button className="login-btn" onClick={() => navigate('/login')}>Entrar</Button>
        </div>
    );
};

export default LandingPage;