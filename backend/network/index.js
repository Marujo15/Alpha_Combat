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
            });

            ws.on("close", () => {
                console.log('WebSocket DISCONNECT')
                return;
            });
        })
    });
}
