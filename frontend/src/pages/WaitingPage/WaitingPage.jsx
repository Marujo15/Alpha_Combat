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
  const { roomId, setRoomId, playersOnRoom, setPlayersOnRoom } =
    useContext(RoomContext);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const [gameStatus, setGameStatus] = useState("Connecting to server...");
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [updatePage, setUpdatePage] = useState(false);

  useEffect(() => {
    const storedRoomId = localStorage.getItem("roomId");

    if (storedRoomId) {
      setRoomId(storedRoomId);
    }

    wsRef.current = wsRef.current || new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setGameStatus("Connected to server");
      setIsWsOpen(true);
      if (!storedRoomId) navigate("/dashboard");
      wsRef.current.send(
        JSON.stringify({
          type: "getRoom",
          matchId: storedRoomId,
        })
      );
    };

    wsRef.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "errorMessage":
          console.error("Error:", data.message);
          break;
        case "waitingListUpdated":
          setPlayersOnRoom(data.players);
          break;
        case "matchStarted":
          if (data.players.some((player) => player.id === user.user.id)) {
            navigate(`/game/${roomId}`);
          }
          break;
        case "roomUpdated":
          setPlayersOnRoom(data.players);
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

    // window.addEventListener("beforeunload", () => {
    //   try {
    //     wsRef.current.send(
    //       JSON.stringify({
    //         type: "playerLeftRoom",
    //         match_id: roomId,
    //         player_id: user.user.id,
    //       })
    //     );
    //     setUpdatePage(true);
    //   } catch (error) {
    //     console.error("Failed to create room");
    //     console.error(error);
    //   }
    // });
  }, [roomId, updatePage]);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  const handleLeaveBtn = async () => {
    try {
      wsRef.current.send(
        JSON.stringify({
          type: "playerLeftRoom",
          match_id: roomId,
          player_id: user.user.id,
        })
      );
      setUpdatePage(true);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to create room");
      console.error(error);
    }
  };

  const handleStartMatchBtn = () => {
    if (!window.audioRef) {
      window.audioRef = new Audio("../../public/sounds/background-music.mp3");
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
      try {
        wsRef.current.send(
          JSON.stringify({
            type: "startMatch",
            matchId: roomId,
          })
        );
      } catch (error) {
        console.error(error);
      }
      // navigate(`/game/${roomId}`);
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
        <div className="room-id-div">
          <p className="room-id-title">Sala {roomId}</p>
          <Button
            type="submit"
            className={"copy-room-id-btn"}
            onClick={handleCopyRoomId}
          ></Button>
        </div>
        <div>
          <p className="waiting-players-title">Jogadores na sala:</p>
          <ul className="waiting-players-list">
            {playersOnRoom?.map((player, index) => (
              <li key={index}>{player.name}</li>
            ))}
          </ul>
        </div>
        <div className="waiting-buttons-div">
          <Button
            type="submit"
            className={"leave-btn"}
            onClick={handleLeaveBtn}
          ></Button>
          <Button
            type="submit"
            className={"start-match-btn"}
            onClick={handleStartMatchBtn}
          ></Button>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
