import { WebSocket } from "ws";
import { clients } from "../../index.js";

export let rooms = new Map();

/* 
rooms: room[]

room: {
    roomId: string,
    players: player[]
}

player: { 
    id: string, 
    name: string,
}
*/

const MAX_PLAYERS = 4

export const getRoomByRoomId = (roomId/* string */) => {
    const room = rooms.get(roomId);
    return room ? room : []
};

export const createRoom = (roomId/* string */) => {
    if (rooms.has(roomId)) {
        return handleRoomError(roomId, 'Room already exists')
    }

    const room = { id: roomId, players: [] };

    rooms.set(room.id, room);

    return room;
}

export const addPlayerToRoom = (
    roomId/* string */,
    player/* { id: string, name: string } */,
) => {
    const room = rooms.get(roomId);

    const { id, name } = player // Just to know what are into player

    if (!room) {
        return handleRoomError(clients.get(id).ws, "Room not found")
    }

    if (room.players.length >= MAX_PLAYERS) {
        return handleRoomError(clients.get(id).ws, "Room is full")
    }

    const idOfTheRoom = isPlayerInAnyRoom(id)

    if (idOfTheRoom) {
        return handleRoomError(clients.get(id).ws, `Player already in room: ${idOfTheRoom}`)
    }

    room.players.push({ id, name });
    rooms.set(roomId, room);


    room.players.forEach(p => {
        const ws = clients.get(p.id).ws
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "roomUpdated",
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                }))
            }));
            return
        }
        console.error(`Failed to send message to player ${p.id}`);
    });

    return room.players.map(player => ({ id: player.id, name: player.name }));
};

export const removePlayerOfTheRoom = (roomId, playerId) => {
    const room = rooms.get(roomId);

    if (!room) {
        return handleRoomError(clients.get(playerId).ws, "Room not found");
    }

    room.players = room.players.filter((player) => player.id !== playerId);

    if (room.players.length === 0) {
        rooms.delete(roomId);
    } else {
        rooms.set(roomId, room);
        room.players.forEach(p => {
            clients.get(p.id).ws.send(JSON.stringify({
                type: "roomUpdated",
                players: room.players
            }));
        });
    }

    return room.players;
};

export const removeRoomByRoomId = (roomId) => {
    if (!rooms.has(roomId)) {
        return;
    }

    rooms.delete(roomId);

    return [];
}

const isPlayerInAnyRoom = (playerId) => {
    let roomId = null;
    rooms.forEach((room, key) => {
        if (room.players.some((player) => player.id === playerId)) {
            roomId = key;
        }
    });
    return roomId; // Retorna o roomId se encontrar, ou null.
};

const handleRoomError = (ws, message) => {
    ws.send(JSON.stringify({
        type: "errorMessage",
        message
    }));
    console.error(message);
    return [];
};
