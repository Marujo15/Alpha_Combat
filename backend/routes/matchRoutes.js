import { Router } from 'express';
import { matchController } from '../controllers/matchController.js';

const router = Router();

router.get('/', matchController.getAllMatches);
router.get('/:userId', matchController.getMatchesByUserId);
router.post('/', matchController.createMatch);
router.patch('/:matchId', matchController.updateMatchByMatchId);
router.delete('/:matchId', matchController.deleteMatch);

export default router;