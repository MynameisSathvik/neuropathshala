const RECENT_RESOURCES_KEY = 'neuropathshala_recent_resource_ids';
const MAX_RECENT_RESOURCES = 8;

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_RESOURCES_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function getRecentResourceIds(): string[] {
  return readIds();
}

export function recordRecentResource(resourceId: string): string[] {
  const ids = [resourceId, ...readIds().filter((id) => id !== resourceId)].slice(0, MAX_RECENT_RESOURCES);
  if (typeof window !== 'undefined') localStorage.setItem(RECENT_RESOURCES_KEY, JSON.stringify(ids));
  return ids;
}

export function clearRecentResources(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(RECENT_RESOURCES_KEY);
}

export function getSavedResourceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem('neuropathshala_saved_resource_ids') || '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}