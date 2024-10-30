import { leaderboardRepository } from '../repositories/leaderboardRepository.js';

export const leaderboardService = {
    getLeaderboardByUserId: async (userId) => {
        return await leaderboardRepository.getLeaderboardByUserId(userId);
    },

    getAllLeaderboards: async () => {
        return await leaderboardRepository.getAllLeaderboards();
    },

    createUserLeaderboard: async (userId) => {
        return await leaderboardRepository.createUserLeaderboard(userId);
    },

    updateLeaderboardByUserId: async (userId, leaderboard) => {
        return await leaderboardRepository.updateLeaderboardByUserId(userId, leaderboard);
    },

    deleteLeaderboardByUserId: async (userId) => {
        return await leaderboardRepository.deleteLeaderboardByUserId(userId);
    }
}
