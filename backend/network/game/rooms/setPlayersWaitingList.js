let rooms = [];

export const addPlayerToWaitingList = (matchId, playerId, playerName) => {
    let room = rooms.find(room => room.matchId === matchId);

    if (!room) {
        room = { matchId, players: [] };
        rooms.push(room);
    }

    if (room.players.length < 4 && !room.players.includes(playerId)) {
        room.players.push({ playerId, playerName });
    }

    return room.players;
};

export const removePlayerFromWaitingList = (matchId, playerId) => {
    const room = rooms.find(room => room.matchId === matchId);

    if (!room) {
        console.error("Room not found for matchId:", matchId);
        return [];
    }

    const filteredPlayers =  room.players = room.players.filter(player => player.playerId !== playerId);

    room.players = filteredPlayers;

    if (room.players.length === 0) {
        rooms = rooms.filter(r => r.matchId !== matchId);
    }

    return room ? room.players : [];
};

export const getPlayersWaitingList = (matchId) => {
    const room = rooms.find(room => room.matchId === matchId);
    return room ? room : [];
};