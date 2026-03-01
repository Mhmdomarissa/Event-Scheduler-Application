import { FilterQuery, Types } from 'mongoose';
import { EventModel, IEventDocument } from '../models/Event';
import { PaginationOptions } from '../utils/pagination';

export interface EventFilters {
  createdBy?: string;
  /** Text search across title, description, location */
  search?: string;
  /** Filter events that overlap with this date range */
  startFrom?: Date;
  startTo?: Date;
  location?: string;
  /** 'upcoming' | 'ongoing' | 'past' – computed at query time via date comparison */
  status?: 'upcoming' | 'ongoing' | 'past';
  /** IDs of events the user is invited to (OR with createdBy) */
  invitedEventIds?: string[];
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  createdBy: string;
  visibility?: 'private' | 'shared';
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  location?: string;
  startAt?: Date;
  endAt?: Date;
  visibility?: 'private' | 'shared';
}

export class EventRepository {
  async create(payload: CreateEventPayload): Promise<IEventDocument> {
    const event = new EventModel(payload);
    return event.save();
  }

  async findById(id: string): Promise<IEventDocument | null> {
    return EventModel.findOne({ _id: id, isDeleted: false });
  }

  async findByIdIncludingDeleted(id: string): Promise<IEventDocument | null> {
    return EventModel.findById(id);
  }

  async findMany(
    filters: EventFilters,
    pagination: PaginationOptions,
  ): Promise<{ events: IEventDocument[]; total: number }> {
    const query = this.buildQuery(filters);

    const [events, total] = await Promise.all([
      EventModel.find(query)
        .sort({ startAt: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('createdBy', 'displayName email'),
      EventModel.countDocuments(query),
    ]);

    return { events, total };
  }

  async update(id: string, payload: UpdateEventPayload): Promise<IEventDocument | null> {
    // Strip undefined values so Mongoose never tries to $set a field to undefined.
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ) as UpdateEventPayload;
    return EventModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: cleanPayload },
      { new: true, runValidators: true },
    );
  }

  async softDelete(id: string): Promise<IEventDocument | null> {
    return EventModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true },
    );
  }

  /**
   * Find events owned by a user that overlap with the given time range.
   * Used for conflict detection.
   */
  async findConflicts(
    createdBy: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<IEventDocument[]> {
    const query: FilterQuery<IEventDocument> = {
      createdBy: new Types.ObjectId(createdBy),
      isDeleted: false,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    return EventModel.find(query).select('title startAt endAt');
  }

  /**
   * Find all events for a user within a date range (for free-slot computation).
   */
  async findInRange(userId: string, from: Date, to: Date): Promise<IEventDocument[]> {
    return EventModel.find({
      createdBy: new Types.ObjectId(userId),
      isDeleted: false,
      startAt: { $lt: to },
      endAt: { $gt: from },
    }).sort({ startAt: 1 });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildQuery(filters: EventFilters): FilterQuery<IEventDocument> {
    const query: FilterQuery<IEventDocument> = { isDeleted: false };

    // Ownership or invitation (OR)
    const orConditions: FilterQuery<IEventDocument>[] = [];

    if (filters.createdBy) {
      orConditions.push({ createdBy: new Types.ObjectId(filters.createdBy) });
    }

    if (filters.invitedEventIds?.length) {
      orConditions.push({ _id: { $in: filters.invitedEventIds.map((id) => new Types.ObjectId(id)) } });
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // Text search
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Date range filter
    if (filters.startFrom || filters.startTo) {
      query.startAt = {};
      if (filters.startFrom) query.startAt.$gte = filters.startFrom;
      if (filters.startTo) query.startAt.$lte = filters.startTo;
    }

    // Location filter (case-insensitive)
    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    // Lifecycle status filter
    if (filters.status) {
      const now = new Date();
      if (filters.status === 'upcoming') query.startAt = { ...(query.startAt as object), $gt: now };
      if (filters.status === 'past') query.endAt = { $lt: now };
      if (filters.status === 'ongoing') {
        // If startTo was already applied it set a $lte on query.startAt.
        // Both constraints must hold: startAt <= now AND startAt <= startTo.
        // Resolve to the more restrictive (smaller) upper bound.
        const existingLte = (query.startAt as Record<string, Date> | undefined)?.$lte;
        const lteBound = existingLte !== undefined && existingLte < now ? existingLte : now;
        query.startAt = { ...(query.startAt as object), $lte: lteBound };
        query.endAt = { $gte: now };
      }
    }

    return query;
  }
}
