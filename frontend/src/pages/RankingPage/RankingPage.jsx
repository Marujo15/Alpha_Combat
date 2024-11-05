import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import './RankingPage.css';

const RankingPage = () => {
    const navigate = useNavigate();

    return (
        <div className='ranking-page-container'>
            <Logo />
            <div className='rankings-div'>
                <div className='ranking-div'></div>
                <div className='ranking-div'></div>
                <div className='ranking-div'></div>
                <div className='ranking-div'></div>
            </div>
            <Button className={'rp-back-btn'} text='Back' onClick={() => navigate('/dashboard')}></Button>
        </div>
    );
};

export default RankingPage;