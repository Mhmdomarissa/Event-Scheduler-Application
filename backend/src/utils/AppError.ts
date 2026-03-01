/**
 * AppError – structured error class for all application-level errors.
 * Every thrown AppError is caught by the central error handler and returned
 * as a consistent JSON envelope.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number, code?: string, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Convenience factories ────────────────────────────────────────────────

  static badRequest(message = 'Bad Request', code?: string): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'Unauthorized', code?: string): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code?: string): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Not Found', code?: string): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message = 'Conflict', code?: string): AppError {
    return new AppError(message, 409, code);
  }

  static tooManyRequests(message = 'Too Many Requests', code?: string): AppError {
    return new AppError(message, 429, code);
  }

  static serviceUnavailable(message = 'Service Unavailable', code?: string): AppError {
    return new AppError(message, 503, code);
  }

  static internal(message = 'Internal Server Error', code?: string): AppError {
    return new AppError(message, 500, code, false);
  }
}
