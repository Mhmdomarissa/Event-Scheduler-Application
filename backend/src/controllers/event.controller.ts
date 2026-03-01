import { Request, Response } from 'express';
import { EventService } from '../services/event.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../utils/AppError';

const eventService = new EventService();

export class EventController {
  /**
   * POST /api/events
   */
  async createEvent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { ignoreConflicts, startAt, endAt, ...rest } = req.body as {
      title: string;
      description?: string;
      location?: string;
      startAt: string;
      endAt: string;
      visibility?: 'private' | 'shared';
      ignoreConflicts?: boolean;
    };

    const event = await eventService.createEvent(
      {
        ...rest,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        createdBy: req.user.id,
        ignoreConflicts,
      },
      req.user.id,
    );

    sendCreated(res, event, 'Event created successfully');
  }

  /**
   * GET /api/events
   */
  async listEvents(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { events, meta } = await eventService.listEvents(req.query, req.user.id);
    sendSuccess(res, events, 'Events retrieved', 200, meta);
  }

  /**
   * GET /api/events/:id
   */
  async getEvent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const event = await eventService.getEvent(req.params['id'] as string, req.user.id);
    sendSuccess(res, event, 'Event retrieved');
  }

  /**
   * PATCH /api/events/:id
   */
  async updateEvent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const body = req.body as {
      title?: string;
      description?: string;
      location?: string;
      startAt?: string;
      endAt?: string;
      visibility?: 'private' | 'shared';
      ignoreConflicts?: boolean;
    };

    const payload = {
      ...body,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
    };

    const updated = await eventService.updateEvent(
      req.params['id'] as string,
      payload,
      req.user.id,
      req.user.role,
    );

    sendSuccess(res, updated, 'Event updated');
  }

  /**
   * DELETE /api/events/:id
   */
  async deleteEvent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    await eventService.deleteEvent(req.params['id'] as string, req.user.id, req.user.role);
    sendNoContent(res);
  }
}
