/**
 * DESIGN DECISION – Separate Invitation Collection vs. Embedding in Event
 * ─────────────────────────────────────────────────────────────────────────
 * We keep Invitations in their own collection (not embedded in Event) because:
 *
 * 1. Independent queryability: The endpoint `GET /api/invitations` must efficiently
 *    retrieve ALL invitations for the calling user across MANY events.  If invitations
 *    were embedded in each Event document, this query would require a full collection
 *    scan and `$unwind`, which is O(n × invites) in the worst case.
 *
 * 2. Unbounded growth: Popular events may have thousands of invitees.  MongoDB
 *    recommends avoiding documents that grow without bound. A 16 MB document limit
 *    exists; embedding every RSVP inside the event breaks that boundary at scale.
 *
 * 3. Per-document writes: When an invitee updates their RSVP status, we only touch
 *    the single Invitation document – not the entire Event document (no contention).
 *
 * 4. Unique-invite enforcement: A compound unique index on (eventId + email) is
 *    trivial on a dedicated collection and impossible to enforce on embedded arrays
 *    without application-level checks.
 *
 * Trade-off: An extra DB round-trip is needed when populating attendee lists, but
 * this is acceptable and cached at the service layer when necessary.
 */

import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type RsvpStatus = 'invited' | 'attending' | 'maybe' | 'declined';

export interface IInvitation {
  eventId: Types.ObjectId;
  /**
   * Email used for the invitation.  Always stored (even before the invitee
   * creates an account) so the invite can be linked on first login.
   */
  email: string;
  /**
   * Populated once the invitee logs in and we match by email.
   * Null/undefined if the invitee hasn't created an account yet.
   */
  inviteeUserId?: Types.ObjectId;
  /**
   * The user who sent the invite (event creator or admin).
   */
  invitedBy: Types.ObjectId;
  status: RsvpStatus;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInvitationDocument extends IInvitation, Document {}

const InvitationSchema = new Schema<IInvitationDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    inviteeUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true, // sparse because it may be null until the user signs up
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['invited', 'attending', 'maybe', 'declined'] satisfies RsvpStatus[],
      default: 'invited',
      index: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (ret as Record<string, unknown>)['__v'];
        return ret;
      },
    },
  },
);

/**
 * Compound unique index – prevents duplicate invitations for the same email+event.
 * This is the primary safeguard; service-layer checks add a friendlier 409 message.
 */
InvitationSchema.index({ eventId: 1, email: 1 }, { unique: true });

export const InvitationModel: Model<IInvitationDocument> = mongoose.model<IInvitationDocument>(
  'Invitation',
  InvitationSchema,
);
