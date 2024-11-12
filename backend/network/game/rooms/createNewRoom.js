import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const apiUrl = process.env.API_URL;

export const createNewRoom = async (data) => {
    try {
        const token = data.token;

        const response = await fetch(`${apiUrl}/api/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
                player1_id: data.player1_id,
            }),
        });

        if (!response.ok) {
            console.error('Error creating room:', response.statusText);
            return {
                type: 'error',
                message: 'Error creating room',
            };
        }

        const result = await response.json();

        return {
            type: 'roomCreated',
            message: 'Room created successfully',
            matchId: result.data.id,
            player1_id: result.data.player1_id,
        };
    } catch (error) {
        console.error('Error creating room:', error);
        return {
            type: 'error',
            message: 'Error creating room',
        };
    }
};