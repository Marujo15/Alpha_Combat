// import { enterNewMatch } from "./matches/enterNewMatch.js";

export function onMessage(ws, message, roomManager) {
    const data = JSON.parse(message);
    const room = roomManager.getRoom(ws.roomId);
    if (!room) return;

    const tank = room.tanks.get(ws.tankId);
    if (!tank) return;

    if (data.type === "move") {
        room.validateAndProcessMove(ws.tankId, {
            moveNumber: data.moveNumber,
            actions: data.actions
        });
    } else if (data.type === "shoot") {
        room.createBullet(ws.tankId, data.moveNumber);
    }
}