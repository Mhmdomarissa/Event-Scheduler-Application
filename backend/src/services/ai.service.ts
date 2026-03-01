import OpenAI from 'openai';
import { z } from 'zod';
import { AppError } from '../utils/AppError';
import { EventRepository } from '../repositories/event.repository';
import { intervalsOverlap, toDate } from '../utils/date';
import { logger } from '../utils/logger';

// ── Zod schemas for AI output validation ────────────────────────────────────

const ParsedEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  missingFields: z.array(z.string()).optional(),
});

export type ParsedEvent = z.infer<typeof ParsedEventSchema>;

export interface TimeSuggestion {
  startAt: string;
  endAt: string;
  explanation?: string;
}

// ── Helper ───────────────────────────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw AppError.serviceUnavailable(
      'AI features are not available: OPENAI_API_KEY is not configured.',
      'AI_UNAVAILABLE',
    );
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const eventRepo = new EventRepository();

// ── AI Service ────────────────────────────────────────────────────────────────

export class AiService {
  /**
   * A) Natural Language Event Creation
   *
   * Parses a free-text description and extracts structured event fields.
   * Does NOT write to the database – it only helps the user fill in a form.
   */
  async parseEventFromText(text: string): Promise<ParsedEvent> {
    const openai = getOpenAI();

    const systemPrompt = `You are an assistant that extracts event information from natural language input.
Return ONLY a valid JSON object with these fields (omit fields you cannot confidently extract):
{
  "title": string (required, min 2 chars),
  "description": string (optional),
  "location": string (optional),
  "startAt": ISO-8601 datetime string (optional),
  "endAt": ISO-8601 datetime string (optional),
  "confidence": number between 0 and 1 (how confident you are overall),
  "missingFields": array of field names you could not determine
}
Today's date and time is: ${new Date().toISOString()}.
Do not include any explanation outside of the JSON object.`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content ?? '{}';
      let parsed: unknown;

      try {
        parsed = JSON.parse(rawContent);
      } catch {
        throw AppError.serviceUnavailable('AI returned malformed JSON', 'AI_PARSE_ERROR');
      }

      // Validate with Zod before returning to the client
      const validated = ParsedEventSchema.safeParse(parsed);
      if (!validated.success) {
        logger.warn('AI output failed Zod validation', { errors: validated.error.errors, rawContent });
        throw AppError.serviceUnavailable('AI response did not match expected schema', 'AI_SCHEMA_ERROR');
      }

      return validated.data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('OpenAI API error', { error: err });
      throw AppError.serviceUnavailable('AI service request failed. Please try again later.', 'AI_API_ERROR');
    }
  }

  /**
   * B) Smart Scheduling Assistant
   *
   * Finds available time slots within a date range for a user, considering
   * their existing events. Returns top 3 suggestions.
   * Optionally enhanced with an AI-generated explanation.
   */
  async suggestTimes(
    userId: string,
    durationMinutes: number,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    timezone?: string,
    title?: string,
  ): Promise<TimeSuggestion[]> {
    if (durationMinutes <= 0) {
      throw AppError.badRequest('durationMinutes must be positive');
    }

    const rangeMs = dateRangeEnd.getTime() - dateRangeStart.getTime();
    if (rangeMs <= 0) {
      throw AppError.badRequest('dateRangeEnd must be after dateRangeStart');
    }

    // Fetch user's existing events in the range
    const existingEvents = await eventRepo.findInRange(userId, dateRangeStart, dateRangeEnd);

    // Build busy intervals
    const busyIntervals = existingEvents.map((e) => ({
      start: toDate(e.startAt),
      end: toDate(e.endAt),
    }));

    // Find free slots within business hours (08:00–20:00 UTC) in 30-min increments
    const suggestions: TimeSuggestion[] = [];
    const slotDurationMs = durationMinutes * 60_000;
    const stepMs = 30 * 60_000; // scan in 30-min steps

    let cursor = new Date(dateRangeStart);

    while (cursor.getTime() + slotDurationMs <= dateRangeEnd.getTime() && suggestions.length < 3) {
      const slotEnd = new Date(cursor.getTime() + slotDurationMs);

      // Restrict to business hours (08:00 – 20:00 UTC)
      const hourUTC = cursor.getUTCHours();
      const slotEndHourUTC = slotEnd.getUTCHours();

      const withinBusinessHours = hourUTC >= 8 && slotEndHourUTC <= 20;

      if (withinBusinessHours) {
        const hasConflict = busyIntervals.some((busy) =>
          intervalsOverlap(cursor, slotEnd, busy.start, busy.end),
        );

        if (!hasConflict) {
          suggestions.push({
            startAt: cursor.toISOString(),
            endAt: slotEnd.toISOString(),
          });
        }
      }

      cursor = new Date(cursor.getTime() + stepMs);
    }

    if (suggestions.length === 0) {
      throw AppError.conflict(
        'No available time slots found in the given date range with the requested duration.',
        'NO_SLOTS_AVAILABLE',
      );
    }

    // Optionally enrich with AI explanation if OpenAI key exists
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && suggestions.length > 0) {
      try {
        const explanations = await this.generateSlotExplanations(suggestions, title, timezone);
        suggestions.forEach((s, i) => {
          s.explanation = explanations[i] ?? undefined;
        });
      } catch {
        // AI enrichment is optional – don't fail the request
        logger.warn('Failed to enrich suggestions with AI explanation');
      }
    }

    return suggestions;
  }

  private async generateSlotExplanations(
    slots: TimeSuggestion[],
    title?: string,
    timezone?: string,
  ): Promise<string[]> {
    const openai = getOpenAI();
    const slotDescriptions = slots
      .map((s, i) => `Slot ${i + 1}: ${s.startAt} – ${s.endAt}`)
      .join('\n');

    const prompt = `You are helping schedule an event titled "${title ?? 'an event'}".
The following free time slots were found${timezone ? ` (timezone hint: ${timezone})` : ''}:
${slotDescriptions}

For each slot, write a concise 1-sentence reason why it might be a good choice.
Return only a JSON array of strings, one per slot.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.5,
    });

    const raw = response.choices[0]?.message?.content ?? '{"explanations":[]}';
    const parsed = JSON.parse(raw) as { explanations?: string[] };
    return parsed.explanations ?? [];
  }
}
