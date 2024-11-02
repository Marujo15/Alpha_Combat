import { matchRepository } from '../repositories/matchRepository.js';
import { leaderboardRepository } from '../repositories/leaderboardRepository.js';
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

    getMatchByMatchId: async (matchId) => {
        try {
            const match = await matchRepository.getMatchByMatchId(matchId);
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

            if (!updatedMatch) {
                throw new ErrorApi({
                    message: "Match not founded.",
                    status: 500,
                });
            }

            let updatesPlayer1 = {};
            let updatesPlayer2 = {};

            if (updates.draw) {
                updatesPlayer1.draws = 1;
                updatesPlayer2.draws = 1;
            } else {
                if (updates.winner_id === updatedMatch.player1_id) {
                    updatesPlayer1.victories = 1;
                    updatesPlayer2.defeats = 1;
                } else if (updates.winner_id === updatedMatch.player2_id) {
                    updatesPlayer1.defeats = 1;
                    updatesPlayer2.victories = 1;
                }
            }

            const { player1_kills, player1_deaths, match_time } = updates;
            updatesPlayer1 = { ...updatesPlayer1, matches: 1, kills_count: player1_kills, deaths_count: player1_deaths, time_played: match_time };
            const updatedLeaderboardPlayer1 = await leaderboardRepository.updateLeaderboardByUserId(updatedMatch.player1_id, updatesPlayer1);

            const { player2_kills, player2_deaths } = updates;
            updatesPlayer2 = { ...updatesPlayer2, matches: 1, kills_count: player2_kills, deaths_count: player2_deaths, time_played: match_time };
            const updatedLeaderboardPlayer2 = await leaderboardRepository.updateLeaderboardByUserId(updatedMatch.player2_id, updatesPlayer2);

            if (!updatedLeaderboardPlayer1 || !updatedLeaderboardPlayer2) {
                throw new ErrorApi({
                    message: "Failed to update leaderboard.",
                    status: 500,
                });
            }

            const matchEndedReturn = { updatedMatch, updatedLeaderboardPlayer1, updatedLeaderboardPlayer2 };

            return matchEndedReturn;
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
