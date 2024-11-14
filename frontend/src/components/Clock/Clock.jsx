import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Clock.css';

function Clock() {
  const [timeLeft, setTimeLeft] = useState(300);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      console.log('Time is up!');
      if (window.audioRef) {
        window.audioRef.pause();
        window.audioRef.currentTime = 0;
        window.audioRef = null;
      }
  
      if (window.audioTimeout) {
        clearTimeout(window.audioTimeout);
        window.audioTimeout = null;
      }

      setShowModal(true);
    }
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div>
      <h1 className='clock-text'>
        Tempo: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </h1>
      {showModal && (
        <div className='modal'>
          <h1>FIM DE JOGO!</h1>
          <h2>Status da Partida:</h2>
          <div className='gp-rankings-div'>
            <div className='kills-div'>
              <p>Abates</p>
            </div>
            <div className='deaths-div'>
              <p>Mortes</p>
            </div>
          </div>
          <Button type='submit' className={'menu-btn'} onClick={() => navigate('/dashboard')}></Button>
        </div>
      )}
    </div>
  );
}

export default Clock;
