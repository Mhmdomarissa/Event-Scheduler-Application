import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { generalLimiter } from '../middleware/rateLimiter';
import { RespondInvitationSchema, MongoIdParamSchema } from '../utils/schemas';

const router = Router();
const inviteCtrl = new InvitationController();

router.use(authenticate);
router.use(generalLimiter);

// GET /api/invitations – list my invitations
router.get('/', asyncHandler(inviteCtrl.getMyInvitations.bind(inviteCtrl)));

// POST /api/invitations/:id/respond – RSVP
router.post(
  '/:id/respond',
  validate(MongoIdParamSchema, 'params'),
  validate(RespondInvitationSchema),
  asyncHandler(inviteCtrl.respondToInvitation.bind(inviteCtrl)),
);

export { router as invitationRouter };
