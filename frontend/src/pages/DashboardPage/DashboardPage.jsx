import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user } = useContext(UserContext);
    const wsRef = useRef(null);
    const navigate = useNavigate();
    const [gameStatus, setGameStatus] = useState("Connecting to server...");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        wsRef.current = new WebSocket('ws://localhost:3000');

        wsRef.current.onopen = () => {
            setGameStatus("Connected to server");
        };

        wsRef.current.onmessage = (event) => {
            const receivedMessage = event.data;
            const data = JSON.parse(event.data);

            setMessages((prevMessages) => [...prevMessages, receivedMessage]);

            switch (data.type) {
                case "roomCreated":
                    handleUserRedirect(data.matchId);
                    break;
            }
        };

        wsRef.current.onclose = () => {
            setGameStatus("Disconnected from server. Please, refresh the page to try again.");
        };

        wsRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setGameStatus("Error connecting to server.");
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const handleCreateRoom = () => {
        if (wsRef.current.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type: "greeting", content: "Hello, server!" });
            wsRef.current.send(message);
        } else {
            console.log("WebSocket is not open. Current state:", wsRef.current.readyState);
        }

        wsRef.current.send(
            JSON.stringify({
                type: "createNewRoom",
                player1_id: user.user.id,
                token: user.token,
            })
        );
    };

    const handleUserRedirect = (matchId) => {
        navigate(`/game/${matchId}`);
    };

    const handleStartGame = () => {
        console.log("Starting game...");
        // Verifies if waiting queue has player
        // if true, make request to start match and navigate to room
        // else, add player to waiting queue
    };

    return (
        <div className='dash-page-main-div'>
            <div className='dash-page-div'>
                <p className='text'>ENCONTRAR JOGO</p>
                <Button type="submit" className={"create-room-btn"} onClick={handleCreateRoom}></Button>
                <p className='text'>OU INSIRA UM CÓDIGO:</p>
                <Input className="room-id-input" type="text" placeholder={"CÓDIGO DA SALA"} onChange={(e) => setRoomId(e.target.value)}></Input>
                <Button type="submit" className={"start-game-btn"} onClick={() => {handleStartGame}}></Button>
                <div>
                    <Button type="submit" className={"ranking-btn"} onClick={() => navigate('/rankings')}></Button>
                    <Button type="submit" className={"tutorial-btn"} onClick={() => navigate('/tutorial')}></Button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;