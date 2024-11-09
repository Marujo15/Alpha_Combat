import React, { useEffect, useRef, useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { RoomContext } from '../../context/RoomContext';
import { WaitingRoomContext } from '../../context/WaitingRoomContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import './WaitingPage.css';

const WaitingPage = () => {
    const { user } = useContext(UserContext);
    const { roomId } = useContext(RoomContext);
    const { waitingPlayers, setWaitingPlayers } = useContext(WaitingRoomContext);
    const navigate = useNavigate();
    const wsRef = useRef(null);
    const [gameStatus, setGameStatus] = useState("Connecting to server...");

    useEffect(() => {
        wsRef.current = new WebSocket('ws://localhost:3000');

        wsRef.current.onopen = () => {
            // console.log('Connected to WebSocket server');
            setGameStatus("Connected to server");
            wsRef.current.send(
                JSON.stringify({
                    type: "getWaitingList"
                 })
            );
        };

        wsRef.current.onmessage = (message) => {
            const data = JSON.parse(message.data);
            // console.log("Data received from server:", data);
            switch (data.type) {
                case "waitingListUpdated":
                    setWaitingPlayers(data.players);
                    break;
            }
        };

        wsRef.current.onclose = () => {
            // console.log("Disconnected from server");
            setGameStatus(
                "Disconnected from server. Please, refresh the page to try again."
            );
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const handleStartMatchBtn = () => {
        console.log('Entering room...');

        // this.ws.send(JSON.stringify({
        //     type: 'enterRoom',
        //     player: this.currentPlayer,
        //     roomCode: this.roomCode,
        // }));
    };

    return (
        <div className='waiting-page-container'>
            <div className='waiting-page-div'>
                <p className='room-id-title'>Sala {roomId}</p>
                <div>
                    <p className='waiting-players-title'>Jogadores na sala:</p>
                    <ul className='waiting-players-list'>
                        {waitingPlayers.players.map((player, index) => (
                            <li key={index}>{player}</li>
                        ))}
                    </ul>
                </div>
                <div className='waiting-buttons-div'>
                    <Button type="submit" className={"leave-btn"} onClick={() => navigate('/dashboard')}></Button>
                    <Button type="submit" className={"start-match-btn"} onClick={handleStartMatchBtn}></Button>
                    <Button type="submit" className={"ready-btn"} onClick={() => {}}></Button>
                </div>
            </div>
            {/* <div className='scoreboard-div'></div>
            <div className='time-div'></div> */}
        </div>
    );
};

export default WaitingPage;