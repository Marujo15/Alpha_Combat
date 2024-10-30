import { query } from '../config/index.js';

export const userRepository = {
    getAllUsers: async() => {
        const text = 'SELECT * FROM users';
        try {
            const { rows } = await query(text);
            return rows;
        } catch(err) {
            console.error(`Error retrieving all users: ${err.message}`);
            throw err;
        }
    }
};