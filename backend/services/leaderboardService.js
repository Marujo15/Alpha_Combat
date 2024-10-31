import { leaderboardRepository } from '../repositories/leaderboardRepository.js';

export const leaderboardService = {
    getLeaderboardByUserId: async (userId) => {
        try {
            const leaderboard = await leaderboardRepository.getLeaderboardByUserId(userId);
            return leaderboard;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to fetch leaderboard.",
                status: 500,
            });
        }
    },

    getAllLeaderboards: async () => {
        try {
            const leaderboards = await leaderboardRepository.getAllLeaderboards();
            return leaderboards;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to fetch leaderboards.",
                status: 500,
            });
        }
    },

    updateLeaderboardByUserId: async (userId, updates) => {
        try {
            const updatedLeaderboard = await leaderboardRepository.updateLeaderboardByUserId(userId, updates);
            return updatedLeaderboard;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to update leaderboard.",
                status: 500,
            });
        }
    }
}
