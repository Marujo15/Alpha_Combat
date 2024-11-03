import React from 'react';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import './RankingPage.css';

const RankingPage = () => {
    return (
        <div className='ranking-page-container'>
            <Logo />
            <div className='rankings-div'>
                <div className='ranking-div'></div>
                <div className='ranking-div'></div>
                <div className='ranking-div'></div>
                <div className='ranking-div'></div>
            </div>
            <Button className={'back-btn'} text='Back' link='/home'>VOLTAR</Button>
        </div>
    );
};

export default RankingPage;