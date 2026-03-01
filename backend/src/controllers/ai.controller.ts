import { Request, Response } from 'express';
import { AiService } from '../services/ai.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

const aiService = new AiService();

export class AiController {
  /**
   * POST /api/ai/parse-event
   * Parse a natural-language description into structured event fields.
   */
  async parseEvent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { text } = req.body as { text: string };
    const parsed = await aiService.parseEventFromText(text);
    sendSuccess(res, parsed, 'Event parsed from text');
  }

  /**
   * POST /api/ai/suggest-times
   * Find available time slots within a given date range.
   */
  async suggestTimes(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { title, durationMinutes, dateRangeStart, dateRangeEnd, timezone } = req.body as {
      title?: string;
      durationMinutes: number;
      dateRangeStart: string;
      dateRangeEnd: string;
      timezone?: string;
    };

    const suggestions = await aiService.suggestTimes(
      req.user.id,
      durationMinutes,
      new Date(dateRangeStart),
      new Date(dateRangeEnd),
      timezone,
      title,
    );

    sendSuccess(res, suggestions, 'Time suggestions generated');
  }
}
