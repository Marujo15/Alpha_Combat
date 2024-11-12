import { createNewRoom } from "./rooms/createNewRoom.js";
import { addPlayerToWaitingList, getPlayersWaitingList, removePlayerFromWaitingList } from "./rooms/setPlayersWaitingList.js";

const MAX_PLAYERS = 4;

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
            if (response.type === "roomCreated") {
                addPlayerToWaitingList(response.matchId, response.player1_id);
                response.players = getPlayersWaitingList(response.matchId);
            }
            break;
        case "removePlayerFromWaitingList":
            removePlayerFromWaitingList(data.playerId);
            response = { type: "waitingListUpdated", players: getPlayersWaitingList() };
            if (response.players.length === 0) {
                await deteleRoom(data.matchId);
            }
            break;
        case "getWaitingList":
            const waitingList = getPlayersWaitingList(data.matchId);
            response = { type: "waitingListUpdated", matchInfo: waitingList };
            break;
        case "updateRoom":
            const match = getPlayersWaitingList(data.match_id);
            // if (match.players.length >= MAX_PLAYERS) {
            //     response = { type: "error", message: "Room is full" };
            // } else {
                addPlayerToWaitingList(data.match_id, data.player_id);
                response = { type: "roomUpdated", message: "Room updated successfully", matchInfo: getPlayersWaitingList(data.match_id) };
            // }
            break;
        case "startMatch":
            removePlayerFromWaitingList(data.matchId, data.playerId);
            response = { type: "matchStarted", message: "Match started successfully", players: getPlayersWaitingList(data.matchId) };
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