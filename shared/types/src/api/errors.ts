// API Error types and codes

export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 'AUTH_001',
  INVALID_CREDENTIALS = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  TOKEN_INVALID = 'AUTH_004',
  SESSION_EXPIRED = 'AUTH_005',
  ACCOUNT_LOCKED = 'AUTH_006',

  // Validation errors (2xxx)
  VALIDATION_ERROR = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_REQUIRED_FIELD = 'VAL_003',
  INVALID_FORMAT = 'VAL_004',

  // Resource errors (3xxx)
  NOT_FOUND = 'RES_001',
  ALREADY_EXISTS = 'RES_002',
  FORBIDDEN = 'RES_003',
  CONFLICT = 'RES_004',

  // Database errors (4xxx)
  DATABASE_ERROR = 'DB_001',
  QUERY_FAILED = 'DB_002',
  CONNECTION_FAILED = 'DB_003',

  // Storage errors (5xxx)
  UPLOAD_FAILED = 'STOR_001',
  FILE_TOO_LARGE = 'STOR_002',
  INVALID_FILE_TYPE = 'STOR_003',
  STORAGE_QUOTA_EXCEEDED = 'STOR_004',

  // External service errors (6xxx)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  AI_SERVICE_ERROR = 'EXT_002',
  EMAIL_SERVICE_ERROR = 'EXT_003',

  // Server errors (9xxx)
  INTERNAL_SERVER_ERROR = 'SRV_001',
  SERVICE_UNAVAILABLE = 'SRV_002',
  RATE_LIMIT_EXCEEDED = 'SRV_003',
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: unknown;
    stack?: string; // Only in development
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common error factories
export const createNotFoundError = (resource: string, id?: string): AppError =>
  new AppError(ErrorCode.NOT_FOUND, `${resource}${id ? ` with id ${id}` : ''} not found`, 404);

export const createValidationError = (message: string, details?: unknown): AppError =>
  new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);

export const createUnauthorizedError = (message = 'Unauthorized'): AppError =>
  new AppError(ErrorCode.UNAUTHORIZED, message, 401);

export const createForbiddenError = (message = 'Forbidden'): AppError =>
  new AppError(ErrorCode.FORBIDDEN, message, 403);

export const createConflictError = (message: string): AppError =>
  new AppError(ErrorCode.CONFLICT, message, 409);
