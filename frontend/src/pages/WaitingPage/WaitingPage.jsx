import React from 'react';
import Button from '../../components/Button/Button';
import './WaitingPage.css';

const WaitingPage = () => {
    return (
        <div className='waiting-page-container'>
            <div className='waiting-page-div'>
                <p className='room-id-title'>Sala #12345</p>
                <div>
                    Quadros das pessoas aguardando
                </div>
                <div className='waiting-buttons-div'>
                    <Button type="submit" className={"leave-btn"} onClick={() => navigate('/dashboard')}></Button>
                    <Button type="submit" className={"start-match-btn"} onClick={() => {}}></Button>
                    <Button type="submit" className={"ready-btn"} onClick={() => {}}></Button>
                </div>
            </div>
            {/* <div className='scoreboard-div'></div>
            <div className='time-div'></div> */}
        </div>
    );
};

export default WaitingPage;