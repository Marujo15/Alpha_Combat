import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboardController';

const router = Router();

router.get('/user/:userId', leaderboardController.getLeaderboardByUserId);
router.get('/', leaderboardController.getAllLeaderboards);
router.post('/', leaderboardController.createUserLeaderboard);
router.patch('/user/:userId', leaderboardController.updateLeaderboardByUserId);
router.delete('/user/:userId', leaderboardController.deleteLeaderboardByUserId);