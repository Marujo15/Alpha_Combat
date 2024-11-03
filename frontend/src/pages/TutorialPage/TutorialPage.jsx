import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import './TutorialPage.css';

const TutorialPage = () => {
    const navigate = useNavigate();
    
    return (
        <div className='tutorial-container'>
            <h1>TUTORIAL</h1>
            <div className='controls-div'>
                <div className='direction-controls-div'>
                    <div>
                        <p>CIMA</p>
                        <img className="arrow-keys" src="../../../public/assets/up-key.png" alt="Seta para cima" />
                    </div>
                    <div className='second-arrow-keys-div'>
                        <div className='arrow-keys-div'>
                            <img className="arrow-keys" src="../../../public/assets/left-key.png" alt="Seta para esquerda" />
                            <p>ESQUERDA</p>
                        </div>
                        <div className='arrow-keys-div'>
                            <img className="arrow-keys" src="../../../public/assets/down-key.png" alt="Seta para baixo" />
                            <p>BAIXO</p>
                        </div>
                        <div className='arrow-keys-div'>
                            <img className="arrow-keys" src="../../../public/assets/right-key.png" alt="Seta para direita" />
                            <p>DIREITA</p>
                        </div>
                    </div>
                </div>
                <div className='shoot-key-div'>
                    <p>ATIRAR</p>
                    <img className="shoot-key-img" src="../../../public/assets/shoot-key.png" alt="Tecla espaço" />
                </div>
            </div>
            <Button type='submit' className={'menu-btn'} onClick={() => navigate('/dashboard')}>MENU</Button>
        </div>
    );
};

export default TutorialPage;