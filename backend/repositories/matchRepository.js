import { pool } from '../database/database.js';
import { ErrorApi } from '../errors/ErrorApi.js';

export const matchRepository = {
    getMatchesByUserId: async (userId) => {
        try {
            const query = `
                SELECT * FROM matches
                WHERE player1_id = $1 OR player2_id = $1;
            `;
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching match' });
        }
    },

    getMatchByMatchId: async (matchId) => {
        try {
            const query = `
                SELECT * FROM matches
                WHERE id = $1;
            `;
            const result = await pool.query(query, [matchId]);
            return result.rows[0];
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching match' });
        }
    },

    getAllMatches: async () => {
        try {
            const query = `
                SELECT * FROM matches;
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching matches' });
        }
    },

    createMatch: async (player1_id) => {
        const query = `
            INSERT INTO matches (player1_id) 
            VALUES ($1) 
            RETURNING *;
        `;
        try {
            const result = await pool.query(query, [player1_id]);
            return result.rows[0];
        } catch (error) {
            console.error("Error creating match entry:", error);
            throw new ErrorApi({
                message: "Failed to create match entry.",
                status: 500,
            });
        }
    },
    
    updateMatchByMatchId: async (matchId, updates) => {
        const fields = [];
        const values = [];

        if (updates.player2_id !== undefined) {
            fields.push(`player2_id = $${fields.length + 1}`);
            values.push(updates.player2_id);
        }
        if (updates.player3_id !== undefined) {
            fields.push(`player3_id = $${fields.length + 1}`);
            values.push(updates.player3_id);
        }
        if (updates.player4_id !== undefined) {
            fields.push(`player4_id = $${fields.length + 1}`);
            values.push(updates.player4_id);
        }
        if (updates.player1_kills !== undefined) {
            fields.push(`player1_kills = $${fields.length + 1}`);
            values.push(updates.player1_kills);
        }
        if (updates.player2_kills !== undefined) {
            fields.push(`player2_kills = $${fields.length + 1}`);
            values.push(updates.player2_kills);
        }
        if (updates.player3_kills !== undefined) {
            fields.push(`player3_kills = $${fields.length + 1}`);
            values.push(updates.player3_kills);
        }
        if (updates.player4_kills !== undefined) {
            fields.push(`player4_kills = $${fields.length + 1}`);
            values.push(updates.player4_kills);
        }
        if (updates.player1_deaths !== undefined) {
            fields.push(`player1_deaths = $${fields.length + 1}`);
            values.push(updates.player1_deaths);
        }
        if (updates.player2_deaths !== undefined) {
            fields.push(`player2_deaths = $${fields.length + 1}`);
            values.push(updates.player2_deaths);
        }
        if (updates.player3_deaths !== undefined) {
            fields.push(`player3_deaths = $${fields.length + 1}`);
            values.push(updates.player3_deaths);
        }
        if (updates.player4_deaths !== undefined) {
            fields.push(`player4_deaths = $${fields.length + 1}`);
            values.push(updates.player4_deaths);
        }
        if (updates.match_time !== undefined) {
            fields.push(`match_time = $${fields.length + 1}`);
            values.push(updates.match_time);
        }

        if (fields.length === 0) {
            throw new ErrorApi({
                message: 'No valid fields to update',
                status: 400,
            });
        }

        const query = `
            UPDATE matches
            SET ${fields.join(', ')}
            WHERE id = $${fields.length + 1}
            RETURNING *;
        `;
        values.push(matchId);

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating match:', error.message);
            throw new ErrorApi({
                message: `Failed to update match: ${error.message}`,
                status: 500,
            });
        }
    },

    deleteMatch: async (matchId) => {
        const query = `
            DELETE FROM matches
            WHERE id = $1
            RETURNING *;
        `;
    
        try {
            const result = await pool.query(query, [matchId]);
            return result.rows[0];
        } catch (error) {
            console.error("Error deleting match:", error);
            throw new ErrorApi({
                message: "Failed to delete match.",
                status: 500,
            });
        }
    }
}
