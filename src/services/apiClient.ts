export function apiUrl(path: string): string {
  const baseUrl = import.meta.env?.VITE_API_BASE_URL?.trim();
  if (baseUrl) {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const apiBaseUrl = normalizedBaseUrl.endsWith('/api')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api`;
    return `${apiBaseUrl}/${path.replace(/^\//, '')}`;
  }
  return `/api/${path.replace(/^\//, '')}`;
}

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}