import React, { useEffect, useRef } from 'react';

const BackgroundMusic = ({ audioUrl }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    
    const startAudio = () => {
      if (audio) {
        audio.volume = 0.5;
        audio.play()
          .catch(error => {
            console.warn("Erro ao iniciar áudio automático:", error);
            document.addEventListener('click', initializeAudio, { once: true });
          });
      }
    };

    const initializeAudio = () => {
      if (audio) {
        audio.play()
          .then(() => {
            console.log("Áudio iniciado com sucesso");
          })
          .catch(error => {
            console.error("Erro ao iniciar áudio:", error);
          });
      }
    };

    startAudio();

    return () => {
      if (audio) {
        audio.pause();
        document.removeEventListener('click', initializeAudio);
      }
    };
  }, [audioUrl]);

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      loop
      preload="auto"
      style={{ display: 'none' }}
    />
  );
};

export default BackgroundMusic;