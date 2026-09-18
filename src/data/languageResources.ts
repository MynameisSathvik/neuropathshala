import {
  LanguageResource,
  LanguageResourceItem,
  LanguageResourceSource,
  TribalLanguage,
  VerificationStatus
} from '../types';
import { DictionaryEntry, SANTHALI_DICTIONARY } from './dictionary';
import { importLanguagePack } from './languagePack';
import { HO_OFFLINE_CORE, MUNDARI_OFFLINE_CORE } from './offlineLanguageCores';

const existingSanthaliSource = {
  name: 'Existing PALASH MTB-MLE classroom vocabulary metadata',
  reference: 'src/data/dictionary.ts',
  reviewed: true
};

const unavailableSource = {
  name: 'No bundled linguistic resource',
  reviewed: false
};

function toResourceItem(entry: DictionaryEntry, index: number): LanguageResourceItem {
  const activity = entry.hindi.includes('किताब')
    ? { label: 'Open Book', icon: '📖' }
    : entry.hindi.includes('लिख')
      ? { label: 'Write', icon: '✏️' }
      : entry.hindi.includes('सुन')
        ? { label: 'Listen', icon: '👂' }
        : entry.hindi.includes('दोहर')
          ? { label: 'Repeat', icon: '🔁' }
          : undefined;

  return {
    id: `santhali-${index + 1}`,
    language: 'Santhali',
    hindi: entry.hindi,
    translation: entry.santhali,
    tribalText: entry.santhali,
    english: entry.english,
    script: entry.olChiki,
    pronunciation: entry.phonetic,
    category: entry.category,
    verificationStatus: entry.isVerified ? 'verified' : 'demo',
    source: existingSanthaliSource,
    activity
  };
}

const santhaliItems = SANTHALI_DICTIONARY.map(toResourceItem);

const santhaliResource = importLanguagePack({
  language: 'Santhali',
  nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
  scripts: ['Ol Chiki'],
  categories: [...new Set(santhaliItems.map((item) => item.category))],
  source: existingSanthaliSource,
  offlineAvailable: true,
  entries: santhaliItems.map(({ language: _language, ...item }) => item)
});

function emptyResource(language: TribalLanguage, nativeName: string, categories: string[]): LanguageResource {
  return {
    language,
    nativeName,
    scripts: [],
    words: [],
    classroomPhrases: [],
    pronunciation: [],
    categories,
    source: unavailableSource,
    verificationStatus: 'unavailable',
    offlineAvailable: false
  };
}

function toOfflineResourceItem(
  language: TribalLanguage,
  entry: { hindi: string; target: string; english: string; category: string; sourcePage: string },
  index: number,
  source: LanguageResourceSource
): LanguageResourceItem {
  return {
    id: `${language.toLowerCase()}-${index + 1}`,
    language,
    hindi: entry.hindi,
    translation: entry.target,
    tribalText: entry.target,
    english: entry.english,
    category: entry.category,
    verificationStatus: 'verified',
    source: { ...source, reference: `${source.reference} (page ${entry.sourcePage})` }
  };
}

const hoSource = {
  name: 'Ho-Hindi Dictionary, supplied scanned reference',
  reference: '659748601-ho-hindi-dictionary.pdf',
  reviewed: true
};

const hoItems = HO_OFFLINE_CORE.vocabulary.map((entry, index) =>
  toOfflineResourceItem('Ho', entry, index, hoSource)
);

const hoResource = importLanguagePack({
  language: 'Ho',
  nativeName: 'Ho',
  scripts: [],
  categories: [...new Set(hoItems.map((item) => item.category))],
  source: hoSource,
  offlineAvailable: true,
  entries: hoItems.map(({ language: _language, ...item }) => item)
});

const mundariResource: LanguageResource = {
  ...emptyResource('Mundari', 'Mundari', ['Grammar reference']),
  source: {
    name: 'Mundari Grammar, supplied scanned reference',
    reference: '870504344-Narendra-Kumar-Sinha-Mundari-Grammar-B-ok-org.pdf',
    reviewed: true
  },
  offlineAvailable: MUNDARI_OFFLINE_CORE.grammarRules.length > 0
};

export const LANGUAGE_RESOURCES: Record<TribalLanguage, LanguageResource> = {
  Santhali: {
    ...santhaliResource
  },
  Ho: hoResource,
  Mundari: mundariResource
};

export function getLanguageResource(language: TribalLanguage): LanguageResource {
  return LANGUAGE_RESOURCES[language];
}

export function resourceStatusLabel(status: VerificationStatus): string {
  if (status === 'verified') return 'Verified classroom phrase';
  if (status === 'ai_assisted') return 'AI-assisted';
  if (status === 'demo') return 'Demo/sample';
  return 'Translation unavailable';
}

export function searchLanguageResources(query: string, language?: TribalLanguage): LanguageResourceItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];

  const resources = language ? [LANGUAGE_RESOURCES[language]] : Object.values(LANGUAGE_RESOURCES);
  return resources.flatMap((resource) => resource.classroomPhrases).filter((item) =>
    [item.id, item.hindi, item.translation, item.tribalText, item.english, item.category]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(normalized))
  );
}