/**
 * Typed application error for consistent error handling across the app.
 * Services throw AppError; callers decide whether to show toast, retry, or navigate.
 */
export class AppError extends Error {
  /** Machine-readable error code (e.g., "AUTH_EXPIRED", "NETWORK_ERROR") */
  readonly code: string;
  /** HTTP status code, if originating from an API call */
  readonly statusCode?: number;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }

  /** True if this is a network connectivity error (no internet, timeout, etc.) */
  get isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR" || this.code === "TIMEOUT";
  }

  /** True if the server returned a 4xx client error */
  get isClientError(): boolean {
    return (
      this.statusCode !== undefined &&
      this.statusCode >= 400 &&
      this.statusCode < 500
    );
  }

  /** True if the server returned a 5xx server error */
  get isServerError(): boolean {
    return (
      this.statusCode !== undefined &&
      this.statusCode >= 500 &&
      this.statusCode < 600
    );
  }
}

export default AppError;
