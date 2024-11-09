import React, { createContext, useState } from 'react';

export const WaitingRoomContext = createContext();

export const WaitingRoomProvider = ({ children }) => {
    const [waitingPlayers, setWaitingPlayers] = useState([]);

    return (
        <WaitingRoomContext.Provider value={{ waitingPlayers, setWaitingPlayers }}>
            {children}
        </WaitingRoomContext.Provider>
    );
};