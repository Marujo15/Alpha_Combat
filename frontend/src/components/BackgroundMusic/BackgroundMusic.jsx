import React, { useEffect, useRef } from 'react';
import backgroundMusic from '../../assets/audio/background-music.mp3';

const BackgroundMusic = () => {
  const audioRef = useRef(new Audio(backgroundMusic));

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;

    audio.play().catch((error) => {
      console.log('Autoplay bloqueado pelo navegador:', error);
    });

    return () => {
      audio.pause();
    };
  }, []);

  return null;
};

export default BackgroundMusic;
