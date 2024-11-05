import React, { useEffect, useRef, useState } from "react";
// import Button from '../../components/Button/Button';
import './GamePage.css';

class TankInterpolator {
  constructor() {
    this.tankBuffers = new Map();
    this.interpolationDelay = 100;
  }

  addState(tankId, state, timestamp) {
    if (!this.tankBuffers.has(tankId)) {
      this.tankBuffers.set(tankId, []);
    }
    const buffer = this.tankBuffers.get(tankId);
    buffer.push({ state, timestamp });

    const bufferDuration = 1000;
    const cutoff = timestamp - bufferDuration;
    this.tankBuffers.set(
      tankId,
      buffer.filter((item) => item.timestamp > cutoff)
    );
  }

  interpolate(tankId, renderTimestamp) {
    const buffer = this.tankBuffers.get(tankId);
    if (!buffer || buffer.length < 2) return null;

    const targetTime = renderTimestamp - this.interpolationDelay;
    let beforeState = null;
    let afterState = null;

    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i].timestamp > targetTime) {
        afterState = buffer[i];
        beforeState = buffer[i - 1];
        break;
      }
    }

    if (!beforeState || !afterState) {
      return buffer[buffer.length - 1]?.state;
    }

    const totalTime = afterState.timestamp - beforeState.timestamp;
    const currentTime = targetTime - beforeState.timestamp;
    const t = Math.max(0, Math.min(1, currentTime / totalTime));

    return {
      x: beforeState.state.x + (afterState.state.x - beforeState.state.x) * t,
      y: beforeState.state.y + (afterState.state.y - beforeState.state.y) * t,
      angle: this.interpolateAngle(
        beforeState.state.angle,
        afterState.state.angle,
        t
      ),
      color: beforeState.state.color,
    };
  }

  interpolateAngle(a1, a2, t) {
    const shortestAngle =
      ((((a2 - a1) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return a1 + shortestAngle * t;
  }
}

class TankPredictor {
  constructor() {
    this.pendingMoves = [];
  }

  predictMovement(tank, actions, moveNumber, speed = 5, rotationSpeed = 0.1) {
    const predictedState = {
      x: tank.x,
      y: tank.y,
      angle: tank.angle,
      color: tank.color,
    };

    if (actions.forward) {
      predictedState.x += Math.cos(predictedState.angle) * speed;
      predictedState.y += Math.sin(predictedState.angle) * speed;
    }
    if (actions.backward) {
      predictedState.x -= Math.cos(predictedState.angle) * speed;
      predictedState.y -= Math.sin(predictedState.angle) * speed;
    }
    if (actions.left) {
      predictedState.angle -= rotationSpeed;
    }
    if (actions.right) {
      predictedState.angle += rotationSpeed;
    }

    predictedState.x = Math.max(0, Math.min(1000, predictedState.x));
    predictedState.y = Math.max(0, Math.min(600, predictedState.y));

    this.pendingMoves.push({
      actions,
      moveNumber,
      predictedState: { ...predictedState },
    });

    return predictedState;
  }
}

const GamePage = () => {
  const canvasRef = useRef(null);
  const [gameStatus, setGameStatus] = useState("Conectando ao servidor...");
  const [roomInfo, setRoomInfo] = useState("");
  const wsRef = useRef(null);
  const gameStateRef = useRef({
    localTankId: null,
    isFirstTank: false,
    gameStarted: false,
    tanks: new Map(),
    bullets: new Map(),
    keys: {},
    moveNumber: 0,
  });
  const interpolatorRef = useRef(new TankInterpolator());
  const predictorRef = useRef(new TankPredictor());
  const lastUpdateTimeRef = useRef(performance.now());
  const animationFrameRef = useRef(null);

  const drawTank = (ctx, tank) => {
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

  const drawBullet = (ctx, bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  };

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameStateRef.current.tanks.forEach((tank) => {
      if (tank.id === gameStateRef.current.localTankId) {
        drawTank(ctx, tank);
      } else {
        const interpolatedState = interpolatorRef.current.interpolate(
          tank.id,
          performance.now()
        );
        if (interpolatedState) {
          drawTank(ctx, interpolatedState);
        }
      }
    });

    gameStateRef.current.bullets.forEach((bullet) => drawBullet(ctx, bullet));
  };

  const processInputs = () => {
    if (!gameStateRef.current.localTankId || !gameStateRef.current.gameStarted)
      return;

    const controls = gameStateRef.current.isFirstTank
      ? { forward: "w", backward: "s", left: "a", right: "d", shoot: " " }
      : {
          forward: "ArrowUp",
          backward: "ArrowDown",
          left: "ArrowLeft",
          right: "ArrowRight",
          shoot: "Enter",
        };

    const actions = {
      forward: gameStateRef.current.keys[controls.forward] || false,
      backward: gameStateRef.current.keys[controls.backward] || false,
      left: gameStateRef.current.keys[controls.left] || false,
      right: gameStateRef.current.keys[controls.right] || false,
    };

    if (Object.values(actions).some((value) => value)) {
      const moveNumber = ++gameStateRef.current.moveNumber;
      const localTank = gameStateRef.current.tanks.get(
        gameStateRef.current.localTankId
      );

      const predictedState = predictorRef.current.predictMovement(
        localTank,
        actions,
        moveNumber
      );

      Object.assign(localTank, predictedState);

      wsRef.current.send(
        JSON.stringify({
          type: "move",
          actions,
          moveNumber,
        })
      );
    }

    if (gameStateRef.current.keys[controls.shoot]) {
      wsRef.current.send(JSON.stringify({ type: "shoot" }));
      gameStateRef.current.keys[controls.shoot] = false;
    }
  };

  const gameLoop = (currentTime) => {
    const deltaTime = currentTime - lastUpdateTimeRef.current;

    if (deltaTime >= 1000 / 60) {
      processInputs();
      render();
      lastUpdateTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1000;
    canvas.height = 600;

    wsRef.current = new WebSocket("ws://localhost:3000");

    wsRef.current.onopen = () => {
      console.log("Conectado ao servidor");
      setGameStatus("Conectado! Aguardando outro jogador...");
    };

    wsRef.current.onclose = () => {
      console.log("Desconectado do servidor");
      setGameStatus(
        "Desconectado do servidor. Recarregue a página para reconectar."
      );
      gameStateRef.current.gameStarted = false;
    };

    wsRef.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const serverTimestamp = performance.now();

      switch (data.type) {
        case "spawn":
          gameStateRef.current.localTankId = data.tank.id;
          gameStateRef.current.isFirstTank = data.isFirstTank;
          gameStateRef.current.tanks.set(data.tank.id, data.tank);
          setGameStatus(
            data.isFirstTank
              ? "Você é o tanque verde. Aguardando segundo jogador..."
              : "Você é o tanque azul. Preparando para iniciar..."
          );
          setRoomInfo(`Sala: ${data.roomId}`);
          break;

        case "gameStart":
          gameStateRef.current.gameStarted = true;
          setGameStatus("Partida iniciada! Boa sorte!");
          break;

        case "update":
          data.gameState.tanks.forEach((serverTank) => {
            if (serverTank.id !== gameStateRef.current.localTankId) {
              interpolatorRef.current.addState(
                serverTank.id,
                serverTank,
                serverTimestamp
              );
            }
          });

          if (gameStateRef.current.localTankId) {
            const serverTank = data.gameState.tanks.find(
              (t) => t.id === gameStateRef.current.localTankId
            );
            if (serverTank) {
              const localTank = gameStateRef.current.tanks.get(
                gameStateRef.current.localTankId
              );
              Object.assign(localTank, serverTank);

              predictorRef.current.pendingMoves =
                predictorRef.current.pendingMoves.filter(
                  (move) => move.moveNumber > data.lastProcessedMove
                );

              predictorRef.current.pendingMoves.forEach((move) => {
                if (move.actions.forward) {
                  localTank.x += Math.cos(localTank.angle) * 5;
                  localTank.y += Math.sin(localTank.angle) * 5;
                }
                if (move.actions.backward) {
                  localTank.x -= Math.cos(localTank.angle) * 5;
                  localTank.y -= Math.sin(localTank.angle) * 5;
                }
                if (move.actions.left) {
                  localTank.angle -= 0.1;
                }
                if (move.actions.right) {
                  localTank.angle += 0.1;
                }

                localTank.x = Math.max(0, Math.min(canvas.width, localTank.x));
                localTank.y = Math.max(0, Math.min(canvas.height, localTank.y));
              });
            }
          }

          gameStateRef.current.bullets.clear();
          data.gameState.bullets.forEach((bullet) => {
            gameStateRef.current.bullets.set(bullet.id, bullet);
          });
          break;

        case "newBullet":
          gameStateRef.current.bullets.set(data.bullet.id, data.bullet);
          break;

        case "playerLeft":
          gameStateRef.current.tanks.delete(data.tankId);
          setGameStatus("O outro jogador saiu. Aguardando novo jogador...");
          break;
      }
    };

    const handleKeyDown = (e) => {
      gameStateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (wsRef.current) wsRef.current.close();
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="text-center mb-4">
          <div className="text-white text-xl mb-2">{gameStatus}</div>
          <div className="text-gray-400 text-sm">{roomInfo}</div>
        </div>
        <canvas
          ref={canvasRef}
          className="bg-black rounded-lg mx-auto max-w-full"
        />
      </div>
    </div>
  );
};

//     return (
//         <div className='game-page-container'>
//             <div className='top-page-div'>
//                 <div className='player1-info-div'>
//                     <img className='player-img' src="" alt="" />
//                     <div className='player1-info'>
//                         <p>VARANDAS</p>
//                         <p>ABATES: 37</p>
//                         <p>MORTES: 1</p>
//                     </div>
//                 </div>
//                 <div className='match-info-div'>
//                     <div className='score-div'>
//                         <p className='player1-score'>3</p>
//                         <p>:</p>
//                         <p className='player2-score'>3</p>
//                     </div>
//                     <div className='game-page-time-div'>00:48</div>
//                 </div>
//                 <div className='player2-info-div'>
//                 <img className='player-img' src="" alt="" />
//                 <div className='player2-info'>
//                     <p>MARUJO</p>
//                     <p>ABATES: 37</p>
//                     <p>MORTES: 1</p>
//                 </div>
//                 </div>
//             </div>
//             <div className='game-div'></div>
//             <Button className={'giveup-btn'} text='giveup' onClick={() => {handleGiveupBtn}}>DESISTIR</Button>
//         </div>
//     );
// };

export default GamePage;