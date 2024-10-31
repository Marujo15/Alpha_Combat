import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboardController.js';

const router = Router();

router.get('/', leaderboardController.getAllLeaderboards);
router.get('/:userId', leaderboardController.getLeaderboardByUserId);
router.patch('/:userId', leaderboardController.updateLeaderboardByUserId);

export default router;