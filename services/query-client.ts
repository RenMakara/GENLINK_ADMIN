import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";

/**
 * How queries behave across the whole portal.
 *
 * <p>Separated from the provider so the same configuration can be used in tests without
 * rendering React.
 */

/** Retries once, and only when a retry could plausibly help. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;

  if (error instanceof ApiError) {
    // A 4xx is a settled answer: the role does not allow it, the input was invalid, the
    // record is gone. Repeating the request produces the same reply and delays the error the
    // admin needs to see. 429 is excluded too - retrying a rate limit is what caused it.
    if (error.status >= 400 && error.status < 500) return false;
  }

  // Network blips and 5xx are worth one more attempt.
  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * 30s. Long enough that moving between pages does not refetch everything, short
         * enough that an admin who just banned someone sees it reflected when they navigate.
         */
        staleTime: 30_000,
        retry: shouldRetry,
        /**
         * Off deliberately. An admin has this tool open all day beside other tabs; refetching
         * on every focus would re-fire a dozen dashboard queries each time they tab back,
         * for data that has almost certainly not changed.
         */
        refetchOnWindowFocus: false,
        /** Reconnecting is a real signal that data may have moved on. */
        refetchOnReconnect: true,
      },
      mutations: {
        // Never retry a mutation automatically. A ban, an XP grant or a bulk action that
        // silently ran twice is far worse than one that visibly failed once.
        retry: false,
      },
    },
  });
}
