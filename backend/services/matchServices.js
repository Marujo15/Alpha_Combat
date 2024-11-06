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

    createMatch: async (player1_id) => {
        try {
            const match = await matchRepository.createMatch(player1_id);
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
                    message: "Failed to update match.",
                    status: 500,
                });
            }

            // Verifique se há dados de kills, deaths ou match_time para atualizar o leaderboard
            const shouldUpdateLeaderboard = [
                'player1_kills', 'player2_kills', 'player3_kills', 'player4_kills',
                'player1_deaths', 'player2_deaths', 'player3_deaths', 'player4_deaths',
                'match_time'
            ].some(key => updates[key] !== undefined);

            if (shouldUpdateLeaderboard) {
                const players = [
                    { id: updatedMatch.player1_id, kills: updates.player1_kills, deaths: updates.player1_deaths },
                    { id: updatedMatch.player2_id, kills: updates.player2_kills, deaths: updates.player2_deaths },
                    { id: updatedMatch.player3_id, kills: updates.player3_kills, deaths: updates.player3_deaths },
                    { id: updatedMatch.player4_id, kills: updates.player4_kills, deaths: updates.player4_deaths },
                ];

                const match_time = updates.match_time;
                const updatedLeaderboards = [];

                for (const player of players) {
                    if (player.id) {
                        const updatesPlayer = {
                            macthes: player.matches,
                            kills_count: player.kills,
                            deaths_count: player.deaths,
                            time_played: match_time,
                        };
                        const updatedLeaderboard = await leaderboardRepository.updateLeaderboardByUserId(player.id, updatesPlayer);
                        if (!updatedLeaderboard) {
                            throw new ErrorApi({
                                message: `Failed to update leaderboard for player ${player.id}.`,
                                status: 500,
                            });
                        }
                        updatedLeaderboards.push(updatedLeaderboard);
                    }
                }

                return {
                    updatedMatch,
                    updatedLeaderboards,
                };
            }

            return {
                updatedMatch,
                updatedLeaderboards: [],
            };
        } catch (error) {
            console.error('Error updating match and leaderboards:', error);
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
