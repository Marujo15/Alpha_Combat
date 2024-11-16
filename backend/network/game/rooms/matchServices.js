export let matchs = [];

export const getMatchByMatchId = (roomId) => {
    const room = matchs.find(room => room.matchId === roomId);
    return room ? room : [];
};

export const addPlayerToWaitingList = (matchId, playerId, playerName) => {
    let room = matchs.find(room => room.matchId === matchId);

    if (!room) {
        room = { matchId, players: [] };
        matchs.push(room);
    }

    if (room.players.length < 4 && !room.players.includes(playerId)) {
        room.players.push({ playerId, playerName });
    }

    return room.players;
};

export const removePlayerFromWaitingList = (matchId, playerId) => {
    const room = matchs.find(room => room.matchId === matchId);

    if (!room) {
        console.error("Room not found for matchId:", matchId);
        return [];
    }

    const filteredPlayers =  room.players = room.players.filter(player => player.playerId !== playerId);

    room.players = filteredPlayers;

    if (room.players.length === 0) {
        matchs = matchs.filter(r => r.matchId !== matchId);
    }

    return room ? room.players : [];
};

