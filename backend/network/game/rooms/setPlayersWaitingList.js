let playersWaitingList = [];

export const addPlayerToWaitingList = (playerId) => {
    if (!playersWaitingList.includes(playerId)) {
        playersWaitingList.push(playerId);
    }
    return playersWaitingList;
};

export const removePlayerFromWaitingList = (playerId) => {
    playersWaitingList = playersWaitingList.filter(id => id !== playerId);
    return playersWaitingList;
};

export const getPlayersWaitingList = () => {
    return {
        type: 'listUpdated',
        message: 'List retrivied successfully',
        players: playersWaitingList
    };
};