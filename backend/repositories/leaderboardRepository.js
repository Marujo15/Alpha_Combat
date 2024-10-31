import { pool } from '../database/database.js';

export const leaderboardRepository = {
    getLeaderboardByUserId: async (userId) => {
        try {
            const query = `
                SELECT * FROM leaderboards
                WHERE user_id = $1;
            `;
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching leaderboard' });
        }
    },

    getAllLeaderboards: async () => {
        try {
            const query = `
                SELECT * FROM leaderboards;
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching leaderboards' });
        }
    },

    createLeaderboardEntry: async (userId) => {
        const query = `
            INSERT INTO leaderboards (user_id) 
            VALUES ($1) 
            RETURNING *;
        `;
        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            console.error("Error creating leaderboard entry:", error);
            throw new ErrorApi({
                message: "Failed to create leaderboard entry.",
                status: 500,
            });
        }
    },
    
    updateLeaderboardByUserId: async (userId, updates) => {
        const fields = [];
        const values = [];
    
        if (updates.victories !== undefined) {
            fields.push(`victories = victories + $${fields.length + 1}`);
            values.push(updates.victories);
        }
        if (updates.defeats !== undefined) {
            fields.push(`defeats = defeats + $${fields.length + 1}`);
            values.push(updates.defeats);
        }
        if (updates.draws !== undefined) {
            fields.push(`draws = draws + $${fields.length + 1}`);
            values.push(updates.draws);
        }
        if (updates.kills_count !== undefined) {
            fields.push(`kills_count = kills_count + $${fields.length + 1}`);
            values.push(updates.kills_count);
        }
        if (updates.deaths_count !== undefined) {
            fields.push(`deaths_count = deaths_count + $${fields.length + 1}`);
            values.push(updates.deaths_count);
        }
        if (updates.time_played !== undefined) {
            fields.push(`time_played = time_played + $${fields.length + 1}`);
            values.push(updates.time_played);
        }
    
        if (fields.length === 0) {
            throw new ErrorApi({
                message: "No fields to update.",
                status: 400,
            });
        }
    
        const query = `
            UPDATE leaderboards
            SET ${fields.join(', ')}
            WHERE user_id = $${fields.length + 1}
            RETURNING *;
        `;
    
        values.push(userId);
    
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error updating leaderboard:", error);
            throw new ErrorApi({
                message: "Failed to update leaderboard.",
                status: 500,
            });
        }
    }
}
