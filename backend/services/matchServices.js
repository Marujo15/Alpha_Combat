import { matchRepository } from '../repositories/matchRepository.js';
import { ErrorApi } from '../errors/ErrorApi.js';

export const matchService = {
    getMatchesByUserId: async (userId) => {
        try {
            const match = await matchRepository.getMatchesByUserId(userId);
            return match;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to fetch match.",
                status: 500,
            });
        }
    },

    getAllMatches: async () => {
        try {
            const matches = await matchRepository.getAllMatches();
            return matches;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to fetch matches.",
                status: 500,
            });
        }
    },

    createMatch: async (player1_id, player2_id) => {
        try {
            const match = await matchRepository.createMatch(player1_id, player2_id);
            return match;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to create match.",
                status: 500,
            });
        }
    },

    updateMatchByMatchId: async (matchId, updates) => {
        try {
            const updatedMatch = await matchRepository.updateMatchByMatchId(matchId, updates);

            if(!updatedMatch) {
                throw new ErrorApi({
                    message: "Match not founded.",
                    status: 500,
                });
            }

            return updatedMatch;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to update match.",
                status: 500,
            });
        }
    },

    deleteMatch: async (matchId) => {
        try {
            const deletedmatch = await matchRepository.deleteMatch(matchId);
            return deletedmatch;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to delete match.",
                status: 500,
            });
        }
    }
}
