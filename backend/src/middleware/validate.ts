import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * validate – Zod schema validation middleware factory.
 *
 * Validates the specified part of the request against the given schema.
 * Replaces the original value with the parsed (and coerced) output.
 *
 * Usage:
 *   router.post('/', validate(CreateEventSchema), createEventHandler)
 *   router.get('/',  validate(ListEventsQuerySchema, 'query'), listEventsHandler)
 */
export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = formatZodError(result.error);
      const err = AppError.badRequest(`Validation failed: ${details}`, 'VALIDATION_ERROR');
      return next(err);
    }

    // Replace the raw value with the cleaned/coerced output.
    // NOTE: In Express 5, req.query is a read-only getter – we cannot reassign it;
    // instead we mutate the existing object in-place (clear + repopulate).
    if (target === 'query') {
      const q = req.query as Record<string, unknown>;
      for (const key of Object.keys(q)) delete q[key];
      Object.assign(q, result.data as Record<string, unknown>);
    } else {
      (req as unknown as Record<string, unknown>)[target] = result.data;
    }
    next();
  };
}

function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => `${e.path.join('.') || 'value'}: ${e.message}`)
    .join('; ');
}
