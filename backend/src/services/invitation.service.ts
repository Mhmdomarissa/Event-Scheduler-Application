import { InvitationRepository } from '../repositories/invitation.repository';
import { EventRepository } from '../repositories/event.repository';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { Request } from 'express';
import { RsvpStatus } from '../models/Invitation';
import { logger } from '../utils/logger';

const invitationRepo = new InvitationRepository();
const eventRepo = new EventRepository();
const userRepo = new UserRepository();

export class InvitationService {
  /**
   * Invite one or more emails to an event.
   * Works even if the email doesn't correspond to an existing user yet.
   */
  async inviteToEvent(
    eventId: string,
    emails: string[],
    invitedBy: string,
    userRole: string,
  ) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw AppError.notFound('Event not found');

    const isCreator = event.createdBy.toString() === invitedBy;
    if (!isCreator && userRole !== 'admin') {
      throw AppError.forbidden('Only the event creator or an admin can send invitations');
    }

    const results: Array<{ email: string; status: 'invited' | 'duplicate' | 'error'; invitationId?: string }> = [];

    for (const rawEmail of emails) {
      const email = rawEmail.toLowerCase().trim();

      // Check for duplicate
      const existing = await invitationRepo.findByEventAndEmail(eventId, email);
      if (existing) {
        results.push({ email, status: 'duplicate' });
        continue;
      }

      try {
        // Resolve existing user by email (if any)
        const existingUser = await userRepo.findByEmail(email);

        const invitation = await invitationRepo.create({
          eventId,
          email,
          invitedBy,
          inviteeUserId: existingUser ? (existingUser._id as { toString(): string }).toString() : undefined,
        });

        results.push({ email, status: 'invited', invitationId: (invitation._id as { toString(): string }).toString() });
        logger.info('Invitation sent', { eventId, email, invitationId: invitation._id });
      } catch (err) {
        logger.error('Failed to create invitation', { email, eventId, error: err });
        results.push({ email, status: 'error' });
      }
    }

    return results;
  }

  /**
   * Get all attendees of an event (invitees + RSVP statuses).
   */
  async getAttendees(eventId: string, userId: string, query: Request['query']) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw AppError.notFound('Event not found');

    // Access check: creator or invitee
    const isCreator = event.createdBy.toString() === userId;
    if (!isCreator) {
      const invitedIds = await invitationRepo.findEventIdsByUser(userId);
      if (!invitedIds.includes(eventId)) {
        throw AppError.forbidden('You do not have access to this event');
      }
    }

    const pagination = parsePagination(query);
    const { invitations, total } = await invitationRepo.findByEvent(eventId, pagination);
    const meta = buildPaginationMeta(total, pagination);

    return { invitations, meta };
  }

  /**
   * List all invitations for the calling user.
   */
  async getMyInvitations(userId: string, query: Request['query']) {
    const pagination = parsePagination(query);
    const { invitations, total } = await invitationRepo.findByUserId(userId, pagination);
    const meta = buildPaginationMeta(total, pagination);
    return { invitations, meta };
  }

  /**
   * Respond to an invitation (RSVP).
   */
  async respondToInvitation(invitationId: string, status: RsvpStatus, userId: string) {
    const invitation = await invitationRepo.findById(invitationId);
    if (!invitation) throw AppError.notFound('Invitation not found');

    // Ensure the calling user is the invitee
    if (!invitation.inviteeUserId || invitation.inviteeUserId.toString() !== userId) {
      throw AppError.forbidden('You can only respond to your own invitations');
    }

    // 'invited' is the starting state; users can only set attending/maybe/declined
    const allowedStatuses: RsvpStatus[] = ['attending', 'maybe', 'declined'];
    if (!allowedStatuses.includes(status)) {
      throw AppError.badRequest(`Invalid RSVP status. Must be one of: ${allowedStatuses.join(', ')}`);
    }

    const updated = await invitationRepo.updateStatus(invitationId, status);
    logger.info('RSVP updated', { invitationId, status, userId });
    return updated;
  }
}
