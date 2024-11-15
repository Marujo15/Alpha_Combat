import React, { createContext, useState } from 'react';

export const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
    const [roomId, setRoomId] = useState(null);
    const [playersOnRoom, setPlayersOnRoom] = useState([]);

    return (
        <RoomContext.Provider value={{ roomId, setRoomId, playersOnRoom, setPlayersOnRoom }}>
            {children}
        </RoomContext.Provider>
    );
};