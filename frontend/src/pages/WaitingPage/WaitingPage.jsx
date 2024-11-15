/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useContext, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { RoomContext } from "../../context/RoomContext";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import "./WaitingPage.css";

const audioRef = { current: null };

const WaitingPage = () => {
  const wsUrl = import.meta.env.VITE_WS_URL;
  const { user } = useContext(UserContext);
  const { roomId } = useContext(RoomContext);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const [gameStatus, setGameStatus] = useState("Connecting to server...");
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [updatePage, setUpdatePage] = useState(false);

  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setGameStatus("Connected to server");
      setIsWsOpen(true);
      wsRef.current.send(
        JSON.stringify({ type: "getWaitingList", matchId: roomId })
      );
    };

    wsRef.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "waitingListUpdated":
          setWaitingPlayers(data.matchInfo.players);
          break;
        case "matchStarted":
          console.log("Players in the room:", data);
          if (data.players.map((player) => player.id).includes(user.user.id)) {
            console.log("Match started successfully");
            navigate(`/game/${roomId}`);
          }
          break;
        case "roomUpdated":
          setWaitingPlayers(data.matchInfo.players);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    };

    wsRef.current.onclose = () => {
      setGameStatus(
        "Disconnected from server. Please, refresh the page to try again."
      );
      setIsWsOpen(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, updatePage]);

  const handleStartMatchBtn = () => {
    console.log("Starting match...");
    console.log("userId", user.user.id);
    console.log("roomId", roomId);

    if (!window.audioRef) {
        window.audioRef = new Audio('../../public/sounds/background-music.mp3');
        window.audioRef.volume = 0.5;
        window.audioRef.loop = true;
        window.audioRef.play();

        window.audioTimeout = setTimeout(() => {
            if (window.audioRef) {
                window.audioRef.pause();
                window.audioRef.currentTime = 0;
                window.audioRef = null;
            }
        }, 300000);
    }

    if (isWsOpen) {
      // wsRef.current.send(
      //   JSON.stringify({
      //     type: "startMatch",
      //     playerId: user.user.id,
      //     matchId: roomId,
      //   })
      // );
      navigate(`/game/${roomId}`);
    } else {
      console.log(
        "WebSocket is not open. Current state:",
        wsRef.current.readyState
      );
    }
  };

  return (
    <div className="waiting-page-container">
      <div className="waiting-page-div">
        <p className="room-id-title">Sala {roomId}</p>
        <div>
          <p className="waiting-players-title">Jogadores na sala:</p>
          <ul className="waiting-players-list">
            {waitingPlayers?.map((player, index) => (
              <li key={index}>{player.playerName}</li>
            ))}
          </ul>
        </div>
        <div className="waiting-buttons-div">
          <Button
            type="submit"
            className={"leave-btn"}
            onClick={() => navigate("/dashboard")}
          ></Button>
          <Button
            type="submit"
            className={"start-match-btn"}
            onClick={handleStartMatchBtn}
          ></Button>
          {/* <Button type="submit" className={"ready-btn"} onClick={() => {}}></Button> */}
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
