import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { aiLimiter } from '../middleware/rateLimiter';
import { ParseEventTextSchema, SuggestTimesSchema } from '../utils/schemas';

const router = Router();
const aiCtrl = new AiController();

router.use(authenticate);
router.use(aiLimiter);

// POST /api/ai/parse-event
router.post(
  '/parse-event',
  validate(ParseEventTextSchema),
  asyncHandler(aiCtrl.parseEvent.bind(aiCtrl)),
);

// POST /api/ai/suggest-times
router.post(
  '/suggest-times',
  validate(SuggestTimesSchema),
  asyncHandler(aiCtrl.suggestTimes.bind(aiCtrl)),
);

export { router as aiRouter };
