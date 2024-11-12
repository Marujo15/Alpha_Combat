import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboardByKey } from '../../utils/leaderboardApi';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import './RankingPage.css';

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const RankingPage = () => {
    const navigate = useNavigate();
    const [mostKills, setMostKills] = useState([]);
    const [mostDeaths, setMostDeaths] = useState([]);
    const [mostMatchesPlayed, setMostMatchesPlayed] = useState([]);
    const [mostTimePlayed, setMostTimePlayed] = useState([]);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            try {
                const leaderboards = await getLeaderboardByKey();  
                const players = Object.values(leaderboards)[1];

                const kills = players.map((player) => {
                    return { username: capitalizeFirstLetter(player.username), kills: player.kills_count };
                });
                kills.sort((a, b) => b.kills - a.kills);
                setMostKills(kills.slice(0, 5));

                const deaths = players.map((player) => {
                    return { username: capitalizeFirstLetter(player.username), deaths: player.deaths_count };
                });
                deaths.sort((a, b) => b.deaths - a.deaths);
                setMostDeaths(deaths.slice(0, 5));

                const matches = players.map((player) => {
                    return { username: capitalizeFirstLetter(player.username), matches: player.matches };
                });
                matches.sort((a, b) => b.matches - a.matches);
                setMostMatchesPlayed(matches.slice(0, 5));

                const timePlayed = players.map((player) => {
                    const hours = player.time_played.hours || 0;
                    const minutes = player.time_played.minutes || 0;
                    const seconds = player.time_played.seconds || 0;
                
                    const totalTimePlayed = Math.floor((hours * 60 * 60 + minutes * 60 + seconds) / 60);
                
                    return { username: capitalizeFirstLetter(player.username), timePlayed: totalTimePlayed };
                });
                
                timePlayed.sort((a, b) => b.timePlayed - a.timePlayed);
                
                setMostTimePlayed(timePlayed.slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch leaderboards:', error);
            }
        };

        fetchLeaderboards();
    }, []);

    return (
        <div className='ranking-page-container'>
            <Logo />
            <div className='rankings-div'>
                <div className='ranking-div'>
                    <h2>Abates</h2>
                    <div className='ranking-list'>
                        {mostKills.slice(0, 4).map((entry, index) => (
                            <div key={index} className='ranking-item'>
                                {entry.username}: {entry.kills}
                            </div>
                        ))}
                    </div>
                </div>
                <div className='ranking-div'>
                    <h2>Mortes</h2>
                    <div className='ranking-list'>
                        {mostDeaths.slice(0, 4).map((entry, index) => (
                            <div key={index} className='ranking-item'>
                                {entry.username}: {entry.deaths}
                            </div>
                        ))}
                    </div>
                </div>
                <div className='ranking-div'>
                    <h2>Partidas</h2>
                    <div className='ranking-list'>
                        {mostMatchesPlayed.slice(0, 4).map((entry, index) => (
                            <div key={index} className='ranking-item'>
                                {entry.username}: {entry.matches}
                            </div>
                        ))}
                    </div>
                </div>
                <div className='ranking-div'>
                    <h2>Tempo de Jogo</h2>
                    <div className='ranking-list'>
                        {mostTimePlayed.slice(0, 4).map((entry, index) => (
                            <div key={index} className='ranking-item'>
                                {entry.username}: {entry.timePlayed} min
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Button className={'rp-back-btn'} text='Back' onClick={() => navigate('/dashboard')}></Button>
        </div>
    );
};

export default RankingPage;