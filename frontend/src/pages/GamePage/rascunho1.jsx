import { useCallback, useEffect, useRef, useState } from "react";

export default function AlphaCombat() {
  const wsUrl = import.meta.env.VITE_WS_URL;
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const gameLoopRef = useRef(null);
  const wsRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [alphaCombat, setAlphaCombat] = useState({
    players: new Map(),
    bullets: new Map(),
    localBullets: new Map(),
    walls: new Map(),
    explosions: new Map(),
    updateQueue: [],
    shotCooldown: 1200,
    gameLoopStarted: false,
    localPlayer: null,
    shootQueue: [],
    globalTickNumber: 0,
    isReconciling: false,
    lastServerUpdateTimestamp: undefined,
    lastShotTime: 0,
  });
  const [keyState, setKeyState] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    " ": false,
  });

  const playerSize = 50;
  const bulletSize = 5;
  const mapSize = 1000;
  const bulletSpeed = 10;

  useEffect(() => {
    stateRef.current = alphaCombat;
  }, [alphaCombat]);

  class PredictedEntity {
    constructor(id, x, y, speed = 5, angle = 0) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.angle = angle; // rad
      this.moveHistory = [];
      this.sequenceNumber = 0;
      this.speedX = this.speed * Math.cos(this.angle);
      this.speedY = this.speed * Math.sin(this.angle);
    }

    addMove(direction, x, y, speed = this.speed, angle = this.angle) {
      this.sequenceNumber++;
      this.moveHistory.push({
        sequenceNumber: this.sequenceNumber,
        x,
        y,
        speed,
        angle,
        direction,
      });
      return this.sequenceNumber;
    }

    getMoveFromSequenceNumber(sequenceNumber) {
      return this.moveHistory.find(
        (move) => move.sequenceNumber === sequenceNumber
      );
    }

    getAndDeleteUnacknowledgedMoves(fromSequenceNumber) {
      const moves = this.moveHistory.filter(
        (move) => move.sequenceNumber > fromSequenceNumber
      );
      this.moveHistory = [];
      this.sequenceNumber = fromSequenceNumber;
      return moves;
    }

    keepUnacknowledgedMoves(fromSequenceNumber) {
      this.moveHistory = this.moveHistory.filter(
        (move) => move.sequenceNumber > fromSequenceNumber
      );
    }
  }

  class InterpolatedEntity {
    constructor(id, x, y, angle) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.angle = angle; // rad
      this.toX = x;
      this.toY = y;
      this.toAngle = angle;
    }

    updateTarget(x, y, angle) {
      this.toX = x;
      this.toY = y;
      this.toAngle = angle;
    }

    interpolate(t) {
      this.x = interpolate(this.x, this.toX, t);
      this.y = interpolate(this.y, this.toY, t);
      this.angle = interpolate(this.angle, this.toAngle, t);
    }
  }

  const updateGameState = useCallback((updater) => {
    setAlphaCombat((prevState) => {
      const newState =
        typeof updater === "function" ? updater(prevState) : updater;
      return newState;
    });
  }, []);

  const safeStateUpdate = useCallback(
    (mutation) => {
      updateGameState((prevState) => {
        const newState = { ...prevState };

        mutation(newState);

        return newState;
      });
    },
    [updateGameState]
  );

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(wsUrl);
    let reconnectTimeout;

    socket.onopen = () => {
      console.log("WebSocket connected");
      // if (reconnectTimeout) {
      //   clearTimeout(reconnectTimeout);
      //   reconnectTimeout = null;
      // }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (!data || typeof data !== "object") {
          throw new Error("Invalid message format");
        }

        const now = performance.now();

        switch (data.type) {
          case "fullSnapshot":
            if (
              !data.player ||
              !Array.isArray(data.players) ||
              !Array.isArray(data.bullets)
            ) {
              throw new Error("Invalid snapshot data");
            }

            updateGameState((prev) => ({
              ...prev,
              localPlayer: new PredictedEntity(
                data.player.id,
                data.player.x,
                data.player.y,
                5,
                data.player.angle
              ),
              players: new Map(
                data.players.map((player) => [
                  player.id,
                  new InterpolatedEntity(
                    player.id,
                    player.x,
                    player.y,
                    player.angle
                  ),
                ])
              ),
              bullets: new Map(
                data.bullets.map((bullet) => [
                  bullet.id,
                  new InterpolatedEntity(bullet.id, bullet.x, bullet.y, 0),
                ])
              ),
              gameLoopStarted: true,
              lastServerUpdateTimestamp: now,
            }));
            break;

          case "update":
            if (!Array.isArray(data.updates)) {
              throw new Error("Invalid update data");
            }

            updateGameState((prev) => ({
              ...prev,
              lastServerUpdateTimestamp: now,
              updateQueue: [...prev.updateQueue, ...data.updates],
            }));
            break;

          case "pong":
            {
              const delta = Math.round(performance.now() - data.id);
              console.log(`ping: ${delta}ms`);
            }
            break;

          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      // Tenta reconectar após 5 segundos
      reconnectTimeout = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connectWebSocket();
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = socket;

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [updateGameState]);

  const runGameLoop = useCallback((callback, fps) => {
    const timestep = 1000 / fps;
    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (currentTime) => {
      const frameId = requestAnimationFrame(loop);
      gameLoopRef.current = frameId;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      accumulator += deltaTime;

      // Execute a lógica do jogo em steps fixos
      while (accumulator >= timestep) {
        callback();
        accumulator -= timestep;
      }

      // Renderização pode acontecer fora do timestep fixo
      draw();
    };

    const frameId = requestAnimationFrame(loop);
    gameLoopRef.current = frameId;

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  function interpolate(a, b, t) {
    return a + (b - a) * t;
  }

  // const runAtDefinedFPS = useCallback((callback, fps) => {
  //   // let stop = false;
  //   // // eslint-disable-next-line no-unused-vars
  //   // let startTime, now, then, elapsed;
  //   // const fpsInterval = 1000 / fps;

  //   // startAnimating();

  //   // function startAnimating() {
  //   //   then = window.performance.now();
  //   //   startTime = then;
  //   //   animate();
  //   // }

  //   // function animate(newtime) {
  //   //   // stop
  //   //   if (stop) {
  //   //     return;
  //   //   }

  //   //   // request another frame
  //   //   requestAnimationFrame(animate);

  //   //   // calc elapsed time since last loop
  //   //   now = newtime;
  //   //   elapsed = now - then;

  //   //   // if enough time has elapsed, draw the next frame
  //   //   if (elapsed > fpsInterval) {
  //   //     // Get ready for next frame by setting then=now, but...
  //   //     // Also, adjust for fpsInterval not being multiple of 16.67
  //   //     then = now - (elapsed % fpsInterval);
  //   //     // draw stuff here
  //   //     stop = callback();
  //   //   }
  //   // }

  //   let animationFrameId;
  //   const fpsInterval = 1000 / fps;
  //   let then = window.performance.now();

  //   const animate = (newtime) => {
  //     animationFrameId = requestAnimationFrame(animate);
  //     const now = newtime;
  //     const elapsed = now - then;

  //     if (elapsed > fpsInterval) {
  //       then = now - (elapsed % fpsInterval);
  //       const shouldStop = callback();
  //       if (shouldStop) {
  //         cancelAnimationFrame(animationFrameId);
  //       }
  //     }
  //   };

  //   animate(0);

  //   return () => cancelAnimationFrame(animationFrameId);
  // }, []);

  const gameLoop = useCallback(() => {
    console.log('game loop started');
    const currentState = stateRef.current;
    if (!currentState?.localPlayer) return;

    processInput();

    safeStateUpdate((newState) => {
      newState.localBullets.forEach((entity, id) => {
        moveBullet(entity);
        const hitPlayer = checkBulletCollisions(entity);
        if (hitPlayer) {
          newState.localBullets.delete(id);
        }
      });
    });

    // Interpolação e processamento de updates permanecem no estado atual
    currentState.players.forEach((player) => player.interpolate(0.5));
    currentState.bullets.forEach((bullet) => bullet.interpolate(0.5));

    processUpdateQueue();
  }, [safeStateUpdate]);

  function processInput() {
    if (!stateRef.current?.localPlayer || stateRef.current.isReconciling)
      return;

    console.log(keyState)

    const directions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    directions.forEach((key) => {
      if (key !== " ") {
        if (keyState[key]) {
          const direction = key.toLowerCase().replace("arrow", "");
          // console.log('localPlayer', localPlayer)
          // console.log('direction', direction)
          const sequenceNumber = movePlayer(
            stateRef.current.localPlayer,
            direction
          );

          console.log("Sending move:", {
            action: "move",
            direction,
            sequenceNumber,
          });

          wsRef.current?.send(
            JSON.stringify({
              action: "move",
              direction,
              sequenceNumber,
            })
          );
        }
      } else if (keyState[key]) {
        const currentTime = Date.now();
        if (
          currentTime - stateRef.current.lastShotTime >
          stateRef.current.shotCooldown
        ) {
          safeStateUpdate((state) => {
            state.lastShotTime = currentTime;
            state.shootQueue.push({
              angle: state.localPlayer.angle,
            });
          });
        } else {
          console.log("Shot on cooldown. Please wait.");
        }
      }
    });

    safeStateUpdate((state) => {
      while (state.shootQueue.length > 0) {
        const shootInput = state.shootQueue.shift();
        const bullet = createBullet(
          state.localPlayer.id,
          state.localPlayer.x - playerSize / 2,
          state.localPlayer.y - playerSize / 2,
          shootInput.angle
        );
        state.localBullets.set(bullet.id, bullet);
        wsRef.current?.send(
          JSON.stringify({
            action: "shoot",
            playerId: state.localPlayer.id,
            bullet,
          })
        );
      }
    });
  }

  function movePlayer(player, direction) {
    player.speedX = player.speed * Math.cos(player.angle);
    player.speedY = player.speed * Math.sin(player.angle);

    switch (direction) {
      case "up":
        player.x += player.speedX;
        player.y += player.speedY;
        break;
      case "down":
        player.x -= player.speedX;
        player.y -= player.speedY;
        break;
      case "left":
        player.angle -= 0.03;
        player.speedX = player.speed * Math.cos(player.angle);
        player.speedY = player.speed * Math.sin(player.angle);
        break;
      case "right":
        player.angle += 0.03;
        player.speedX = player.speed * Math.cos(player.angle);
        player.speedY = player.speed * Math.sin(player.angle);
        break;
    }

    player.x = Math.max(playerSize, Math.min(mapSize, player.x));

    player.y = Math.max(playerSize, Math.min(mapSize, player.y));

    // console.log(player)

    return player.addMove(direction, player.x, player.y);
  }

  function createBullet(playerId, startX, startY, angle = 0) {
    return new PredictedEntity(
      `${playerId}-${Date.now()}`,
      startX,
      startY,
      bulletSpeed,
      angle
    );
  }

  function moveBullet(bullet) {
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;

    if (bullet.x <= bulletSize || bullet.x >= mapSize - bulletSize) {
      bullet.speedX *= -1;
    }
    if (bullet.y <= bulletSize || bullet.y >= mapSize - bulletSize) {
      bullet.speedY *= -1;
    }

    bullet.x = Math.max(bulletSize, Math.min(mapSize - bulletSize, bullet.x));

    bullet.y = Math.max(bulletSize, Math.min(mapSize - bulletSize, bullet.y));

    return bullet.addMove(undefined, bullet.x, bullet.y);
  }

  function checkBulletCollisions(bullet) {
    for (const player of alphaCombat.players.values()) {
      const translatedX = bullet.x - (player.x - playerSize / 2);
      const translatedY = bullet.y - (player.y - playerSize / 2);

      const rotatedX =
        translatedX * Math.cos(-player.angle) -
        translatedY * Math.sin(-player.angle);
      const rotatedY =
        translatedX * Math.sin(-player.angle) +
        translatedY * Math.cos(-player.angle);

      const halfWidth = playerSize / 2;
      const halfHeight = playerSize / 2;

      if (
        rotatedX >= -halfWidth - bulletSize &&
        rotatedX <= halfWidth + bulletSize &&
        rotatedY >= -halfHeight - bulletSize &&
        rotatedY <= halfHeight + bulletSize
      ) {
        return player;
      }
    }
    return null;
  }

  function draw() {
    if (!ctx || !stateRef.current) return;

    const state = stateRef.current;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (state.localPlayer) {
      // Draw local player
      ctx.save();
      ctx.translate(
        state.localPlayer.x * (ctx.canvas.width / mapSize) -
          (playerSize * (ctx.canvas.width / mapSize)) / 2,
        state.localPlayer.y * (ctx.canvas.width / mapSize) -
          (playerSize * (ctx.canvas.width / mapSize)) / 2
      );
      ctx.rotate(state.localPlayer.angle);

      ctx.fillStyle = "red";
      ctx.fillRect(
        (-playerSize * (ctx.canvas.width / mapSize)) / 2,
        (-playerSize * (ctx.canvas.width / mapSize)) / 2,
        playerSize * (ctx.canvas.width / mapSize),
        playerSize * (ctx.canvas.width / mapSize)
      );
      ctx.restore();

      // Draw local bullets
      state.localBullets.forEach((entity) => {
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.beginPath();
        ctx.arc(
          entity.x * (ctx.canvas.width / mapSize),
          entity.y * (ctx.canvas.width / mapSize),
          bulletSize * (ctx.canvas.width / mapSize),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    }

    // ! // Draw other players
    state.players.forEach((player) => {
      ctx.save();

      ctx.translate(
        player.x * (ctx.canvas.width / mapSize) -
          (playerSize * (ctx.canvas.width / mapSize)) / 2,
        player.y * (ctx.canvas.width / mapSize) -
          (playerSize * (ctx.canvas.width / mapSize)) / 2
      );

      ctx.rotate(player.angle);

      ctx.fillStyle = "blue";
      ctx.fillRect(
        -(playerSize * (ctx.canvas.width / mapSize)) / 2,
        -(playerSize * (ctx.canvas.width / mapSize)) / 2,
        playerSize * (ctx.canvas.width / mapSize),
        playerSize * (ctx.canvas.width / mapSize)
      );

      ctx.restore();
    });

    // Draw bullets
    state.bullets.forEach((entity) => {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.beginPath();
      ctx.arc(
        entity.x * (ctx.canvas.width / mapSize),
        entity.y * (ctx.canvas.width / mapSize),
        bulletSize * (ctx.canvas.width / mapSize),
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Draw explosions
    state.explosions.forEach((explosion, key) => {
      const progress = explosion.frame / explosion.maxFrames;
      const radius =
        explosion.radius + (explosion.maxRadius - explosion.radius) * progress;
      const alpha = 1 - progress;

      ctx.beginPath();
      ctx.arc(
        (explosion.x / mapSize) * ctx.canvas.width,
        (explosion.y / mapSize) * ctx.canvas.height,
        (radius / mapSize) * ctx.canvas.width,
        0,
        2 * Math.PI
      );

      // Create gradient
      const gradient = ctx.createRadialGradient(
        (explosion.x / mapSize) * ctx.canvas.width,
        (explosion.y / mapSize) * ctx.canvas.height,
        0,
        (explosion.x / mapSize) * ctx.canvas.width,
        (explosion.y / mapSize) * ctx.canvas.height,
        (radius / mapSize) * ctx.canvas.width
      );

      gradient.addColorStop(0, `hsla(${explosion.hue}, 100%, 50%, 1)`);
      gradient.addColorStop(0.8, `hsla(${explosion.hue}, 100%, 50%, 0.5)`);
      gradient.addColorStop(1, `hsla(${explosion.hue}, 100%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      explosion.frame++;
      if (explosion.frame >= explosion.maxFrames) {
        state.explosions.delete(key);
      }
    });
  }

  function validateAndReconcile(entity, serverUpdate) {
    const serverSequenceNumber = serverUpdate.sequenceNumber;
    // console.log(serverUpdate)
    // console.log(JSON.stringify(entity.moveHistory, null, 2))
    const localMove = entity.getMoveFromSequenceNumber(serverSequenceNumber);

    if (localMove) {
      if (
        localMove.x !== serverUpdate.x ||
        localMove.y !== serverUpdate.y ||
        localMove.angle !== serverUpdate.angle
      ) {
        console.log(
          "Starting reconciliation from sequence number:",
          serverSequenceNumber
        );
        entity.x = serverUpdate.x;
        entity.y = serverUpdate.y;
        entity.angle = serverUpdate.angle;
        setAlphaCombat((prev) => {
          return {
            ...prev,
            isReconciling: true,
          };
        });

        const movesToReapply =
          entity.getAndDeleteUnacknowledgedMoves(serverSequenceNumber);

        movesToReapply.forEach((move) => {
          if (entity === alphaCombat.localPlayer) {
            movePlayer(entity, move.direction);
          } else {
            moveBullet(entity);
          }
        });

        setAlphaCombat((prev) => {
          return {
            ...prev,
            isReconciling: false,
          };
        });
        console.log("Reconciliation complete");
      } else {
        entity.keepUnacknowledgedMoves(serverSequenceNumber);
      }
    } else {
      entity.x = serverUpdate.x;
      entity.y = serverUpdate.y;
      entity.angle = serverUpdate.angle;
      entity.keepUnacknowledgedMoves(serverSequenceNumber);
    }
  }

  const createExplosion = useCallback(
    (x, y) => {
      const hue = Math.floor(Math.random() * 360);
      const explosion = {
        x,
        y,
        frame: 0,
        maxFrames: 30,
        radius: 10,
        maxRadius: 100,
        hue,
      };

      safeStateUpdate((newState) => {
        newState.explosions.set(`${x}-${y}-${Date.now()}`, explosion);
      });
    },
    [safeStateUpdate]
  );

  function processUpdateQueue() {
    safeStateUpdate((state) => {
      while (state.updateQueue.length > 0) {
        const update = state.updateQueue.shift();
        switch (update.type) {
          case "playerJoin":
            {
              const isMe =
                state.localPlayer && state.localPlayer.id === state.update.id;
              if (!isMe && !state.players.has(update.id)) {
                state.players.set(
                  update.id,
                  new InterpolatedEntity(
                    update.id,
                    update.x,
                    update.y,
                    update.angle
                  )
                );
              }
            }
            break;
          case "playerLeave":
            state.players.delete(update.id);
            break;
          case "playerUpdate":
            if (update.id === state.localPlayer.id) {
              validateAndReconcile(state.localPlayer, update);
            } else if (state.players.has(update.id)) {
              state.players
                .get(update.id)
                .updateTarget(update.x, update.y, update.angle);
            } else {
              state.players.set(
                update.id,
                new InterpolatedEntity(
                  update.id,
                  update.x,
                  update.y,
                  update.angle
                )
              );
            }
            break;
          case "bulletUpdate":
            {
              const bulletId = update.id;
              if (update.playerId === state.localPlayer.id) {
                if (state.localBullets.has(bulletId)) {
                  validateAndReconcile(
                    state.localBullets.get(bulletId),
                    update
                  );
                }
              } else {
                if (state.bullets.has(bulletId)) {
                  state.bullets
                    .get(bulletId)
                    .updateTarget(update.x, update.y, update.angle);
                } else {
                  state.bullets.set(
                    bulletId,
                    new InterpolatedEntity(
                      bulletId,
                      update.x,
                      update.y,
                      update.angle
                    )
                  );
                }
              }
            }
            break;
          case "bulletRemove":
            state.bullets.delete(update.id);
            state.localBullets.delete(update.id);
            break;
          case "explosion":
            createExplosion(
              update.x - playerSize / 2,
              update.y - playerSize / 2
            );
            break;
          default:
            console.error(`Unknown update type: ${update}`);
            break;
        }
      }
    });
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      // console.log("tecla pressionada", e.key)
      setKeyState((prev) => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e) => {
      // console.log("tecla solta", e.key)
      setKeyState((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    console.log("tecla apertada", )

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        setCtx(context);
      }
    }
  }, [alphaCombat]);

  useEffect(() => {
    if (stateRef.current?.localPlayer && !stateRef.current.gameLoopStarted) {
      const cleanup = runGameLoop(gameLoop, 60);
      return cleanup;
    }
  }, [runGameLoop, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{ border: "1px solid black" }}
    />
  );
}
