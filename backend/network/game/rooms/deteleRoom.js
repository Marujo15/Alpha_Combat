import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
const apiUrl = process.env.API_URL;

export const deteleRoom = async (matchId) => {
    try {
        const token = data.token;

        const response = await fetch(`${apiUrl}/api/matches/${matchId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: "include",
        });

        if (!response.ok) {
            console.error('Error deleting room:', response.statusText);
            return {
                type: 'error',
                message: 'Error deleting room',
            };
        }

        const result = await response.json();

        return {
            type: 'roomDeleted',
            message: 'Room deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting room:', error);
        return {
            type: 'error',
            message: 'Error deleting room',
        };
    }
};