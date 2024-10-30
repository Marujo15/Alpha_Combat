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

    createUserLeaderboard: async (userId) => {
        try {
            const query = `
                INSERT INTO leaderboards (user_id)
                VALUES ($1)
                RETURNING *;
            `;
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error creating leaderboard' });
        }
    },
    
    updateLeaderboardByUserId: async (userId, leaderboard) => {
        const { victory, defeat, score_time, all_time } = leaderboard;
        
        const updates = [];
        const values = [userId];
      
        if (victories !== undefined) {
          updates.push('victories = $' + (updates.length + 1));
          values.push(victories);
        }
      
        if (defeats !== undefined) {
          updates.push('defeats = $' + (updates.length + 1));
          values.push(defeats);
        }
      
        if (score_time !== undefined) {
          updates.push('score_time = $' + (updates.length + 1));
          values.push(score_time);
        }
      
        if (all_time !== undefined) {
          updates.push('all_time = $' + (updates.length + 1));
          values.push(all_time);
        }
      
        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        try {
            const query = `
                UPDATE leaderboards
                SET ${updates.join(', ')}
                WHERE user_id = $1
                RETURNING *;
            `;
            const result = await pool.query(query, [values]);
            return result.rows[0];
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error updating leaderboard' });
          }
    },

    deleteLeaderboardByUserId: async (userId) => {
        try {
            const query = `
                DELETE FROM leaderboards
                WHERE user_id = $1
                RETURNING *;
            `;
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error deleting leaderboard' });
          }
    }
}
