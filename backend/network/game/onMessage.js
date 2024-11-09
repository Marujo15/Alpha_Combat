import { createNewRoom } from "./rooms/createNewRoom.js";

export async function onMessage(ws, message, roomManager) {
    const data = JSON.parse(message);
    // const room = roomManager.getRoom(ws.roomId);
    // if (!room) return;

    // const tank = room.tanks.get(ws.tankId);
    // if (!tank) return;

    // if (data.type === "move") {
    //     room.validateAndProcessMove(ws.tankId, {
    //         moveNumber: data.moveNumber,
    //         actions: data.actions
    //     });
    // } else if (data.type === "shoot") {
    //     room.createBullet(ws.tankId, data.moveNumber);
    // } else if (data.type === "createNewRoom") {
    //     console.log("Calling createNewRoom function")
    //     createNewRoom(ws, data);
    // }

    let response;

    switch (data.type) {
        case "createNewRoom":
            response = await createNewRoom(data);
            break;
        case "greeting":
            break;
        default:
            console.log("Unknown message type:", data.type);
    }

    if (response) {
        ws.send(JSON.stringify(response));
    }
}