import React from 'react';
import Button from '../../components/Button/Button';
import './GamePage.css';

const GamePage = () => {
    const handleGiveupBtn = () => {
        console.log('Giveup button clicked');
    };

    return (
        <div className='game-page-container'>
            <div className='top-page-div'>
                <div className='player1-info-div'>
                    <img className='player-img' src="" alt="" />
                    <div className='player1-info'>
                        <p>VARANDAS</p>
                        <p>ABATES: 37</p>
                        <p>MORTES: 1</p>
                    </div>
                </div>
                <div className='match-info-div'>
                    <div className='score-div'>
                        <p className='player1-score'>3</p>
                        <p>:</p>
                        <p className='player2-score'>3</p>
                    </div>
                    <div className='game-page-time-div'>00:48</div>
                </div>
                <div className='player2-info-div'>
                <img className='player-img' src="" alt="" />
                <div className='player2-info'>
                    <p>MARUJO</p>
                    <p>ABATES: 37</p>
                    <p>MORTES: 1</p>
                </div>
                </div>
            </div>
            <div className='game-div'></div>
            <Button className={'giveup-btn'} text='giveup' onClick={() => {handleGiveupBtn}}></Button>
        </div>
    );
};

export default GamePage;