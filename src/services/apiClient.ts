const API_TIMEOUT_MS = 20_000;
const API_RETRY_DELAYS_MS = [800];

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || /network|fetch|timeout|abort/i.test(String(error));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (baseUrl) {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const apiBaseUrl = normalizedBaseUrl.endsWith('/api')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api`;
    return `${apiBaseUrl}/${path.replace(/^\//, '')}`;
  }
  return `/api/${path.replace(/^\//, '')}`;
}

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const delays = [0, ...API_RETRY_DELAYS_MS];

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt] > 0) {
      await sleep(delays[attempt]);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl(path), {
        ...options,
        signal: controller.signal
      });

      if (!isRetryableStatus(response.status) || attempt === delays.length - 1) {
        return response;
      }

      // Do not immediately surface a transient 429/5xx from Render/provider.
      continue;
    } catch (error) {
      if (!isNetworkError(error) || attempt === delays.length - 1) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("API request failed after retry");
}
