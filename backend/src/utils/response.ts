import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

/**
 * Send a successful JSON response with standard envelope.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  const body: ApiResponse<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

/**
 * Send a creation response (201).
 */
export function sendCreated<T>(res: Response, data: T, message = 'Created'): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send a no-content response (204).
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
