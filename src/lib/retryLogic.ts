/**
 * Retry logic with exponential backoff for Supabase operations
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 3000,
  backoffMultiplier: 2,
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxAttempts) {
        break;
      }

      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors, timeouts, rate limits are retryable
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('429') || // Too many requests
      message.includes('503') || // Service unavailable
      message.includes('econnrefused') ||
      message.includes('econnreset')
    );
  }
  return false;
};

export const retryAsyncWithFallback = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  options: RetryOptions = {}
): Promise<T> => {
  try {
    return await retryAsync(fn, options);
  } catch (error) {
    console.error('Retry exhausted, using fallback', error);
    return fallback;
  }
};
