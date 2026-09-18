import {
  LanguagePackInput,
  LanguagePackValidationResult,
  LanguageResource,
  LanguageResourceItem,
  TribalLanguage,
  VerificationStatus
} from '../types';
import { normalizePhrase } from './dictionary';

const PLACEHOLDER_TEXT = /^(sample|test|placeholder|lorem|todo|tbd|n\/a|translation unavailable|coming soon)$/i;
const RESOURCE_ID = /^[a-z0-9]+-[a-z0-9][a-z0-9-]*$/;

function hasMeaningfulText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !PLACEHOLDER_TEXT.test(value.trim());
}

function hasValidAudio(item: Pick<LanguageResourceItem, 'audio' | 'audioUrl'>): boolean {
  if (item.audioUrl) return false;
  if (!item.audio) return true;
  if (!item.audio.verified || !hasMeaningfulText(item.audio.url)) return false;
  if (/placeholder|fake|example\.com|sample|todo/i.test(item.audio.url)) return false;
  try {
    const parsed = new URL(item.audio.url, 'https://neuropathshala.local');
    return (parsed.protocol === 'https:' && !parsed.hostname.endsWith('.invalid') && parsed.hostname !== 'localhost') || parsed.pathname.startsWith('/assets/');
  } catch {
    return false;
  }
}

function validateEntry(pack: LanguagePackInput, item: Omit<LanguageResourceItem, 'language'>, ids: Set<string>, mappings: Map<string, string>, errors: string[]): LanguageResourceItem | undefined {
  if (!hasMeaningfulText(item.id) || !RESOURCE_ID.test(item.id)) errors.push(`Invalid resource ID: ${item.id || '(missing)'}`);
  if (ids.has(item.id)) errors.push(`Duplicate resource ID: ${item.id}`);
  ids.add(item.id);
  if (!hasMeaningfulText(item.hindi)) errors.push(`Missing Hindi text for ${item.id}`);
  if (!hasMeaningfulText(item.translation) || !hasMeaningfulText(item.tribalText || item.translation)) errors.push(`Missing tribal text for ${item.id}`);
  if (!hasMeaningfulText(item.category) || !pack.categories.includes(item.category)) errors.push(`Invalid category for ${item.id}`);
  if (!(['verified', 'ai_assisted', 'demo', 'unavailable'] as VerificationStatus[]).includes(item.verificationStatus)) errors.push(`Invalid verification status for ${item.id}`);
  if (item.verificationStatus === 'verified') {
    if (!hasMeaningfulText(item.source?.name) || !hasMeaningfulText(item.source?.reference)) errors.push(`Verified resource missing source reference: ${item.id}`);
    if (pack.scripts.length > 0 && !hasMeaningfulText(item.script)) errors.push(`Unsupported or missing script representation: ${item.id}`);
  }
  if (!hasValidAudio(item)) errors.push(`Invalid or unverified audio metadata: ${item.id}`);

  const hindiKey = normalizePhrase(item.hindi);
  const tribalText = item.tribalText || item.translation;
  const previous = mappings.get(hindiKey);
  if (previous && previous !== normalizePhrase(tribalText)) errors.push(`Inconsistent Hindi mapping: ${item.id}`);
  mappings.set(hindiKey, normalizePhrase(tribalText));

  return { ...item, language: pack.language, tribalText };
}

export function validateLanguagePack(pack: LanguagePackInput): LanguagePackValidationResult {
  const errors: string[] = [];
  if (!pack || !pack.language || !pack.nativeName || !Array.isArray(pack.scripts) || !Array.isArray(pack.entries)) {
    return { valid: false, errors: ['Missing language-pack metadata.'] };
  }
  if (!hasMeaningfulText(pack.source?.name) || !hasMeaningfulText(pack.source?.reference)) errors.push('Language pack source name and reference are required.');
  if (pack.offlineAvailable && pack.entries.some((entry) => entry.verificationStatus !== 'verified')) errors.push('Offline packs may contain only verified entries.');

  const ids = new Set<string>();
  const mappings = new Map<string, string>();
  const entries = pack.entries.map((entry) => validateEntry(pack, entry, ids, mappings, errors)).filter((entry): entry is LanguageResourceItem => Boolean(entry));
  const verifiedEntries = entries.filter((entry) => entry.verificationStatus === 'verified');
  const resource: LanguageResource = {
    language: pack.language,
    nativeName: pack.nativeName,
    scripts: [...pack.scripts],
    words: entries,
    classroomPhrases: entries,
    pronunciation: entries.filter((entry) => Boolean(entry.pronunciation)),
    categories: [...pack.categories],
    source: pack.source,
    verificationStatus: verifiedEntries.length > 0 ? 'verified' : 'unavailable',
    offlineAvailable: pack.offlineAvailable
  };
  return errors.length > 0 ? { valid: false, errors } : { valid: true, errors: [], resource };
}

export function importLanguagePack(pack: LanguagePackInput): LanguageResource {
  const result = validateLanguagePack(pack);
  if (!result.valid || !result.resource) throw new Error(`Language pack rejected: ${result.errors.join('; ')}`);
  return result.resource;
}

export const BUNDLED_SCRIPT_METADATA: Record<TribalLanguage, string[]> = {
  Santhali: ['Ol Chiki'],
  Ho: [],
  Mundari: []
};