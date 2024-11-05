import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-container">
            <h1 className="title">ALPHA COMBAT</h1>
            <Button className="go-to-login-btn" onClick={() => navigate('/login')}></Button>
            <p className='about'>PREPARE-SE PARA A ADRENALINA DE ALPHA COMBAT! EM UM DUELO MULTIPLAYER ELETRIZANTE, VOCÊ ASSUME O CONTROLE DE UM TANQUE DE GUERRA COM UM ÚNICO OBJETIVO: DESTRUIR O INIMIGO ANTES QUE ELE DESTRUA VOCÊ. COM GRÁFICOS IMERSIVOS E MAPAS REPLETOS DE OBSTÁCULOS ESTRATÉGICOS, CADA PARTIDA EXIGE HABILIDADE, PRECISÃO E UMA BOA DOSE DE ESTRATÉGIA. SÓ OS MELHORES SOBREVIVEM EM ALPHA COMBAT!</p>
        </div>
    );
};

export default LandingPage;