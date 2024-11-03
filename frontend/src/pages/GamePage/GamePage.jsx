import { useEffect, useRef, useState } from "react";
const GamePage = () => {
  const canvasRef = useRef(null);
  const ws = new WebSocket("ws://localhost:3000");
  const animationFrameRef = useRef(null);
  const lastUpdateTime = useRef(0);
  const [gameStatus, setGameStatus] = useState("Conectando ao servidor...");
  const [roomId, setRoomId] = useState(null);
  const [gameState, setGameState] = useState({
    localTankId: null,
    isFirstTank: false,
    gameStarted: false,
    tanks: new Map(),
    bullets: new Map(),
    keys: {},
    moveNumber: 0,
    pendingMoves: [],
    lastProcessedMove: 0,
  });

  const updateTankPosition = (tank, actions, deltaTime) => {
    const speed = 200; // pixels per second
    const rotationSpeed = 3; // radians per second
    const distance = speed * deltaTime;

    if (actions.forward) {
      tank.x += Math.cos(tank.angle) * distance;
      tank.y += Math.sin(tank.angle) * distance;
    }
    if (actions.backward) {
      tank.x -= Math.cos(tank.angle) * distance;
      tank.y -= Math.sin(tank.angle) * distance;
    }
    if (actions.left) tank.angle -= rotationSpeed * deltaTime;
    if (actions.right) tank.angle += rotationSpeed * deltaTime;

    // Keep tank within bounds
    tank.x = Math.max(20, Math.min(980, tank.x));
    tank.y = Math.max(30, Math.min(570, tank.y));
  };

  const validateAndReconcile = (serverState) => {
    const localTank = gameState.tanks.get(gameState.localTankId);
    const serverTank = serverState.tanks.find(
      (t) => t.id === gameState.localTankId
    );

    if (!localTank || !serverTank) return;

    const serverMoveNumber = serverState.moveNumber;
    const pendingMove = gameState.pendingMoves.find(
      (move) => move.moveNumber === serverMoveNumber
    );

    if (pendingMove) {
      if (
        Math.abs(pendingMove.x - serverTank.x) > 0.1 ||
        Math.abs(pendingMove.y - serverTank.y) > 0.1 ||
        Math.abs(pendingMove.angle - serverTank.angle) > 0.1
      ) {
        console.log("Starting reconciliation from move:", serverMoveNumber);

        // Reset to server state
        localTank.x = serverTank.x;
        localTank.y = serverTank.y;
        localTank.angle = serverTank.angle;

        // Get moves to reapply
        const movesToReapply = gameState.pendingMoves.filter(
          (move) => move.moveNumber > serverMoveNumber
        );

        // Clear pending moves and add the server-confirmed move
        setGameState((prev) => ({
          ...prev,
          pendingMoves: [
            {
              actions: pendingMove.actions,
              moveNumber: serverMoveNumber,
              x: serverTank.x,
              y: serverTank.y,
              angle: serverTank.angle,
            },
          ],
        }));

        // Reapply pending moves
        movesToReapply.forEach((move) => {
          updateTankPosition(localTank, move.actions, 1 / 60);
          gameState.pendingMoves.push({
            actions: move.actions,
            moveNumber: move.moveNumber,
            x: localTank.x,
            y: localTank.y,
            angle: localTank.angle,
          });
        });

        console.log("Reconciliation complete");
      } else {
        // Remove processed moves
        setGameState((prev) => ({
          ...prev,
          pendingMoves: prev.pendingMoves.filter(
            (move) => move.moveNumber > serverMoveNumber
          ),
          lastProcessedMove: serverMoveNumber,
        }));
      }
    } else {
      // If we don't have the move, just update to server state
      localTank.x = serverTank.x;
      localTank.y = serverTank.y;
      localTank.angle = serverTank.angle;
      setGameState((prev) => ({
        ...prev,
        pendingMoves: prev.pendingMoves.filter(
          (move) => move.moveNumber > serverMoveNumber
        ),
      }));
    }

    // Update other tanks and bullets
    serverState.tanks.forEach((tank) => {
      if (tank.id !== gameState.localTankId) {
        gameState.tanks.set(tank.id, tank);
      }
    });

    gameState.bullets.clear();
    serverState.bullets.forEach((bullet) => {
      gameState.bullets.set(bullet.id, bullet);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 600;

    ws.onopen = () => {
      setGameStatus("Conectado! Aguardando outro jogador...");
    };

    const handleMessage = (message) => {
      const data = JSON.parse(message.data);

      switch (data.type) {
        case "spawn":
          setGameState((prev) => ({
            ...prev,
            localTankId: data.tank.id,
            isFirstTank: data.isFirstTank,
          }));
          setRoomId(data.roomId);
          gameState.tanks.set(data.tank.id, data.tank);
          setGameStatus(
            data.isFirstTank
              ? "Você é o tanque verde. Aguardando segundo jogador..."
              : "Você é o tanque azul. Preparando para iniciar..."
          );
          break;

        case "gameStart":
          setGameState((prev) => ({ ...prev, gameStarted: true }));
          setGameStatus("Partida iniciada! Boa sorte!");
          break;

        case "gameEnd":
          setGameState((prev) => ({ ...prev, gameStarted: false }));
          setGameStatus("Partida encerrada! O outro jogador saiu.");
          break;

        case "update":
          validateAndReconcile(data.gameState);
          break;

        case "newBullet":
          gameState.bullets.set(data.bullet.id, data.bullet);
          break;

        case "playerLeft":
          gameState.tanks.delete(data.tankId);
          setGameStatus("O outro jogador saiu. Aguardando novo jogador...");
          break;
      }
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setGameStatus(
        "Desconectado do servidor. Recarregue a página para reconectar."
      );
      setGameState((prev) => ({ ...prev, gameStarted: false }));
    };

    const handleKeyDown = (e) => {
      gameState.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameState.keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const drawTank = (tank) => {
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.rotate(tank.angle);

      ctx.fillStyle = tank.color;
      ctx.fillRect(-20, -10, 30, 20);
      ctx.fillRect(-40, -30, 68, 20);
      ctx.fillRect(-40, 10, 68, 20);
      ctx.fillRect(0, -2.5, 20, 5);

      ctx.restore();
    };

    const drawBullet = (bullet) => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    };

    const gameLoop = (timestamp) => {
      const deltaTime = (timestamp - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = timestamp;

      if (gameState.gameStarted && gameState.localTankId) {
        const localTank = gameState.tanks.get(gameState.localTankId);
        if (localTank) {
          const controls = gameState.isFirstTank
            ? { forward: "w", backward: "s", left: "a", right: "d", shoot: " " }
            : {
                forward: "ArrowUp",
                backward: "ArrowDown",
                left: "ArrowLeft",
                right: "ArrowRight",
                shoot: "Enter",
              };

          const actions = {
            forward: gameState.keys[controls.forward] || false,
            backward: gameState.keys[controls.backward] || false,
            left: gameState.keys[controls.left] || false,
            right: gameState.keys[controls.right] || false,
          };

          // Predict movement locally
          updateTankPosition(localTank, actions, deltaTime);

          // Send move to server
          const moveNumber = gameState.moveNumber + 1;
          ws.send(
            JSON.stringify({
              type: "move",
              actions,
              moveNumber,
            })
          );

          // Store pending move
          setGameState((prev) => ({
            ...prev,
            moveNumber,
            pendingMoves: [
              ...prev.pendingMoves,
              {
                actions,
                moveNumber,
                x: localTank.x,
                y: localTank.y,
                angle: localTank.angle,
              },
            ],
          }));

          if (gameState.keys[controls.shoot]) {
            ws.send(
              JSON.stringify({
                type: "shoot",
                moveNumber,
              })
            );
            gameState.keys[controls.shoot] = false;
          }
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      gameState.tanks.forEach((tank) => drawTank(tank));
      gameState.bullets.forEach((bullet) => drawBullet(bullet));

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    lastUpdateTime.current = performance.now();
    gameLoop(lastUpdateTime.current);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (ws) ws.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="game-container">
      <div className="card">
        <div className="status-container">
          <div className="status-text">{gameStatus}</div>
          {roomId && <div className="room-text">Sala: {roomId}</div>}
        </div>
        <canvas ref={canvasRef} className="game-canvas" />
      </div>
    </div>
  );
};

export default GamePage;
