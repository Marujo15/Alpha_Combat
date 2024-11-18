import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Clock.css';

function Clock({ gameData }) {
  const [timeLeft, setTimeLeft] = useState(10);
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

  const playersStats = [
    {
      name: gameData?.myPlayer?.name ?? '',
      kills: gameData?.myPlayer?.kills ?? 0,
      deaths: gameData?.myPlayer?.deaths ?? 0,
    },
    ...(gameData?.players?.map((player) => ({
      name: player.name,
      kills: player.kills,
      deaths: player.deaths,
    })) ?? []),
  ];

  const sortedByKills = [...playersStats].sort((a, b) => b.kills - a.kills);

  const sortedByDeaths = [...playersStats].sort((a, b) => b.deaths - a.deaths);

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
              {sortedByKills.map((player, index) => (
                <p key={index}>{player.name}: {player.kills}</p>
              ))}
            </div>
            <div className='deaths-div'>
              <p>Mortes</p>
              {sortedByDeaths.map((player, index) => (
                <p key={index}>{player.name}: {player.deaths}</p>
              ))}
            </div>
          </div>
          <Button type='submit' className={'menu-btn'} onClick={() => navigate('/dashboard')}></Button>
        </div>
      )}
    </div>
  );
}

export default Clock;
