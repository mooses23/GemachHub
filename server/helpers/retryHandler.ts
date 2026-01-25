/**
 * Retry Handler Utility
 * Provides retry mechanisms for external API calls with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Executes an async operation with retry logic and exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt + 1
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt <= maxRetries) {
        const delay = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
          maxDelayMs
        );

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt
  };
}

/**
 * Sleep utility for async operations
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs retry failures to persistent storage for later processing
 */
export async function logRetryFailure(
  operation: string,
  context: Record<string, any>,
  error: Error
): Promise<void> {
  const failureRecord = {
    operation,
    context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    timestamp: new Date().toISOString(),
    retryable: true
  };

  // Log to console for now - in production, this would go to a database or queue
  console.error('RETRY_FAILURE_LOG:', JSON.stringify(failureRecord, null, 2));
  
  // TODO: In production, implement persistent storage:
  // await storage.createRetryLog(failureRecord);
  // or
  // await queueService.addToRetryQueue(failureRecord);
}
