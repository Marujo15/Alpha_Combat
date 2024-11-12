import { leaderboardService } from '../services/leaderboardService.js';
import { formatTimePlayed } from '../utils/formatTimePlayed.js';

export const leaderboardController = {
    getLeaderboardByUserId: async (req, res) => {
        try {
            const userId = req.params.userId;
            const leaderboard = await leaderboardService.getLeaderboardByUserId(userId);

            if (!leaderboard) {
                return res.status(404).json({
                    success: false,
                    message: 'Leaderboard not found',
                });
            }

            res.status(201).json({
                success: true,
                data: leaderboard,
                message: 'Leaderboard retrieved successfully',
            });
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching leaderboard',
            });
        }
    },

    getAllLeaderboards: async (_req, res) => {
        try {
            const leaderboards = await leaderboardService.getAllLeaderboards();

            if (!leaderboards) {
                return res.status(404).json({
                    success: false,
                    message: 'Error fetching leaderboards',
                });
            }

            res.status(201).json({
                success: true,
                data: leaderboards,
                message: 'Leaderboards retrieved successfully',
            });
        } catch (error) {
            console.error('Error fetching leaderboards:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching leaderboards',
            });
        }
    },

    updateLeaderboardByUserId: async (req, res) => {
        try {
            const userId = req.params.userId;
            const updates = {
                matches: req.body.matches ? parseInt(req.body.matches, 10) : undefined,
                kills_count: req.body.kills_count ? parseInt(req.body.kills_count, 10) : undefined,
                deaths_count: req.body.deaths_count ? parseInt(req.body.deaths_count, 10) : undefined,
                time_played: formatTimePlayed(req.body.time_played),
            };
            const updatedLeaderboard = await leaderboardService.updateLeaderboardByUserId(
                userId,
                updates
            );

            if (!updatedLeaderboard) {
                return res.status(404).json({
                    success: false,
                    message: 'Error updating leaderboard',
                });
            }

            res.status(200).json({
                success: true,
                data: updatedLeaderboard,
                message: 'Leaderboard updated successfully',
            });
        } catch (error) {
            console.error('Error updating leaderboards:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating leaderboards',
            });
        }
    }
}
