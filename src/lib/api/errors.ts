export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'guard_failed'
  | 'rate_limited'
  | 'unavailable';

/** A failure from the SkyHaven API. `message` is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status = 400,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
