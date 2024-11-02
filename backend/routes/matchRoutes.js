import { Router } from 'express';
import { matchController } from '../controllers/matchController.js';

const router = Router();

router.get('/', matchController.getAllMatches);
router.get('/user/:userId', matchController.getMatchesByUserId);
router.get('/:matchId', matchController.getMatchByMatchId);
router.post('/', matchController.createMatch);
router.patch('/:matchId', matchController.updateMatchByMatchId);
router.delete('/:matchId', matchController.deleteMatch);

export default router;