import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import './DashboardPage.css';
import { RoomContext } from '../../context/RoomContext.jsx';

const DashboardPage = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const { user } = useContext(UserContext);
    const { roomId, setRoomId } = useContext(RoomContext);
    const wsRef = useRef(null);
    const navigate = useNavigate();
    const [gameStatus, setGameStatus] = useState("Connecting to server...");
    const [messages, setMessages] = useState([]);
    const [inputedRoomId, setInputedRoomId] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        wsRef.current = new WebSocket(`ws://208.167.252.106:3000`);
        
        wsRef.current.onopen = () => {
            setGameStatus("Connected to server");
        };

        wsRef.current.onmessage = (event) => {
            const receivedMessage = event.data;
            const data = JSON.parse(event.data);

            setMessages((prevMessages) => [...prevMessages, receivedMessage]);

            switch (data.type) {
                case "roomCreated":
                    setRoomId(data.matchId);
                    handleEnterRoom(data.matchId);
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
    }, [setRoomId]);

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

    const handleEnterRoom = async (roomId) => {
        navigate(`/waiting/${roomId}`);
    };

    const handleEnterRoomWithId = async () => {
        if (!inputedRoomId) {
            setError("O código da sala deve ser preenchido");
            setTimeout(() => {
                setError("");
            }, 3000);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/matches/${inputedRoomId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await response.json();
            wsRef.current.send(
                JSON.stringify({
                    type: "updateRoom",
                    match_id: inputedRoomId,
                    player_id: user.user.id,
                })
            );
            if (response.ok) {
                setRoomId(inputedRoomId);
                navigate(`/waiting/${inputedRoomId}`);
            } else {
                console.error(data.error || 'An error occurred during room creation');
            }
        } catch (error) {
            console.error('Failed to create room');
            console.error(error);
        }
    };

    const handleLogout = async () => {
        try {
          const response = await fetch(`${apiUrl}/auth/logout`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
    
          const data = await response.json();
    
          if (response.ok) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/login');
          } else {
            console.error(data.error || 'An error occurred during logout');
          }
        } catch (error) {
          console.error('Failed to log out');
          console.error(error);
        }
    };

    return (
        <div className='dash-page-main-div'>
            <div className='dash-page-div'>
                <p className='text'>JOGAR</p>
                <Button type="submit" className={"create-room-btn"} onClick={handleCreateRoom}></Button>
                <p className='text'>OU INSIRA UM CÓDIGO:</p>
                <Input 
                    className="room-id-input" 
                    type="text" 
                    placeholder={"CÓDIGO DA SALA"} 
                    value={inputedRoomId}
                    onChange={(e) => setInputedRoomId(e.target.value)}
                />
                {error && <p className="error-message">{error}</p>}
                <Button type="submit" className={"start-game-btn"} onClick={handleEnterRoomWithId}></Button>
                <div>
                    <Button type="submit" className={"ranking-btn"} onClick={() => navigate('/rankings')}></Button>
                    <Button type="submit" className={"tutorial-btn"} onClick={() => navigate('/tutorial')}></Button>
                </div>
                <div>
                    <Button type="submit" className={"leave-btn"} onClick={handleLogout}></Button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;