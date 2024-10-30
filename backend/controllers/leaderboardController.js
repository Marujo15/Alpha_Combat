import { leaderboardService } from '../services/leaderboardService.js';

export const leaderboardController = {
    getLeaderboardByUserId: async (req, res) => {
        try {
            const userId = req.params.userId;
            const leaderboard = await leaderboardService.getLeaderboardByUserId(userId);
            res.status(200).json(leaderboard);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    getAllLeaderboards: async (_req, res) => {
        try {
            const leaderboards = await leaderboardService.getAllLeaderboards();
            res.status(200).json(leaderboards);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    createUserLeaderboard: async (req, res) => {
        try {
            const userId = req.user;
            const leaderboard = await leaderboardService.createUserLeaderboard(userId);
            res.status(201).json(leaderboard);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    updateLeaderboardByUserId: async (req, res) => {
        try {
            const userId = req.params.userId;
            const leaderboard = await leaderboardService.updateLeaderboardByUserId(userId, req.body);
            res.status(200).json(leaderboard);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    deleteLeaderboardByUserId: async (req, res) => {
        try {
            const userId = req.params.userId;
            const leaderboard = await leaderboardService.deleteLeaderboardByUserId(userId);
            res.status(200).json(leaderboard);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
