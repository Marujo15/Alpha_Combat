import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import './TutorialPage.css';

const TutorialPage = () => {
    const navigate = useNavigate();
    
    return (
        <div className='tutorial-container'>
            <div className='tutorial-div'>
                <h1 className='text'>TUTORIAL</h1>
                <div className='controls-div'>
                    <div className='direction-controls-div'>
                        <div>
                            <p className='text'>CIMA</p>
                            <img className="arrow-keys" src="../../../assets/up-key-background.png" alt="Seta para cima" />
                        </div>
                        <div className='second-arrow-keys-div'>
                            <div className='arrow-keys-div'>
                                <img className="arrow-keys" src="../../../assets/left-key-background.png" alt="Seta para esquerda" />
                                <p className='text'>ESQUERDA</p>
                            </div>
                            <div className='arrow-keys-div'>
                                <img className="arrow-keys" src="../../../assets/down-key-background.png" alt="Seta para baixo" />
                                <p className='text'>BAIXO</p>
                            </div>
                            <div className='arrow-keys-div'>
                                <img className="arrow-keys" src="../../../assets/right-key-background.png" alt="Seta para direita" />
                                <p className='text'>DIREITA</p>
                            </div>
                        </div>
                    </div>
                    <div className='shoot-key-div'>
                        <p className='text'>ATIRAR</p>
                        <img className="shoot-key-img" src="../../../assets/space-key-background.png" alt="Tecla espaço" />
                    </div>
                </div>
                <Button type='submit' className={'menu-btn'} onClick={() => navigate('/dashboard')}></Button>
            </div>
        </div>
    );
};

export default TutorialPage;