import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { generalLimiter } from '../middleware/rateLimiter';
import {
  CreateEventSchema,
  UpdateEventSchema,
  ListEventsQuerySchema,
  InviteSchema,
  MongoIdParamSchema,
} from '../utils/schemas';

const router = Router();
const eventCtrl = new EventController();
const inviteCtrl = new InvitationController();

// All event routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// ── Event CRUD ────────────────────────────────────────────────────────────────

router.post(
  '/',
  validate(CreateEventSchema),
  asyncHandler(eventCtrl.createEvent.bind(eventCtrl)),
);

router.get(
  '/',
  validate(ListEventsQuerySchema, 'query'),
  asyncHandler(eventCtrl.listEvents.bind(eventCtrl)),
);

router.get(
  '/:id',
  validate(MongoIdParamSchema, 'params'),
  asyncHandler(eventCtrl.getEvent.bind(eventCtrl)),
);

router.patch(
  '/:id',
  validate(MongoIdParamSchema, 'params'),
  validate(UpdateEventSchema),
  asyncHandler(eventCtrl.updateEvent.bind(eventCtrl)),
);

router.delete(
  '/:id',
  validate(MongoIdParamSchema, 'params'),
  asyncHandler(eventCtrl.deleteEvent.bind(eventCtrl)),
);

// ── Invitations (nested under event) ─────────────────────────────────────────

router.post(
  '/:id/invite',
  validate(MongoIdParamSchema, 'params'),
  validate(InviteSchema),
  asyncHandler(inviteCtrl.inviteToEvent.bind(inviteCtrl)),
);

router.get(
  '/:id/attendees',
  validate(MongoIdParamSchema, 'params'),
  asyncHandler(inviteCtrl.getAttendees.bind(inviteCtrl)),
);

export { router as eventRouter };
