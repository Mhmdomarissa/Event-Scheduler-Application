import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const authCtrl = new AuthController();

router.use(authLimiter);

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler((req, res) => Promise.resolve(authCtrl.getMe(req, res))));

export { router as authRouter };
