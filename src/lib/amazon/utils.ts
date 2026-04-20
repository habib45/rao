export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export interface BackoffOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOn?: (error: Error) => boolean;
  delayFn?: (ms: number) => Promise<void>;
}

const defaultDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  options?: BackoffOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 5;
  const baseDelay = options?.baseDelay ?? 2000;
  const maxDelay = options?.maxDelay ?? 32000;
  const retryOn = options?.retryOn ?? (() => true);
  const delayFn = options?.delayFn ?? defaultDelay;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      if (attempt === maxRetries || !retryOn(lastError)) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await delayFn(delay);
    }
  }

  throw lastError;
}

export class RateLimiter {
  private minInterval: number;
  private delayFn: (ms: number) => Promise<void>;
  lastCallTime: number = 0;

  constructor(
    minInterval: number,
    delayFn?: (ms: number) => Promise<void>,
  ) {
    this.minInterval = minInterval;
    this.delayFn = delayFn ?? defaultDelay;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;

    if (this.lastCallTime > 0 && elapsed < this.minInterval) {
      await this.delayFn(this.minInterval - elapsed);
    }

    this.lastCallTime = Date.now();
  }
}

export function validateBearerToken(
  authHeader: string | null,
  expectedSecret: string,
): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return authHeader.slice(7) === expectedSecret;
}
