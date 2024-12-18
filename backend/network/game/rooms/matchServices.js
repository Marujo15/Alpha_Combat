import { getRoomByRoomId, removeRoomByRoomId } from "./roomServices.js";
import { clients } from "../../index.js";
import { WebSocket } from "ws";

export let matchs = new Map();

const mapSize = 1000;
const playerSize = 50;
const playerSpeed = 7
const bulletSize = 5;
const bulletSpeed = 20;
const bulletLifetime = 5000;
const shotCooldown = 5000;
const color = {
    0: 'red',
    1: 'blue',
    2: 'green',
    3: 'yellow',
}

const cords = {
    "red": [70, 70],
    "blue": [70, 530],
    "green": [930, 70],
    "yellow": [930, 530]
}

/* 
match: {
    rooId: string,
    game: {
        addPlayer(playerId: string, tankColor) => void,
        startGameLoop() => void,
    },
}
*/

export const createGame = () => {
    const walls = new Map([
        ["wall1", { x: 500, y: 150, width: 50, height: 300 }],
        ["wall2", { x: 300, y: 275, width: 450, height: 50 }],
        ["wall3", { x: 0, y: 600, width: 1000, height: 400 }],
    ]);
    // const startedAt = Date.now()
    const players = new Map();
    const bullets = new Map();
    const actionQueue = [];
    let lastTimestamp = null;

    const addPlayer = (player, tankColor) => {
        const [x, y] = cords[tankColor];

        const newPlayer = {
            id: player.id,
            name: player.name,
            kills: 0,
            deaths: 0,
            x,
            y,
            angle: Number((Math.random() * (2 * Math.PI)).toFixed(2)),
            speed: playerSpeed,
            speedX: 0,
            speedY: 0,
            canMove: true,
            canShoot: true,
            isRotating: false,
            lastShotTime: 0,
            tankColor
        };

        players.set(player.id, newPlayer);
    }

    function getRandomAngle() {
        return Math.random() * 2 * Math.PI;
    }

    function gameLoop() {
        const updates = [];

        while (actionQueue.length > 0) {
            const action = actionQueue.shift();

            switch (action.type) {
                case "move":
                    {
                        const player = players.get(action.playerId);
                        if (player) {
                            movePlayer(player, action.direction);
                            updates.push({
                                type: "playerUpdate",
                                id: player.id,
                                x: player.x,
                                y: player.y,
                                angle: player.angle,
                                speedX: player.speedX,
                                speedY: player.speedY,
                                sequenceNumber: action.sequenceNumber,
                                tankColor: player.tankColor,
                            });
                        }
                    }
                    break;
                case "shoot":
                    {
                        const player = players.get(action.playerId);
                        const currentTime = Date.now();

                        if (
                            player &&
                            !bullets.has(action.bulletId) &&
                            currentTime - player.lastShotTime > shotCooldown
                        ) {
                            if (player.canShoot) {
                                const bullet = {
                                    id: action.bulletId,
                                    playerId: player.id,
                                    x: player.x - playerSize / 2,
                                    y: player.y - playerSize / 2,
                                    speed: bulletSpeed,
                                    speedX: bulletSpeed * Math.cos(action.angle),
                                    speedY: bulletSpeed * Math.sin(action.angle),
                                    angle: action.angle,
                                    createdAt: currentTime,
                                    sequenceNumber: 0,
                                };

                                bullets.set(bullet.id, bullet);
                                player.lastShotTime = currentTime;
                            }
                        }
                    }
                    break;
                case "playerJoin":
                    updates.push(action);
                    break;
                case "playerLeave":
                    updates.push(action);
                    break;
                case "bulletHit":
                    updates.push(action);
                    break;
                case "respawn":
                    updates.push(action);
                    break;

                default:
                    console.error("Unknown action type:", action.type);
                    break;
            }
        }

        for (const [bulletId, bullet] of bullets.entries()) {
            moveBullet(bullet);

            const hitPlayer = checkBulletCollisions(bullet);
            if (hitPlayer) {
                bullets.delete(bulletId);

                const bulletOwner = players.get(bullet.playerId)

                players.set(hitPlayer.id, {
                    ...hitPlayer,
                    deaths: hitPlayer.deaths + 1,
                });
                players.set(bullet.playerId, {
                    ...bulletOwner,
                    kills: bulletOwner.kills + 1,
                });

                updates.push({
                    type: "matchStatus",
                    players: Array.from(players.values()),
                })

                const explosion = {
                    type: "explosion",
                    x: hitPlayer.x,
                    y: hitPlayer.y,
                }
                const bulletHit = {
                    type: "bulletHit",
                    playerId: hitPlayer.id,
                }
                const [playerX, playerY] = resetPlayerPosition()
                const respawn = {
                    type: "respawn",
                    playerId: hitPlayer.id,
                    playerAngle: getRandomAngle(),
                    playerX,
                    playerY,
                }

                const bulletRemove = {
                    type: "bulletRemove",
                    id: bulletId
                }

                updates.push(bulletRemove);
                updates.push(explosion);


                actionQueue.push(bulletHit);
                players.set(hitPlayer.id, {
                    ...hitPlayer,
                    isRotating: true,
                    canShoot: false,
                    canMove: false,
                });

                setTimeout(() => {


                    actionQueue.push(respawn);
                    players.set(hitPlayer.id, {
                        ...hitPlayer,
                        isRotating: false,
                        canShoot: true,
                        canMove: true,
                        x: respawn.playerX,
                        y: respawn.playerY,
                        angle: respawn.playerAngle,
                    });
                    // ws.send(
                    //     JSON.stringify({
                    //         type: "bulletHit",
                    //     })
                    // );
                    // respawnAudioRef.current.play();
                }, 3000);
            } else if (Date.now() - bullet.createdAt > bulletLifetime) {
                bullets.delete(bulletId);
                updates.push({ type: "bulletRemove", id: bulletId });
            } else {
                updates.push({
                    type: "bulletUpdate",
                    id: bulletId,
                    playerId: bullet.playerId,
                    x: bullet.x,
                    y: bullet.y,
                    angle: bullet.angle,
                    speedX: bullet.speedX,
                    speedY: bullet.speedY,
                    sequenceNumber: bullet.sequenceNumber,
                });
            }
        }

        if (updates.length > 0) {
            broadcast({
                type: "update",
                updates: updates
            });
        }

        const now = performance.now();
        if (lastTimestamp) {
            const delta = Math.round(now - lastTimestamp);
            // 
        }
        lastTimestamp = now;

        setTimeout(gameLoop, 1000 / 30);
    }

    const startGameLoop = () => {
        gameLoop();
    }

    function broadcast(message) {
        for (const player of players.values()) {
            const ws = clients.get(player.id).ws
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }

    function addAction(action, playerId) {
        const player = players.get(playerId)

        if (!player) {
            console.error("Player not found");
            return;
        }

        actionQueue.push(action);
    }

    function resetPlayerPosition() {
        const randomNumber = Math.floor(Math.random() * 4)
        const [playerX, playerY] = cords[color[randomNumber]]
        return [playerX, playerY]
    }

    function movePlayer(player, direction) {
        const oldX = player.x;
        const oldY = player.y;
        const oldAngle = player.angle;

        if (!player.canMove) {
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

        player.x = Math.max(
            playerSize,
            Math.min(mapSize, player.x)
        );

        player.y = Math.max(
            playerSize,
            Math.min(mapSize, player.y)
        );

        const wallCollision = checkWallCollision(player, playerSize, true);
        if (wallCollision) {
            // Se colidir, reverte o movimento
            player.x = oldX;
            player.y = oldY;
            player.angle = oldAngle;
        }
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

        bullet.x = Math.max(
            bulletSize,
            Math.min(mapSize - bulletSize, bullet.x)
        );

        bullet.y = Math.max(
            bulletSize,
            Math.min(mapSize - bulletSize, bullet.y)
        );

        // Verifica colisão com paredes
        const wallCollision = checkWallCollision(bullet, bulletSize);
        if (wallCollision) {
            calculateRicochet(bullet, wallCollision);
        }

        bullet.sequenceNumber++;
    }

    function calculateRicochet(bullet, wall) {
        const bulletCenterX = bullet.x;
        const bulletCenterY = bullet.y;

        const distToLeft = Math.abs(bulletCenterX - wall.x);
        const distToRight = Math.abs(bulletCenterX - (wall.x + wall.width));
        const distToTop = Math.abs(bulletCenterY - wall.y);
        const distToBottom = Math.abs(bulletCenterY - (wall.y + wall.height));

        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

        if (minDist === distToLeft || minDist === distToRight) {
            bullet.speedX *= -1;
        }
        if (minDist === distToTop || minDist === distToBottom) {
            bullet.speedY *= -1;
        }

        const buffer = bulletSize + 1;
        if (minDist === distToLeft) bullet.x = wall.x - buffer;
        if (minDist === distToRight) bullet.x = wall.x + wall.width + buffer;
        if (minDist === distToTop) bullet.y = wall.y - buffer;
        if (minDist === distToBottom) bullet.y = wall.y + wall.height + buffer;
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

    function checkWallCollision(entity, size, isPlayer = false) {
        for (const wall of walls.values()) {
            if (isPlayer) {
                if (rectCollision(
                    entity.x - size, entity.y - size, size, size,
                    wall.x, wall.y, wall.width, wall.height
                )) {
                    return wall;
                }
            } else {
                if (pointRectCollision(
                    entity.x, entity.y, size,
                    wall.x, wall.y, wall.width, wall.height
                )) {
                    return wall;
                }
            }
        }
        return null;
    }

    function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return (
            x1 < x2 + w2 &&
            x1 + w1 > x2 &&
            y1 < y2 + h2 &&
            y1 + h1 > y2
        );
    }

    function pointRectCollision(x, y, size, rectX, rectY, rectWidth, rectHeight) {
        return (
            x - size / 2 < rectX + rectWidth &&
            x + size / 2 > rectX &&
            y - size / 2 < rectY + rectHeight &&
            y + size / 2 > rectY
        );
    }

    return {
        addPlayer,
        addAction,
        startGameLoop,
        players,
        walls,
        bullets
    }
};

export const getMatchByMatchId = (matchId) => {
    const match = matchs.get(matchId);

    if (!match) {
        console.error("Match not found for matchId:", matchId);
        return [];
    }

    return match;
};

export const startMatchByRoomId = (roomId) => {
    const room = getRoomByRoomId(roomId);

    if (!room) {
        console.error("Room not found for matchId:", roomId);
        return [];
    }

    const players = room.players

    if (players.length < 2) {
        console.error("Not enough players to start a match");
        return [];
    }

    if (players.length > 4) {
        console.error("Too many players to start a match");
        return [];
    }

    const game = createGame()

    players.forEach((player, index) => {
        game.addPlayer(player, color[index])
    })

    game.startGameLoop()

    matchs.set(room.id, game);

    removeRoomByRoomId(room.id);

    players.forEach(player => {
        const ws = clients.get(player.id).ws
        const allPlayers = Array.from(game.players.values());

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "matchStarted",
                matchId: room.id,
                playerId: player.id,
                players: allPlayers,
            }));
        }
    })

    return [room.roomId, game];
};

export const getMatchByPlayerId = (playerId) => {
    for (const match of matchs.values()) {
        for (const player of match.players.values()) {
            if (player.id === playerId) {
                return match;
            }
        }
    }

    return null;
}