/**
 * Error tracking abstraction layer
 * Silences console errors in production, logs to console in development
 */

const isDevelopment = import.meta.env.DEV;

export const logError = (context: string, error: unknown): void => {
  if (isDevelopment) {
    console.error(`[${context}]`, error);
  }
  // In production, could send to Sentry, LogRocket, etc.
  // Example: Sentry.captureException(error, { contexts: { context } });
};

export const logWarning = (context: string, message: string): void => {
  if (isDevelopment) {
    console.warn(`[${context}] ${message}`);
  }
};

export const handleAsyncError = async <T>(
  context: string,
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    logError(context, error);
    return fallback;
  }
};

export const handleSyncError = <T>(
  context: string,
  fn: () => T,
  fallback?: T
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    logError(context, error);
    return fallback;
  }
};
