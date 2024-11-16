import React, { useRef, useEffect } from 'react';
import './Button.css';
import clickSound from '../../../public/sounds/mouse-click.mp3';

const Button = ({ className, onClick, children }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio(clickSound);
    }, []);

    const handleClick = () => {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        if (onClick) {
            onClick();
        }
    };

    return (
        <button className={className} onClick={handleClick}>
            {children}
        </button>
    );
};

export default Button;
