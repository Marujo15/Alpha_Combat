import { matchService } from '../services/matchServices.js';

export const matchController = {
    getMatchesByUserId: async (req, res) => {
        try {
            const userId = req.params.userId;
            const match = await matchService.getMatchesByUserId(userId);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found',
                });
            }

            res.status(200).json({
                success: true,
                data: match,
                message: 'Match retrieved successfully',
            });
        } catch (error) {
            console.error('Error fetching match:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching match',
            });
        }
    },

    getMatchByMatchId: async (req, res) => {
        try {
            const matchId = req.params.matchId;
            const match = await matchService.getMatchByMatchId(matchId);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found',
                });
            }

            res.status(200).json({
                success: true,
                data: match,
                message: 'Match retrieved successfully',
            });
        } catch (error) {
            console.error('Error fetching match:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching match',
            });
        }
    },

    getAllMatches: async (_req, res) => {
        try {
            const matches = await matchService.getAllMatches();

            if (!matches) {
                return res.status(404).json({
                    success: false,
                    message: 'Error fetching matches',
                });
            }

            res.status(200).json({
                success: true,
                data: matches,
                message: 'Matches retrieved successfully',
            });
        } catch (error) {
            console.error('Error fetching matches:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching matches',
            });
        }
    },

    createMatch: async (req, res) => {
        try {
            const { player1_id } = req.body;
            const newMatch = await matchService.createMatch(player1_id);

            if (!newMatch) {
                return res.status(404).json({
                    success: false,
                    message: 'Error creating match',
                });
            }

            res.status(201).json({
                success: true,
                data: newMatch,
                message: 'Match created successfully',
            });
        } catch (error) {
            console.error('Error creating match:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating match',
            });
        }
    },

    updateMatchByMatchId: async (req, res) => {
        try {
            const matchId = req.params.matchId;
            const updates = { ...req.body };

            const updatedMatch = await matchService.updateMatchByMatchId(matchId, updates);

            res.status(200).json({
                success: true,
                data: updatedMatch,
                message: 'Match updated successfully',
            });
        } catch (error) {
            console.error('Error updating match:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating match',
            });
        }
    },

    deleteMatch: async (req, res) => {
        try {
            const matchId = req.params.matchId;

            const match = await matchService.getMatchByMatchId(matchId);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Error updating match',
                });
            }

            await matchService.deleteMatch(matchId);

            res.status(200).json({
                success: true,
                message: 'Match deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting match:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting match',
            });
        }
    },
}
