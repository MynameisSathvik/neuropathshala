export function apiUrl(path: string): string {
  const runtimeImportMeta = import.meta as ImportMeta & {
    env?: { VITE_API_BASE_URL?: string };
  };
  const baseUrl = runtimeImportMeta.env?.VITE_API_BASE_URL?.trim();
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  return `/api/${path.replace(/^\//, '')}`;
}

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}