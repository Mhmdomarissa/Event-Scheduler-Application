import { z } from 'zod';

// ── Event Schemas ─────────────────────────────────────────────────────────────

export const CreateEventSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).optional(),
    startAt: z.string().datetime({ message: 'startAt must be a valid ISO-8601 datetime' }),
    endAt: z.string().datetime({ message: 'endAt must be a valid ISO-8601 datetime' }),
    visibility: z.enum(['private', 'shared']).optional().default('private'),
    ignoreConflicts: z.boolean().optional().default(false),
  })
  .refine((data) => new Date(data.startAt) < new Date(data.endAt), {
    message: 'startAt must be before endAt',
    path: ['startAt'],
  });

export const UpdateEventSchema = z
  .object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    visibility: z.enum(['private', 'shared']).optional(),
    ignoreConflicts: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) return new Date(data.startAt) < new Date(data.endAt);
      return true;
    },
    { message: 'startAt must be before endAt', path: ['startAt'] },
  );

export const ListEventsQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['upcoming', 'ongoing', 'past']).optional(),
    startFrom: z.string().datetime().optional(),
    startTo: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.startFrom && data.startTo) {
        return new Date(data.startFrom) < new Date(data.startTo);
      }
      return true;
    },
    { message: 'startFrom must be before startTo', path: ['startFrom'] },
  );

// ── Invitation Schemas ────────────────────────────────────────────────────────

export const InviteSchema = z.object({
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email required').max(50),
});

export const RespondInvitationSchema = z.object({
  status: z.enum(['attending', 'maybe', 'declined']),
});

// ── AI Schemas ────────────────────────────────────────────────────────────────

export const ParseEventTextSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters').max(2000),
});

export const SuggestTimesSchema = z.object({
  title: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(1440),
  dateRangeStart: z.string().datetime(),
  dateRangeEnd: z.string().datetime(),
  timezone: z.string().optional(),
});

// ── Param Schemas ─────────────────────────────────────────────────────────────

export const MongoIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format'),
});
