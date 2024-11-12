import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import { onMessage } from "./game/onMessage.js";

export const initWebSocket = (wss) => {
    const mapSize = 1000;
    const playerSize = 50;
    const bulletSize = 5; // Ajustado para corresponder ao frontend
    const bulletSpeed = 10;
    const bulletLifetime = 5000;
    const players = new Map();
    const bullets = new Map();
    const actionQueue = [];
    const shotCooldown = 1000;
    let lastTimestamp = null;

    function resetPlayerPosition(player) {
        player.canMove = true;
        player.x = Math.floor(Math.random() * (mapSize - playerSize)) + playerSize / 2;
        player.y = Math.floor(Math.random() * (mapSize - playerSize)) + playerSize / 2;
    }

    function movePlayer(player, direction) {
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

        player.x = Math.max(
            playerSize,
            Math.min(mapSize, player.x)
        );

        player.y = Math.max(
            playerSize,
            Math.min(mapSize, player.y)
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

        bullet.x = Math.max(
            bulletSize,
            Math.min(mapSize - bulletSize, bullet.x)
        );

        bullet.y = Math.max(
            bulletSize,
            Math.min(mapSize - bulletSize, bullet.y)
        );

        bullet.sequenceNumber++;
    }

    function checkBulletCollisions(bullet) {
        for (const player of players.values()) {
            // console.log("player.isRotating", player.isRotating)
            if (player.id !== bullet.playerId) {
                const translatedX = bullet.x - (player.x - playerSize / 2);
                const translatedY = bullet.y - (player.y - playerSize / 2);

                const rotatedX = translatedX * Math.cos(-player.angle) - translatedY * Math.sin(-player.angle);
                const rotatedY = translatedX * Math.sin(-player.angle) + translatedY * Math.cos(-player.angle);

                const halfWidth = playerSize / 2
                const halfHeight = playerSize / 2
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
                    {
                        const player = players.get(action.playerId);
                        player.canMove = true;
                        player.canShoot = true;
                        resetPlayerPosition(player);
                        const playerUpdate = {
                            type: "playerUpdate",
                            id: player.id,
                            x: player.x,
                            y: player.y,
                            canMove: true,
                            canShoot: true,
                            isRotating: false,
                            angle: player.angle,
                            speedX: player.speedX,
                            speedY: player.speedY,
                        };
                        players.set(player.id, { ...player, isRotating: false });
                        updates.push(playerUpdate);
                    }
                    break;
                case "stopMoving":
                    {
                        const player = players.get(action.playerId);
                        player.canMove = false;
                        player.canShoot = false;
                        updates.push({
                            type: "playerUpdate",
                            id: player.id,
                            x: player.x,
                            y: player.y,
                            canMove: false,
                            canShoot: false,
                            isRotating: true,
                            angle: action.playerAngle,
                            speedX: player.speedX,
                            speedY: player.speedY,
                        })
                    }
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
                updates.push({
                    type: "explosion",
                    x: hitPlayer.x,
                    y: hitPlayer.y,
                });
                bullets.delete(bulletId);
                updates.push({ type: "bulletRemove", id: bulletId });
                players.set(hitPlayer.id, { ...hitPlayer, isRotating: true });
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
            broadcast({ type: "update", updates: updates });
        }

        const now = performance.now();
        if (lastTimestamp) {
            const delta = Math.round(now - lastTimestamp);
            // console.log(delta);
        }
        lastTimestamp = now;

        setTimeout(gameLoop, 1000 / 60);
    }

    function broadcast(message) {
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        }
    }

    wss.on("connection", (ws) => {
        roomManager.joinRoom(ws);

        ws.on("message", (message) => {
            const data = JSON.parse(message);
            if (data.action === "move") {
                actionQueue.push({
                    type: "move",
                    playerId: player.id,
                    direction: data.direction,
                    sequenceNumber: data.sequenceNumber,
                    canMove: data.canMove
                });
            } else if (data.action === "shoot") {
                actionQueue.push({
                    type: "shoot",
                    playerId: data.playerId,
                    bulletId: data.bullet.id,
                    angle: data.bullet.angle,
                });
            } else if (data.action === "ping") {
                ws.send(JSON.stringify({
                    type: "pong",
                    id: data.id
                }));
            } else if (data.action === "bulletHit") {
                actionQueue.push({
                    type: "bulletHit",
                    playerId: data.playerId,
                });
            } else if (data.action === "stopMoving") {
                actionQueue.push({
                    type: "stopMoving",
                    playerId: data.playerId,
                    playerAngle: data.playerAngle
                });
            }
        });

        ws.on("close", () => {
            players.delete(player.id);
            actionQueue.push({
                type: "playerLeave",
                id: player.id,
            });
        });
    });

    gameLoop();
}