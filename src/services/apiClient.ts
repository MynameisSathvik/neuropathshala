const REQUEST_TIMEOUT_MS = 15_000;
const WARMUP_TIMEOUT_MS = 60_000;

function getBaseUrl(): string {
  const baseUrl = import.meta.env?.VITE_API_BASE_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/$/, "") : "";
}

export function apiUrl(path: string): string {
  const baseUrl = getBaseUrl();

  if (baseUrl) {
    const apiBaseUrl = baseUrl.endsWith("/api")
      ? baseUrl
      : `${baseUrl}/api`;

    return `${apiBaseUrl}/${path.replace(/^\//, "")}`;
  }

  return `/api/${path.replace(/^\//, "")}`;
}

function withTimeout(options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): RequestInit {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    ...options,
    signal: controller.signal,
  };
}

/**
 * Wake the Render backend in the background as soon as the frontend loads.
 *
 * This is deliberately fire-and-forget:
 * - it must never block the UI;
 * - it does not consume Sarvam/Gemini credits;
 * - it gives Render time to wake before the evaluator reaches Translator.
 */
export function warmupApi(): void {
  if (typeof window === "undefined") return;

  const baseUrl = getBaseUrl();
  if (!baseUrl) return;

  const key = "__neuropathshala_api_warmup_started__";
  if (window.sessionStorage.getItem(key) === "1") return;

  window.sessionStorage.setItem(key, "1");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

  fetch(`${apiUrl("health")}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: controller.signal,
    cache: "no-store",
  })
    .catch(() => {
      // Warm-up is best effort. The app remains usable offline/local-first.
    })
    .finally(() => {
      window.clearTimeout(timeout);
    });
}

// Start the backend wake-up immediately when this module is loaded.
// This happens without blocking rendering or translation.
warmupApi();

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), withTimeout(options));
}
