import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

export const initWebSocket = (wss) => {
    const TICK_RATE = 60;
    const TANK_SPEED = 300; // Pixels per second

    class GameRoom {
        constructor(id) {
            this.id = id;
            this.tanks = new Map();
            this.bullets = new Map();
            this.players = new Set();
            this.isRunning = false;
            this.gameLoopInterval = null;
            this.lastProcessedInputs = new Map();
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
                color: isFirstTank ? 'green' : 'blue'
            };

            this.tanks.set(tankId, tank);
            this.players.add(ws);
            this.lastProcessedInputs.set(tankId, 0);
            ws.tankId = tankId;
            ws.roomId = this.id;

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
            this.lastProcessedInputs.delete(ws.tankId);

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

        processInput(tankId, actions, moveNumber, deltaTime) {
            const tank = this.tanks.get(tankId);
            if (!tank) return false;

            const lastProcessed = this.lastProcessedInputs.get(tankId);
            if (moveNumber <= lastProcessed) return false;

            this.lastProcessedInputs.set(tankId, moveNumber);

            const moveAmount = TANK_SPEED * (deltaTime / 1000); // Convert to seconds

            if (actions.forward) {
                tank.x += Math.cos(tank.angle) * moveAmount;
                tank.y += Math.sin(tank.angle) * moveAmount;
            }
            if (actions.backward) {
                tank.x -= Math.cos(tank.angle) * moveAmount;
                tank.y -= Math.sin(tank.angle) * moveAmount;
            }
            if (actions.left) {
                tank.angle -= 0.1;
            }
            if (actions.right) {
                tank.angle += 0.1;
            }

            // Collision with boundaries
            tank.x = Math.max(0, Math.min(1000, tank.x));
            tank.y = Math.max(0, Math.min(600, tank.y));

            return true;
        }

        createBullet(tankId) {
            const tank = this.tanks.get(tankId);
            const bullet = {
                id: uuidv4(),
                x: tank.x + Math.cos(tank.angle) * 20,
                y: tank.y + Math.sin(tank.angle) * 20,
                angle: tank.angle,
                speed: 10,
                tankId: tankId,
                createdAt: Date.now()
            };
            this.bullets.set(bullet.id, bullet);
            this.broadcast({
                type: "newBullet",
                bullet
            });
        }

        updateBullets(deltaTime) {
            for (const [bulletId, bullet] of this.bullets.entries()) {
                bullet.x += Math.cos(bullet.angle) * bullet.speed;
                bullet.y += Math.sin(bullet.angle) * bullet.speed;

                if (Date.now() - bullet.createdAt > 1500) {
                    this.bullets.delete(bulletId);
                    continue;
                }

                if (bullet.x < 3 || bullet.x > 997) bullet.angle = Math.PI - bullet.angle;
                if (bullet.y < 3 || bullet.y > 597) bullet.angle = -bullet.angle;
            }
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
            const timestamp = Date.now();
            this.updateBullets();

            const worldState = {
                tanks: Array.from(this.tanks.values()),
                bullets: Array.from(this.bullets.values()),
                timestamp
            };

            this.broadcast({
                type: "worldState",
                worldState,
                lastProcessedInputs: Array.from(this.lastProcessedInputs.entries())
            });
        }

        startGame() {
            if (!this.isRunning) {
                this.isRunning = true;
                this.gameLoopInterval = setInterval(() => this.gameLoop(), 1000 / TICK_RATE);
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
            const data = JSON.parse(message);
            const room = roomManager.getRoom(ws.roomId);
            if (!room) return;

            switch (data.type) {
                case "move":
                    room.processInput(ws.tankId, data.actions, data.moveNumber, data.deltaTime);
                    break;
                case "shoot":
                    room.createBullet(ws.tankId);
                    break;
            }
        });

        ws.on("close", () => {
            roomManager.handlePlayerLeave(ws);
        });
    });
}