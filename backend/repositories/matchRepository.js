import { pool } from '../database/database.js';

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

    createMatch: async (player1_id, player2_id) => {
        const query = `
            INSERT INTO matches (player1_id, player2_id) 
            VALUES ($1, $2) 
            RETURNING *;
        `;
        try {
            const result = await pool.query(query, [player1_id, player2_id]);
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
        const query = `
            UPDATE matches
            SET
                player1_kills = $1,
                player2_kills = $2,
                player1_deaths = $3,
                player2_deaths = $4,
                winner_id = $5,
                defeated_id = $6,
                draw = $7,
                match_time = $8
            WHERE id = $9
            RETURNING *;
        `;
    
        const values = [
            updates.player1_kills,
            updates.player2_kills,
            updates.player1_deaths,
            updates.player2_deaths,
            updates.winner_id || null,
            updates.defeated_id || null,
            updates.draw,
            updates.match_time,
            matchId
        ];
    
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error updating match:", error);
            throw new ErrorApi({
                message: "Failed to update match.",
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
