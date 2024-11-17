import WebSocket from "ws";
import { onMessage } from "./game/onMessage.js";
import { SECRET_KEY } from "../config/index.js";
import jwt from "jsonwebtoken";
import { getRoomByRoomId, removePlayerOfTheRoom, rooms } from "./game/rooms/roomServices.js";
// Remova ou ajuste a importação de onMessage se não estiver usando
// import { onMessage } from "./game/onMessage.js";

export const clients = new Map()

export const initWebSocket = (wss) => {

    wss.on("connection", (ws, req) => {
        console.log('WebSocket CONNECT')

        const token = req.headers.cookie?.split("; ").find((c) => c.startsWith("session_id="))?.split("=")[1];

        if (!token) {
            ws.close(1008, "Unauthorized");
            return;
        }

        // Verificar o token JWT
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                ws.close(1008, "Unauthorized");
                return;
            }
            const clientId = decoded.id;

            clients.set(clientId, {
                ws,
                id: decoded.id,
            })

            ws.on("message", (message,) => {
                onMessage(ws, message, clientId)

                // switch (data.action) {
                //     case "startMatch":
                //         // pegar jogadores da sala
                //         // avisar esses jogadores que sua sala esta pronta
                //         // usar os serviços de matchServices





                //         // const players = removePlayerOfTheRoom(data.matchId, data.playerId);
                //         // response = {
                //         //     type: "matchStarted",
                //         //     message: "Match started successfully",
                //         //     room: getRoomByRoomId(data.matchId)
                //         // };
                //         break;
                //     case 'startMatch': {
                //         let playerX = Math.floor(Math.random() * (mapSize - playerSize)) + playerSize / 2;
                //         let playerY = Math.floor(Math.random() * (mapSize - playerSize)) + playerSize / 2;
                //         walls.forEach((wall, id) => {
                //             while (
                //                 playerX + playerSize > wall.x &&
                //                 playerX < wall.x + wall.width &&
                //                 playerY + playerSize > wall.y &&
                //                 playerY < wall.y + wall.height
                //             ) {
                //                 playerX = Math.floor(Math.random() * (mapSize - playerSize)) + playerSize / 2;
                //                 playerY = Math.floor(Math.random() * (mapSize - playerSize)) + playerSize / 2;
                //             }
                //         })
                //         const player = {
                //             id: data.id,
                //             ws,
                //             x: playerX,
                //             y: playerY,
                //             angle: Number((Math.random() * (2 * Math.PI)).toFixed(2)),
                //             speed: 5,
                //             speedX: 0,
                //             speedY: 0,
                //             canMove: true,
                //             canShoot: true,
                //             isRotating: false,
                //             lastShotTime: 0,
                //         };

                //         players.set(clientId, player);

                //         const fullSnapshot = {
                //             type: "fullSnapshot",
                //             player: player,
                //             players: Array.from(players.values()).filter(p => p.id !== player.id),
                //             bullets: Array.from(bullets.values()),
                //             walls: Array.from(walls.values())  // Adiciona as paredes ao snapshot
                //         };

                //         ws.send(JSON.stringify(fullSnapshot));

                //         actionQueue.push({
                //             type: "playerJoin",
                //             player: {
                //                 id: player.id,
                //                 x: player.x,
                //                 y: player.y,
                //                 angle: player.angle,
                //                 speedX: player.speedX,
                //                 speedY: player.speedY,
                //                 canMove: player.canMove,
                //                 canShoot: player.canShoot,
                //                 isRotating: player.isRotating,
                //             },
                //         });
                //     }
                //         break;
                //     default:
                //         break
                // }
            });

            ws.on("close", () => {
                // Remover o jogador do mapa
                // Notificar todos os clientes sobre a saída do jogador
                // const player = players.get(clientId)
                // if (player) {
                //     actionQueue.push({
                //         type: "playerLeave",
                //         id: player.id,
                //     });
                // }
                console.log('WebSocket DISCONNECT')
                return;
            });
        })
    });
}
