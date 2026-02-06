import { AxiosError } from "axios";
import { logger } from "./logger";

interface RetryOptions {
  /** Max number of attempts (including the initial one). Default: 3 */
  maxAttempts?: number;
  /** Initial delay in ms before the first retry. Default: 1000 */
  initialDelay?: number;
  /** Backoff strategy. Default: "exponential" */
  backoff?: "exponential" | "linear" | "none";
  /** Optional AbortSignal to cancel during retry waits */
  signal?: AbortSignal;
  /** Optional predicate — return false to stop retrying early */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Default shouldRetry: only retry on network errors and 5xx.
 * Never retry 4xx (client errors) except 429 (rate limit).
 */
function defaultShouldRetry(error: unknown): boolean {
  // Network errors (no response at all)
  if (error instanceof Error && error.message === "Network Error") {
    return true;
  }

  // Axios errors with a response
  if ((error as AxiosError)?.isAxiosError) {
    const status = (error as AxiosError).response?.status;
    if (!status) return true; // No response = network issue
    if (status === 429) return true; // Rate limited
    if (status >= 500) return true; // Server error
    return false; // 4xx = don't retry
  }

  // AbortError = don't retry
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  // Unknown errors — retry once
  return true;
}

function getDelay(
  attempt: number,
  initialDelay: number,
  backoff: "exponential" | "linear" | "none"
): number {
  switch (backoff) {
    case "exponential":
      return initialDelay * Math.pow(2, attempt);
    case "linear":
      return initialDelay * (attempt + 1);
    case "none":
      return initialDelay;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

/**
 * Retry a function with exponential backoff.
 *
 * Usage:
 *   const data = await withRetry(() => api.get('/endpoint'), { maxAttempts: 3 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoff = "exponential",
    signal,
    shouldRetry = defaultShouldRetry,
  } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check for abort before each attempt
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt >= maxAttempts - 1) break;

      // Check custom + default retry predicate
      if (!shouldRetry(error, attempt)) break;

      const delay = getDelay(attempt, initialDelay, backoff);
      logger.debug(
        `[retry] Attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${delay}ms`
      );

      await sleep(delay, signal);
    }
  }

  throw lastError;
}

export default withRetry;
