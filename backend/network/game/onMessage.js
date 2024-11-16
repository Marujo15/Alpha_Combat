import { createNewRoom } from "./rooms/createNewRoom.js";
import WebSocket from "ws";
import { addPlayerToRoom, createRoom, getRoomByRoomId, removePlayerOfTheRoom } from "./rooms/roomServices.js";

const MAX_PLAYERS = 4;

export async function onMessage(ws, message, clients) {
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

            // {
            //     type: 'roomCreated',
            //     message: 'Room created successfully',
            //     matchId: result.data.id,
            //     player1_id: result.data.player1_id,
            //     player1_name: data.player1_name,
            // } 
            // ou
            // {
            //     type: 'error',
            //     message: 'Error creating room',
            // }

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

                const playersInTheRoom = addPlayerToRoom(room.id, player, clients)

                response.players = playersInTheRoom;

                console.log('response', response)
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
            console.log('RoomId: ', data.room_id)
            const playersInsideTheRoom = addPlayerToRoom(
                data.room_id, 
                data.player, 
                clients
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
            // pegar jogadores da sala
            // avisar esses jogadores que sua sala esta pronta 
            const players = removePlayerFromWaitingList(data.matchId, data.playerId);
            response = {
                type: "matchStarted",
                message: "Match started successfully",
                players: getRoomByRoomId(data.matchId)
            };
            break;
        case "playerLeftRoom":
            const remainingPlayers = removePlayerOfTheRoom(data.match_id, data.player_id, clients);

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
        default:
            console.log("Unknown message type:", data.type);
    }
}