import { createNewRoom } from "./rooms/createNewRoom.js";
import WebSocket from "ws";
import { addPlayerToRoom, createRoom, getRoomByRoomId, removePlayerOfTheRoom } from "./rooms/roomServices.js";
import { getMatchByPlayerId, startMatchByRoomId } from "./rooms/matchServices.js";
import { clients } from "../index.js";

const MAX_PLAYERS = 4;

/*  */

export async function onMessage(ws, message, clientId) {
    let data;

    try {
        data = JSON.parse(message);
    } catch (err) {
        console.error("Erro ao analisar mensagem JSON:", err);
        return;
    }

    let response;

    switch (data.type) {
        case "createNewRoom":
            response = await createNewRoom(data);

            if (response.type === "roomCreated") {
                const room = createRoom(
                    response.matchId,
                );

                if (!room) {
                    console.error("Erro ao criar sala");
                    return;
                }

                const player = {
                    id: response.player1_id,
                    name: response.player1_name,
                }

                const playersInTheRoom = addPlayerToRoom(room.id, player)

                response.players = playersInTheRoom;

                ws.send(JSON.stringify(response))
            } else if (response.type === "error") {
                ws.send(JSON.stringify({
                    type: "errorMessage",
                    message: response.message,
                }))
                console.error(response.message);
            }
            break;
        case "tryToEnterTheRoom":
            const playersInsideTheRoom = addPlayerToRoom(
                data.room_id,
                data.player,
            )
            if (!playersInsideTheRoom) return

            response = {
                type: "currentPlayers",
                players: playersInsideTheRoom,
                roomId: data.room_id
            };

            ws.send(JSON.stringify(response));
            break;
        case "getRoom":
            const room = getRoomByRoomId(data.matchId);
            response = {
                type: "waitingListUpdated",
                players: room.players
            };
            ws.send(JSON.stringify(response));
            break;
        case "removePlayerFromWaitingList":
            removePlayerFromWaitingList(data.playerId);
            response = { type: "waitingListUpdated", players: getRoomByRoomId() };
            if (response.players.length === 0) {
                await deteleRoom(data.matchId);
            }
            break;
        case "startMatch":
            startMatchByRoomId(data.matchId)
            break;
        case "playerLeftRoom":
            const remainingPlayers = removePlayerOfTheRoom(data.match_id, data.player_id);

            if (remainingPlayers.length === 0) {
                return
            } else {
                remainingPlayers.forEach(player => {
                    const message = {
                        type: "roomUpdated",
                        players: remainingPlayers.map(p => ({
                            id: p.id,
                            name: p.name,
                        }))
                    }

                    remainingPlayers.forEach(player => {
                        const playerWs = clients.get(player.id)
                        if (playerWs.readyState === WebSocket.OPEN) {
                            playerWs.send(JSON.stringify(message));
                        }
                    })

                });
            }
            break;
        case "playerMove":
            {
                const game = getMatchByPlayerId(clientId)

                if (!game) {
                    console.error("Player not found in a match");
                    return;
                }

                game.addAction({
                    type: "move",
                    playerId: clientId,
                    direction: data.direction,
                    sequenceNumber: data.sequenceNumber,
                    canMove: data.canMove
                }, clientId)
            }
            break;
        case "playerShoot":
            {
                const game = getMatchByPlayerId(clientId)

                if (!game) {
                    console.error("Player not found in a match");
                    return;
                }

                game.addAction({
                    type: "shoot",
                    playerId: clientId,
                    bulletId: data.bullet.id,
                    angle: data.bullet.angle,
                    tankColor: data.bullet.tankColor,
                }, clientId)
            }
            break;
        case "ping":
            {
                ws.send(JSON.stringify({
                    type: "pong",
                    id: data.id
                }));
            }
            break;
        case "getFullSnapshot":
            const game = getMatchByPlayerId(clientId)
            if (!game) {
                console.error("Player not found in a match");
                return;
            }
            game.players

            const myPlayer = game.players.get(clientId)

            const otherPlayers = Array
                .from(game.players.values())
                .filter(player => player.id !== clientId)

            ws.send(JSON.stringify({
                type: "fullSnapshot",
                myPlayer,
                players: otherPlayers,
                walls: Array.from(game.walls.values()),
                bullets: Array.from(game.bullets.values()),
            }))
            break;
        default:
            console.log("Unknown message type:", data);
    }
}