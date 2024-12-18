import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import Clock from "../../components/Clock/Clock";
import "./GamePage.css";
import shotSound from "../../../public/sounds/shot.mp3";
import explosionSound from "../../../public/sounds/explosion.mp3";
import respawnSound from "../../../public/sounds/respawn.mp3";

export default function AlphaCombat() {
  const wsUrl = import.meta.env.VITE_WS_URL;
  const canvasRef = useRef();
  const wsRef = useRef();
  const shotAudioRef = useRef(null);
  const explosionAudioRef = useRef(null);
  const respawnAudioRef = useRef(null);
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    shotAudioRef.current = new Audio(shotSound);
    explosionAudioRef.current = new Audio(explosionSound);
    respawnAudioRef.current = new Audio(respawnSound);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    wsRef.current = new WebSocket(wsUrl);
    const ws = wsRef.current;

    const mapSize = 1000;
    const playerSize = 50;
    const bulletSize = 5;
    const bulletSpeed = 20;
    const players = new Map();
    const bullets = new Map();
    const localBullets = new Map();
    const walls = new Map();
    const explosions = new Map();
    const updateQueue = [];
    const shotCooldown = 5200;
    const keyState = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      " ": false,
    };
    let gameLoopStarted = false;
    let localPlayer = null;
    let shootQueue = [];
    // let globalTickNumber = 0;
    let isReconciling = false;
    let lastServerUpdateTimestamp;
    let lastShotTime = 0;

    const redTank = new Image();
    redTank.src = "../../assets/redTank.png";
    const blueTank = new Image();
    blueTank.src = "../../assets/blueTank.png";
    const greenTank = new Image();
    greenTank.src = "../../assets/greyTank.png";
    const yellowTank = new Image();
    yellowTank.src = "../../assets/yellowTank.png";
    const grass = new Image();
    grass.src = "../../assets/grassPixel.png";
    const colors = {
      red: redTank,
      blue: blueTank,
      green: greenTank,
      yellow: yellowTank,
    };

    class PredictedEntity {
      constructor(
        id,
        x,
        y,
        speed = 5,
        angle = 0,
        isRotating = false,
        canMove = true,
        canShoot = true,
        tankColor
      ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.angle = angle; // rad
        this.moveHistory = [];
        this.canMove = canMove;
        this.canShoot = canShoot;
        this.isRotating = isRotating;
        this.sequenceNumber = 0;
        this.speedX = this.speed * Math.cos(this.angle);
        this.speedY = this.speed * Math.sin(this.angle);
        this.tankColor = tankColor;
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
      constructor(
        id,
        x,
        y,
        angle,
        isRotating = false,
        canMove = true,
        canShoot = true,
        tankColor
      ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle; // rad
        this.toX = x;
        this.toY = y;
        this.toAngle = angle;
        this.isRotating = isRotating;
        this.canMove = canMove;
        this.canShoot = canShoot;
        this.tankColor = tankColor;
      }

      updateTarget(x, y, angle, isRotating) {
        this.toX = x;
        this.toY = y;
        this.toAngle = angle;
        this.isRotating = isRotating;
      }

      rotateTarget(angle, isRotating) {
        this.toAngle = angle;
        this.isRotating = isRotating;
      }

      interpolate(t) {
        this.x = interpolate(this.x, this.toX, t);
        this.y = interpolate(this.y, this.toY, t);
        this.angle = interpolate(this.angle, this.toAngle, t);
      }
    }

    class Wall {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }

      // Verifica colisão com um ponto (útil para balas)
      checkCollision(x, y, size) {
        return (
          x - size / 2 < this.x + this.width &&
          x + size / 2 > this.x &&
          y - size / 2 < this.y + this.height &&
          y + size / 2 > this.y
        );
      }

      // Verifica colisão com um retângulo (útil para players)
      checkRectCollision(x, y, width, height) {
        return (
          x < this.x + this.width &&
          x + width > this.x &&
          y < this.y + this.height &&
          y + height > this.y
        );
      }

      // Calcula o ricochete de uma bala
      calculateRicochet(bullet) {
        // Determina qual lado da parede foi atingido
        const bulletCenterX = bullet.x;
        const bulletCenterY = bullet.y;

        // Calcula as distâncias até as bordas da parede
        const distToLeft = Math.abs(bulletCenterX - this.x);
        const distToRight = Math.abs(bulletCenterX - (this.x + this.width));
        const distToTop = Math.abs(bulletCenterY - this.y);
        const distToBottom = Math.abs(bulletCenterY - (this.y + this.height));

        // Encontra a menor distância
        const minDist = Math.min(
          distToLeft,
          distToRight,
          distToTop,
          distToBottom
        );

        // Inverte a velocidade apropriada baseado no lado atingido
        if (minDist === distToLeft || minDist === distToRight) {
          bullet.speedX *= -1;
        }
        if (minDist === distToTop || minDist === distToBottom) {
          bullet.speedY *= -1;
        }

        // Ajusta a posição para evitar que a bala fique presa na parede
        const buffer = bulletSize + 1;
        if (minDist === distToLeft) bullet.x = this.x - buffer;
        if (minDist === distToRight) bullet.x = this.x + this.width + buffer;
        if (minDist === distToTop) bullet.y = this.y - buffer;
        if (minDist === distToBottom) bullet.y = this.y + this.height + buffer;
      }
    }

    function checkWallCollisions(entity, size, isPlayer = false) {
      for (const wall of walls.values()) {
        if (isPlayer) {
          if (
            wall.checkRectCollision(
              entity.x - size,
              entity.y - size,
              size,
              size
            )
          ) {
            return wall;
          }
        } else {
          if (wall.checkCollision(entity.x, entity.y, size)) {
            return wall;
          }
        }
      }
      return null;
    }

    function interpolate(a, b, t) {
      return a + (b - a) * t;
    }

    function movePlayer(player, direction) {
      const oldX = player.x;
      const oldY = player.y;
      const oldAngle = player.angle;

      if (player.canMove === false) {
        return;
      }

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
          player.angle -= 0.06;
          player.speedX = player.speed * Math.cos(player.angle);
          player.speedY = player.speed * Math.sin(player.angle);
          break;
        case "right":
          player.angle += 0.06;
          player.speedX = player.speed * Math.cos(player.angle);
          player.speedY = player.speed * Math.sin(player.angle);
          break;
      }

      player.x = Math.max(playerSize, Math.min(mapSize, player.x));

      player.y = Math.max(playerSize, Math.min(mapSize, player.y));

      const wallCollision = checkWallCollisions(player, playerSize, true);
      if (wallCollision) {
        player.x = oldX;
        player.y = oldY;
        player.angle = oldAngle;
      }

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

      const wallCollision = checkWallCollisions(bullet, bulletSize);
      if (wallCollision) {
        wallCollision.calculateRicochet(bullet);
      }

      return bullet.addMove(undefined, bullet.x, bullet.y);
    }

    function processInput() {
      if (isReconciling) return;

      const directions = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
      ];
      directions.forEach((key) => {
        if (key !== " ") {
          if (keyState[key]) {
            const direction = key.toLowerCase().replace("arrow", "");
            const sequenceNumber = movePlayer(localPlayer, direction);
            ws.send(
              JSON.stringify({
                type: "playerMove",
                direction,
                sequenceNumber,
                canMove: localPlayer.canMove,
              })
            );
          }
        } else {
          if (keyState[key]) {
            const currentTime = Date.now();
            if (currentTime - lastShotTime > shotCooldown) {
              lastShotTime = currentTime;
              shootQueue.push({ angle: localPlayer.angle });
              shotAudioRef.current.play();
            } else {
            }
          }
        }
      });

      while (shootQueue.length > 0) {
        const shootInput = shootQueue.shift();

        if (!localPlayer.canShoot) {
          return;
        }

        const bullet = createBullet(
          localPlayer.id,
          localPlayer.x - playerSize / 2,
          localPlayer.y - playerSize / 2,
          shootInput.angle
        );

        localBullets.set(bullet.id, bullet);

        ws.send(
          JSON.stringify({
            type: "playerShoot",
            playerId: localPlayer.id,
            bullet,
          })
        );
      }
    }

    function processUpdateQueue() {
      while (updateQueue.length > 0) {
        const update = updateQueue.shift();
        switch (update.type) {
          case "playerUpdate": //parte 7 e parte 13
            if (update.id === localPlayer.id) {
              validateAndReconcile(localPlayer, update);
            } else if (players.has(update.id)) {
              players
                .get(update.id)
                .updateTarget(
                  update.x,
                  update.y,
                  update.angle,
                  false,
                  true,
                  true,
                  update.tankColor
                );
            } else {
              players.set(
                update.id,
                new InterpolatedEntity(
                  update.id,
                  update.x,
                  update.y,
                  update.angle,
                  false,
                  true,
                  true,
                  update.tankColor
                )
              );
            }
            break;
          case "bulletUpdate":
            {
              const bulletId = update.id;
              if (update.playerId === localPlayer.id) {
                if (localBullets.has(bulletId)) {
                  validateAndReconcile(localBullets.get(bulletId), update);
                }
              } else {
                if (bullets.has(bulletId)) {
                  bullets
                    .get(bulletId)
                    .updateTarget(update.x, update.y, update.angle);
                } else {
                  bullets.set(
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
            bullets.delete(update.id);
            localBullets.delete(update.id);
            break;
          case "explosion":
            createExplosion(
              update.x - playerSize / 2,
              update.y - playerSize / 2
            );
            break;
          case "bulletHit":
            {
              const hittedPlayer =
                localPlayer.id === update.playerId
                  ? localPlayer
                  : players.get(update.playerId);

              if (hittedPlayer.id === localPlayer.id) {
                localPlayer = new PredictedEntity(
                  localPlayer.id,
                  localPlayer.x,
                  localPlayer.y,
                  localPlayer.speed,
                  localPlayer.angle,
                  true,
                  false,
                  false,
                  localPlayer.tankColor
                );
                break;
              }
              players.set(
                hittedPlayer.id,

                new InterpolatedEntity(
                  hittedPlayer.id,
                  hittedPlayer.x,
                  hittedPlayer.y,
                  hittedPlayer.angle,
                  true,
                  false,
                  false,
                  hittedPlayer.tankColor
                )
              );
            }
            break;
          case "respawn":
            {
              const playerRespawned =
                localPlayer.id === update.playerId
                  ? localPlayer
                  : players.get(update.playerId);

              if (playerRespawned.id === localPlayer.id) {
                localPlayer = new PredictedEntity(
                  playerRespawned.id,
                  update.playerX,
                  update.playerY,
                  playerRespawned.speed,
                  update.playerAngle,
                  false,
                  true,
                  true,
                  playerRespawned.tankColor
                );
                break;
              }
              players.set(
                playerRespawned.id,

                new InterpolatedEntity(
                  playerRespawned.id,
                  update.playerX,
                  update.playerY,
                  update.playerAngle,
                  false,
                  true,
                  true,
                  playerRespawned.tankColor
                )
              );
            }
            break;
          case "matchStatus":
            console.log("matchStatus", update);
            const playersWithNewStatus = update.players;
            const updatedPlayers = [];
            let myPlayerUpdated = null;
            const allPlayers = [localPlayer, ...Array.from(players.values())]

            allPlayers.forEach((player) => {
              console.log('================================')
              // Busca o jogador atualizado correspondente
              const updatedPlayer = playersWithNewStatus.find(
                (p) => p.id === player.id
              );

              // Se o jogador foi atualizado
              if (updatedPlayer) {
                console.log(
                  "updatedPlayer.id === localPlayer.id",
                  updatedPlayer.id === localPlayer.id
                );
                console.log("updatedPlayer", updatedPlayer);
                console.log("localPlayer", localPlayer);

                // Atualiza o estado do jogador local
                if (updatedPlayer.id === localPlayer.id) {
                  myPlayerUpdated = updatedPlayer;
                  return
                }

                // Adiciona o jogador atualizado à lista
                updatedPlayers.push({
                  deaths: updatedPlayer.deaths,
                  id: updatedPlayer.id,
                  kills: updatedPlayer.kills,
                  name: updatedPlayer.name,
                  tankColor: updatedPlayer.tankColor,
                });
              } else {
                // Se o jogador não foi atualizado, mantém o estado atual
                updatedPlayers.push({
                  deaths: player.deaths,
                  id: player.id,
                  kills: player.kills,
                  name: player.name,
                  tankColor: player.tankColor,
                });
              }
            });

            console.log("updatedPlayers", updatedPlayers);
            console.log("myPlayerUpdated", myPlayerUpdated);

            // Atualiza os dados do jogo com os novos estados
            setGameData((prev) => ({
              ...prev,
              myPlayer: myPlayerUpdated || prev.myPlayer,
              players: updatedPlayers,
            }));

            break;
          default:
            console.error(`Unknown update type: ${update}`);
            break;
        }
      }
    }

    function validateAndReconcile(entity, serverUpdate) {
      const serverSequenceNumber = serverUpdate.sequenceNumber;
      const localMove = entity.getMoveFromSequenceNumber(serverSequenceNumber);
      if (localMove) {
        if (
          localMove.x !== serverUpdate.x ||
          localMove.y !== serverUpdate.y ||
          localMove.angle !== serverUpdate.angle
        ) {
          entity.x = serverUpdate.x;
          entity.y = serverUpdate.y;
          entity.angle = serverUpdate.angle;
          isReconciling = true;

          const movesToReapply =
            entity.getAndDeleteUnacknowledgedMoves(serverSequenceNumber);

          movesToReapply.forEach((move) => {
            if (entity === localPlayer) {
              movePlayer(entity, move.direction);
            } else {
              moveBullet(entity);
            }
          });

          isReconciling = false;
        } else {
          entity.keepUnacknowledgedMoves(serverSequenceNumber);
        }
      } else {
        entity.x = serverUpdate.x;
        entity.y = serverUpdate.y;
        entity.angle = serverUpdate.angle;
        entity.canMove = serverUpdate.canMove;
        entity.canShoot = serverUpdate.canShoot;
        entity.isRotating = serverUpdate.isRotating;
        entity.keepUnacknowledgedMoves(serverSequenceNumber);
      }

      if (entity.isRotating) {
        //parte 8
        const interval = setInterval(() => {
          entity.angle = entity.angle + 0.5;
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
        }, 3000);
      }
    }

    function createExplosion(x, y) {
      const hue = Math.floor(Math.random() * 360);
      const explosion = {
        x: x,
        y: y,
        frame: 0,
        maxFrames: 30,
        radius: 10,
        maxRadius: 100,
        hue: hue, // Store the hue value
      };
      explosions.set(`${x}-${y}-${Date.now()}`, explosion);
    }

    function checkBulletCollisions(bullet) {
      for (const player of players.values()) {
        if (player.id !== bullet.playerId) {
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
            rotatedY <= halfHeight + bulletSize &&
            !player.isRotating
          ) {
            return player;
          }
        }
      }
      return null;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "green";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      walls.forEach((wall) => {
        ctx.fillStyle = "#BBB";
        ctx.fillRect(
          wall.x * (canvas.width / mapSize),
          wall.y * (canvas.width / mapSize),
          wall.width * (canvas.width / mapSize),
          wall.height * (canvas.width / mapSize)
        );
      });

      if (localPlayer) {
        // Draw local player
        ctx.save();

        ctx.translate(
          localPlayer.x * (canvas.width / mapSize) -
            (playerSize * (canvas.width / mapSize)) / 2,
          localPlayer.y * (canvas.width / mapSize) -
            (playerSize * (canvas.width / mapSize)) / 2
        );
        ctx.rotate(localPlayer.angle);

        ctx.drawImage(
          colors[localPlayer.tankColor],
          -playerSize / 2,
          -playerSize / 3,
          playerSize,
          playerSize / 1.5
        );

        ctx.restore();

        localBullets.forEach((entity) => {
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.beginPath();
          ctx.arc(
            entity.x * (canvas.width / mapSize),
            entity.y * (canvas.width / mapSize),
            bulletSize * (canvas.width / mapSize),
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      }

      players.forEach((player) => {
        ctx.save();

        ctx.translate(
          player.x * (canvas.width / mapSize) -
            (playerSize * (canvas.width / mapSize)) / 2,
          player.y * (canvas.width / mapSize) -
            (playerSize * (canvas.width / mapSize)) / 2
        );

        ctx.rotate(player.angle);

        ctx.drawImage(
          colors[player.tankColor],
          -playerSize / 2,
          -playerSize / 3,
          playerSize,
          playerSize / 1.5
        );

        ctx.restore();
      });

      bullets.forEach((entity) => {
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.beginPath();
        ctx.arc(
          entity.x * (canvas.width / mapSize),
          entity.y * (canvas.width / mapSize),
          bulletSize * (canvas.width / mapSize),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Draw explosions
      explosions.forEach((explosion, key) => {
        const progress = explosion.frame / explosion.maxFrames;

        const radius =
          explosion.radius +
          (explosion.maxRadius - explosion.radius) * progress;

        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(
          (explosion.x / mapSize) * canvas.width,
          (explosion.y / mapSize) * canvas.width,
          (radius / mapSize) * canvas.width,
          0,
          2 * Math.PI
        );

        // Create gradient
        const gradient = ctx.createRadialGradient(
          (explosion.x / mapSize) * canvas.width,
          (explosion.y / mapSize) * canvas.width,
          0,
          (explosion.x / mapSize) * canvas.width,
          (explosion.y / mapSize) * canvas.width,
          (radius / mapSize) * canvas.width
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
          explosions.delete(key);
        }
      });
    }

    function gameLoop() {
      if (localPlayer) {
        processInput();

        localBullets.forEach((entity, id) => {
          moveBullet(entity);
          const hitPlayer = checkBulletCollisions(entity);
          if (hitPlayer) {
            localBullets.delete(id);
            explosionAudioRef.current.play();
            // ws.send(
            //   JSON.stringify({
            //!     type: "playerStopMoving",
            //     playerAngle: hitPlayer.angle,
            //   })
            // ); //parte 1
            // setTimeout(() => {
            //   ws.send(
            //     JSON.stringify({
            //!       type: "bulletHit",
            //     })
            //   );
            //   respawnAudioRef.current.play();
            // }, 3000);
          }
        });
      }

      players.forEach((player) => player.interpolate(0.5));
      bullets.forEach((bullet) => bullet.interpolate(0.5));

      processUpdateQueue();
      draw();
    }

    window.addEventListener("keydown", (e) => {
      keyState[e.key] = true;
    });

    window.addEventListener("keyup", (e) => {
      keyState[e.key] = false;
    });

    ws.onopen = () => {
      console.log("Connected to server");

      ws.send(
        JSON.stringify({
          type: "getFullSnapshot",
        })
      );
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);

      switch (data.type) {
        case "fullSnapshot":
          localPlayer = new PredictedEntity(
            data.myPlayer.id,
            data.myPlayer.x,
            data.myPlayer.y,
            data.myPlayer.speed,
            data.myPlayer.angle,
            false,
            true,
            true,
            data.myPlayer.tankColor
          );
          players.clear();
          data.players.forEach((player) => {
            if (player.id !== localPlayer.id) {
              players.set(
                player.id,
                new InterpolatedEntity(
                  player.id,
                  player.x,
                  player.y,
                  player.angle,
                  player.isRotating,
                  true,
                  true,
                  player.tankColor
                )
              );
            }
          });
          bullets.clear();
          data.bullets.forEach((bullet) => {
            bullets.set(
              bullet.id,
              new InterpolatedEntity(bullet.id, bullet.x, bullet.y, 0)
            );
          });
          walls.clear();
          data.walls.forEach((wall, index) => {
            walls.set(
              `wall${index}`,
              new Wall(wall.x, wall.y, wall.width, wall.height)
            );
          });
          if (!gameLoopStarted) {
            gameLoopStarted = true;
            runAtDefinedFPS(gameLoop, 30);
          }
          setGameData(data);
          break;
        case "update": //parte 6
          {
            data.updates.forEach((update) => {
              updateQueue.push(update);
            });
          }
          break;
        case "pong":
          {
            // const delta = Math.round(performance.now() - data.id);
          }
          break;
      }
    };

    ws.onclose = () => {
      players.clear();
      bullets.clear();
      localBullets.clear();
      explosions.clear();
      gameLoopStarted = false;
      navigate("/dashboard");
    };

    setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        // ws.send(JSON.stringify({ action: "ping", id: performance.now() }));
      }
    }, 1000);

    // https://jsfiddle.net/chicagogrooves/nRpVD/2/
    function runAtDefinedFPS(callback, fps) {
      let stop = false;
      // eslint-disable-next-line no-unused-vars
      let startTime, now, then, elapsed;
      const fpsInterval = 1000 / fps;

      startAnimating();

      function startAnimating() {
        then = window.performance.now();
        startTime = then;
        animate();
      }

      function animate(newtime) {
        // stop
        if (stop) {
          return;
        }

        // request another frame
        requestAnimationFrame(animate);

        // calc elapsed time since last loop
        now = newtime;
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if (elapsed > fpsInterval) {
          // Get ready for next frame by setting then=now, but...
          // Also, adjust for fpsInterval not being multiple of 16.67
          then = now - (elapsed % fpsInterval);
          // draw stuff here
          stop = callback();
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      navigate("/dashboard");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // window.addEventListener("beforeunload", (event) => {
    //   navigate("/dashboard");
    //   ws.close();
    // });
  });

  const handleGiveUpBtn = () => {
    if (window.audioRef) {
      window.audioRef.pause();
      window.audioRef.currentTime = 0;
      window.audioRef = null;
    }

    if (window.audioTimeout) {
      clearTimeout(window.audioTimeout);
      window.audioTimeout = null;
    }

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    navigate("/dashboard");
  };

  return (
    <div className="game-main-div">
      <div>
        <Clock gameData={gameData} />
      </div>
      <div>
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          style={{ border: "1px solid black" }}
        />
      </div>
      <div>
        <Button
          type="submit"
          className={"give-up-btn"}
          onClick={handleGiveUpBtn}
        ></Button>
      </div>
      <div className="players-info-div">
        {gameData && (
          <div className={`player-info-div tank${gameData.myPlayer.tankColor}`}>
            <div className="player1-img"></div>
            <div className="player-info">
              <div className="player-name">#{gameData.myPlayer.name}</div>
              <div className="player-kills">
                Kills: {gameData.myPlayer.kills}
              </div>
            </div>
          </div>
        )}
        {gameData &&
          gameData.players.map((player, index) => (
            <div
              key={index}
              className={`player-info-div tank${player.tankColor}`}
            >
              <div className={`player${index + 2}-img`}></div>
              <div className="player-info">
                <div className="player-name">#{player.name}</div>
                <div className="player-kills">Kills: {player.kills}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
