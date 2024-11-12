let rooms = [];

export const addPlayerToWaitingList = (matchId, playerId) => {
    let room = rooms.find(room => room.matchId === matchId);

    if (!room) {
        room = { matchId, players: [] };
        rooms.push(room);
    }

    if (room.players.length < 4 && !room.players.includes(playerId)) {
        room.players.push(playerId);
    }

    return room.players;
};

export const removePlayerFromWaitingList = (matchId, playerId) => {
    const room = rooms.find(room => room.matchId === matchId);

    if (room) {
        room.players = room.players.filter(id => id !== playerId);

        if (room.players.length === 0) {
            rooms = rooms.filter(r => r.matchId !== matchId);
        }
    }

    return room ? room.players : [];
};

export const getPlayersWaitingList = (matchId) => {
    // console.log("=======matchId:", matchId);
    const room = rooms.find(room => room.matchId === matchId);
    // console.log("=======Room:", room);
    return room ? room : [];
};