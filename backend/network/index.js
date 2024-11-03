// import { onConnect } from "./game/onConection.js";
import { onMessage } from "./game/onMessage.js";

export function initWebSocket(wss, server) {
    // Classe para gerenciar uma sala individual
    class GameRoom {
        constructor(id) {
            this.id = id;
            this.tanks = new Map();
            this.bullets = new Map();
            this.players = new Set();
            this.isRunning = false;
            this.gameLoopInterval = null;
            this.lastProcessedMoves = new Map(); // Rastreia último movimento processado por tank
        }

        addPlayer(ws) {
            if (this.players.size >= 2) return false;

            const tankId = uuidv4();
            const isFirstTank = this.tanks.size === 0;

            const tank = {
                id: tankId,
                x: isFirstTank ? 100 : 900,
                y: 300,
                angle: isFirstTank ? 0 : Math.PI,
                color: isFirstTank ? 'green' : 'blue',
                lastMoveNumber: 0
            };

            this.tanks.set(tankId, tank);
            this.players.add(ws);
            ws.tankId = tankId;
            ws.roomId = this.id;
            this.lastProcessedMoves.set(tankId, 0);

            ws.send(JSON.stringify({
                type: "spawn",
                tank,
                isFirstTank,
                roomId: this.id
            }));

            if (this.players.size === 2) {
                this.startGame();
            }

            return true;
        }

        removePlayer(ws) {
            this.players.delete(ws);
            this.tanks.delete(ws.tankId);
            this.lastProcessedMoves.delete(ws.tankId);

            this.broadcast({
                type: "playerLeft",
                tankId: ws.tankId
            });

            if (this.players.size === 0) {
                this.stopGame();
                return true;
            }
            return false;
        }

        updateTankPosition(tank, action, deltaTime = 1 / 60) {
            const speed = 200; // pixels per second
            const rotationSpeed = 3; // radians per second
            const distance = speed * deltaTime;

            if (action.forward) {
                tank.x += Math.cos(tank.angle) * distance;
                tank.y += Math.sin(tank.angle) * distance;
            }
            if (action.backward) {
                tank.x -= Math.cos(tank.angle) * distance;
                tank.y -= Math.sin(tank.angle) * distance;
            }
            if (action.left) tank.angle -= rotationSpeed * deltaTime;
            if (action.right) tank.angle += rotationSpeed * deltaTime;

            // Colisão com bordas
            const collisionWidth = 68;
            const collisionHeight = 50;
            tank.x = Math.max(collisionWidth / 2, Math.min(1000 - collisionWidth / 2, tank.x));
            tank.y = Math.max(collisionHeight / 2, Math.min(600 - collisionHeight / 2, tank.y));

            return tank;
        }

        validateAndProcessMove(tankId, moveData) {
            const tank = this.tanks.get(tankId);
            if (!tank) return false;

            const lastProcessed = this.lastProcessedMoves.get(tankId);

            // Ignora movimentos antigos ou fora de ordem
            if (moveData.moveNumber <= lastProcessed) {
                return false;
            }

            // Atualiza a posição do tank
            this.updateTankPosition(tank, moveData.actions);

            // Atualiza o último movimento processado
            this.lastProcessedMoves.set(tankId, moveData.moveNumber);
            tank.lastMoveNumber = moveData.moveNumber;

            return true;
        }

        createBullet(tankId, moveNumber) {
            const tank = this.tanks.get(tankId);
            const bullet = {
                id: uuidv4(),
                x: tank.x + Math.cos(tank.angle) * 20,
                y: tank.y + Math.sin(tank.angle) * 20,
                angle: tank.angle,
                speed: 10,
                tankId: tankId,
                createdAt: Date.now(),
                moveNumber
            };
            this.bullets.set(bullet.id, bullet);
            this.broadcast({
                type: "newBullet",
                bullet
            });
        }

        updateBullet(bullet) {
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;

            if (Date.now() - bullet.createdAt > 1500) {
                this.bullets.delete(bullet.id);
                return false;
            }

            if (bullet.x < 3 || bullet.x > 997) bullet.angle = Math.PI - bullet.angle;
            if (bullet.y < 3 || bullet.y > 597) bullet.angle = -bullet.angle;

            return true;
        }

        broadcast(message) {
            const messageStr = JSON.stringify(message);
            this.players.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageStr);
                }
            });
        }

        gameLoop() {
            // Atualiza todas as balas
            for (const bullet of this.bullets.values()) {
                this.updateBullet(bullet);
            }

            // Prepara o estado do jogo para envio
            const updates = {
                tanks: Array.from(this.tanks.values()).map(tank => ({
                    ...tank,
                    moveNumber: tank.lastMoveNumber // Inclui o número do último movimento
                })),
                bullets: Array.from(this.bullets.values()),
                moveNumber: Math.max(...Array.from(this.lastProcessedMoves.values())) // Maior moveNumber processado
            };

            this.broadcast({
                type: "update",
                gameState: updates
            });
        }

        startGame() {
            if (!this.isRunning) {
                this.isRunning = true;
                this.gameLoopInterval = setInterval(() => this.gameLoop(), 1000 / 60);
                this.broadcast({ type: "gameStart" });
            }
        }

        stopGame() {
            if (this.isRunning) {
                this.isRunning = false;
                clearInterval(this.gameLoopInterval);
                this.broadcast({ type: "gameEnd" });
            }
        }
    }

    class RoomManager {
        constructor() {
            this.rooms = new Map();
            this.waitingRoom = null;
        }

        createRoom() {
            const roomId = uuidv4();
            const room = new GameRoom(roomId);
            this.rooms.set(roomId, room);
            return room;
        }

        joinRoom(ws) {
            if (this.waitingRoom && this.rooms.has(this.waitingRoom)) {
                const room = this.rooms.get(this.waitingRoom);
                if (room.addPlayer(ws)) {
                    if (room.players.size === 2) {
                        this.waitingRoom = null;
                    }
                    return;
                }
            }

            const room = this.createRoom();
            room.addPlayer(ws);
            this.waitingRoom = room.id;
        }

        handlePlayerLeave(ws) {
            if (!ws.roomId) return;

            const room = this.rooms.get(ws.roomId);
            if (room) {
                const shouldRemoveRoom = room.removePlayer(ws);
                if (shouldRemoveRoom) {
                    this.rooms.delete(ws.roomId);
                    if (this.waitingRoom === ws.roomId) {
                        this.waitingRoom = null;
                    }
                }
            }
        }

        getRoom(roomId) {
            return this.rooms.get(roomId);
        }
    }

    const roomManager = new RoomManager();

    wss.on("connection", (ws) => {
        roomManager.joinRoom(ws);

        ws.on("message", (message) => {
            onMessage(ws, message, roomManager);
        });

        ws.on("close", () => {
            roomManager.handlePlayerLeave(ws);
        });
    });
}

