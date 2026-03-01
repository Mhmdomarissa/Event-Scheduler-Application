import { EventRepository, CreateEventPayload, UpdateEventPayload, EventFilters } from '../repositories/event.repository';
import { InvitationRepository } from '../repositories/invitation.repository';
import { AppError } from '../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { logger } from '../utils/logger';
import { Request } from 'express';

const eventRepo = new EventRepository();
const invitationRepo = new InvitationRepository();

export class EventService {
  /**
   * Create an event, with optional conflict detection.
   */
  async createEvent(
    payload: CreateEventPayload & { ignoreConflicts?: boolean },
    userId: string,
  ) {
    // Validate date ordering
    if (payload.startAt >= payload.endAt) {
      throw AppError.badRequest('startAt must be before endAt', 'INVALID_DATE_RANGE');
    }

    // Conflict detection unless explicitly bypassed
    if (!payload.ignoreConflicts) {
      const conflicts = await eventRepo.findConflicts(userId, payload.startAt, payload.endAt);
      if (conflicts.length > 0) {
        throw AppError.conflict(
          `Event conflicts with ${conflicts.length} existing event(s): ${conflicts
            .map((c) => `"${c.title}" (${c.startAt.toISOString()} – ${c.endAt.toISOString()})`)
            .join(', ')}. Pass ignoreConflicts=true to bypass.`,
          'EVENT_CONFLICT',
        );
      }
    }

    const event = await eventRepo.create({ ...payload, createdBy: userId });
    logger.info('Event created', { eventId: event._id, userId });
    return event;
  }

  /**
   * List events visible to the calling user:
   *   - Events created by the user, OR
   *   - Events the user is invited to (if visibility allows)
   */
  async listEvents(query: Request['query'], userId: string) {
    const pagination = parsePagination(query);

    // Gather invited event IDs for the OR query
    const invitedEventIds = await invitationRepo.findEventIdsByUser(userId);

    const filters: EventFilters = {
      createdBy: userId,
      invitedEventIds,
      search: query['search'] as string | undefined,
      location: query['location'] as string | undefined,
      status: query['status'] as EventFilters['status'],
    };

    if (query['startFrom']) filters.startFrom = new Date(query['startFrom'] as string);
    if (query['startTo']) filters.startTo = new Date(query['startTo'] as string);

    const { events, total } = await eventRepo.findMany(filters, pagination);
    const meta = buildPaginationMeta(total, pagination);

    return { events, meta };
  }

  /**
   * Get a single event. Enforces access control: user must be creator or invitee.
   */
  async getEvent(eventId: string, userId: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw AppError.notFound('Event not found');

    const isCreator = event.createdBy.toString() === userId;
    if (!isCreator) {
      const eventIds = await invitationRepo.findEventIdsByUser(userId);
      if (!eventIds.includes(eventId)) {
        throw AppError.forbidden('You do not have access to this event');
      }
    }

    return event;
  }

  /**
   * Update an event. Only the creator or an admin may update.
   */
  async updateEvent(
    eventId: string,
    payload: UpdateEventPayload & { ignoreConflicts?: boolean },
    userId: string,
    userRole: string,
  ) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw AppError.notFound('Event not found');

    const isCreator = event.createdBy.toString() === userId;
    if (!isCreator && userRole !== 'admin') {
      throw AppError.forbidden('Only the event creator or an admin can update this event');
    }

    const newStart = payload.startAt ?? event.startAt;
    const newEnd = payload.endAt ?? event.endAt;

    if (newStart >= newEnd) {
      throw AppError.badRequest('startAt must be before endAt', 'INVALID_DATE_RANGE');
    }

    // Conflict detection
    const ignoreConflicts = payload.ignoreConflicts ?? false;
    if (!ignoreConflicts && (payload.startAt ?? payload.endAt)) {
      const conflicts = await eventRepo.findConflicts(
        event.createdBy.toString(),
        newStart,
        newEnd,
        eventId,
      );
      if (conflicts.length > 0) {
        throw AppError.conflict(
          `Update creates conflict with: ${conflicts.map((c) => `"${c.title}"`).join(', ')}`,
          'EVENT_CONFLICT',
        );
      }
    }

    const { ignoreConflicts: _ic, ...updatePayload } = payload;
    const updated = await eventRepo.update(eventId, updatePayload);
    logger.info('Event updated', { eventId, userId });
    return updated;
  }

  /**
   * Soft-delete an event. Only creator or admin may delete.
   */
  async deleteEvent(eventId: string, userId: string, userRole: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw AppError.notFound('Event not found');

    const isCreator = event.createdBy.toString() === userId;
    if (!isCreator && userRole !== 'admin') {
      throw AppError.forbidden('Only the event creator or an admin can delete this event');
    }

    await eventRepo.softDelete(eventId);
    logger.info('Event soft-deleted', { eventId, userId });
  }
}
