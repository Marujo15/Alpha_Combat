import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { RoomContext } from "../../context/RoomContext.jsx";
import Logo from "../../components/Logo/Logo.jsx";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import "./DashboardPage.css";

const DashboardPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;
  const { user, logout } = useContext(UserContext);
  const { setRoomId, setPlayersOnRoom } = useContext(RoomContext);
  const wsRef = useRef(null);
  const navigate = useNavigate();
  const [gameStatus, setGameStatus] = useState("Connecting to server...");
  const [messages, setMessages] = useState([]);
  const [inputedRoomId, setInputedRoomId] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    wsRef.current = wsRef.current || new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setGameStatus("Connected to server");
    };

    wsRef.current.onmessage = (event) => {
      const receivedMessage = event.data;
      const data = JSON.parse(event.data);

      setMessages((prevMessages) => [...prevMessages, receivedMessage]);

      switch (data.type) {
        case "errorMessage":
          console.error("Error: " + data.message);
          break;
        case "roomCreated":
          setRoomId(data.matchId);
          setPlayersOnRoom([
            {
              id: data.players[0].id,
              name: data.players[0].name,
            },
          ]);
          localStorage.setItem("roomId", data.matchId);
          handleEnterRoom(data.matchId);
          break;
        case "currentPlayers":
          setRoomId(data.roomId)
          setPlayersOnRoom(data.players);
          localStorage.setItem("roomId", data.roomId);
          handleEnterRoom(data.roomId);

          break;
      }
    };

    wsRef.current.onclose = () => {
      setGameStatus(
        "Disconnected from server. Please, refresh the page to try again."
      );
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setGameStatus("Error connecting to server.");
    };
  }, [setRoomId]);

  const handleCreateRoom = () => {
    if (wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: "createNewRoom",
        player1_id: user.user.id,
        player1_name: user.user.username,
        token: user.token,
      });

      wsRef.current.send(message);
    } else {
      console.log(
        "WebSocket is not open. Current state:",
        wsRef.current.readyState
      );
    }
  };

  const handleEnterRoom = async (roomId) => {
    navigate(`/waiting/${roomId}`);
  };

  const handleEnterRoomWithId = async () => {
    if (!inputedRoomId) {
      handleError("O código da sala deve ser preenchido");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/matches/${inputedRoomId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      wsRef.current.send(
        JSON.stringify({
          type: "tryToEnterTheRoom",
          room_id: inputedRoomId,
          player: { id: user.user.id, name: user.user.username },
        })
      );
      if (response.ok) {
        setRoomId(inputedRoomId);
      } else {
        console.error(data.error || "An error occurred during room creation");
      }
    } catch (error) {
      console.error("Failed to create room");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        logout();
        navigate("/login");
      } else {
        console.error(data.error || "An error occurred during logout");
      }
    } catch (error) {
      console.error("Failed to log out");
      console.error(error);
    }
  };

  const handleError = (message) => {
    setError(message);
    setTimeout(() => {
      setError("");
    }, 3000);
  };

  return (
    <div className="dash-page-main-div">
      <div className="dash-page-div">
        <p className="text">JOGAR</p>
        <Button
          type="submit"
          className={"create-room-btn"}
          onClick={handleCreateRoom}
        ></Button>
        <p className="text">OU INSIRA UM CÓDIGO:</p>
        <Input
          className="room-id-input"
          type="text"
          placeholder={"CÓDIGO DA SALA"}
          value={inputedRoomId}
          onChange={(e) => setInputedRoomId(e.target.value)}
        />
        {error && <p className="error-message">{error}</p>}
        <Button
          type="submit"
          className={"start-game-btn"}
          onClick={handleEnterRoomWithId}
        ></Button>
        <div>
          <Button
            type="submit"
            className={"ranking-btn"}
            onClick={() => navigate("/rankings")}
          ></Button>
          <Button
            type="submit"
            className={"tutorial-btn"}
            onClick={() => navigate("/tutorial")}
          ></Button>
        </div>
        <div>
          <Button
            type="submit"
            className={"leave-btn"}
            onClick={handleLogout}
          ></Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
