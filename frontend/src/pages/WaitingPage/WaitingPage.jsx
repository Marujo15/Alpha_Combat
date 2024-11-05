import React from 'react';
import Button from '../../components/Button/Button';
import './WaitingPage.css';

const WaitingPage = () => {
    return (
        <div className='waiting-page-container'>
            {/* <div className='scoreboard-div'></div>
            <div className='time-div'></div> */}
            <div className='msg-div'>AGUARDANDO OUTRO PLAYER</div>
            <Button className={'w-cancel-btn'} text='Back' onClick={() => {navigate('/dashboard')}}></Button>
        </div>
    );
};

export default WaitingPage;