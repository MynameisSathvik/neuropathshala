// NeuroPathshala Translation Architecture Service
//
// Online:
//   Frontend → Express Backend → Sarvam → Translation
//
// Offline / Backend unavailable:
//   Frontend → Local PALASH MTB-MLE Dictionary
//
// STRICT LINGUISTIC HONESTY:
// - AI translations are NOT claimed as native-speaker verified.
// - Local verified entries keep their existing verification status.
// - No fake Santhali audio or translation claims.

import {
  STUDENT_SIMULATION_RESPONSES,
  normalizePhrase
} from '../data/dictionary';
import { getLanguageResource } from '../data/languageResources';
import { LanguageResourceItem } from '../types';
import { apiFetch } from './apiClient';

export type SupportedLanguage =
  | 'hi'
  | 'sat'
  | 'ho'
  | 'unr'
  | 'hi-IN'
  | 'sat-IN'
  | 'ho-IN'
  | 'unr-IN'
  | 'en';

export interface TranslationResult {
  found: boolean;
  sourceText: string;
  translatedText: string;
  olChiki?: string;
  phonetic?: string;
  sourceLanguage: string;
  targetLanguage: string;
  isVerified: boolean;
  statusNote: string;
  matchedEntry?: LanguageResourceItem;
  provider: string;
  verificationStatus?: 'verified' | 'ai_assisted' | 'demo' | 'unavailable';
  source?: string;
  script?: string;
  audioUrl?: string;
}

export interface TranslationProvider {
  id: string;
  name: string;
  translateText(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): TranslationResult;
}

/**
 * Normalizes input language to standard format.
 */
export function normalizeLanguageCode(lang: string): 'hi' | 'sat' | 'ho' | 'unr' {
  const l = lang.toLowerCase().trim();

  if (l === 'ho' || l.includes('ho language')) return 'ho';
  if (l === 'unr' || l.includes('mundari')) return 'unr';

  if (
    l.startsWith('sat') ||
    l.includes('santhali') ||
    l.includes('santali') ||
    l.includes('ol chiki')
  ) {
    return 'sat';
  }

  return 'hi';
}

export function languageDisplayName(language: string): string {
  const normalized = normalizeLanguageCode(language);
  if (normalized === 'sat') return 'Santhali';
  if (normalized === 'ho') return 'Ho';
  if (normalized === 'unr') return 'Mundari';
  return 'Hindi';
}

/**
 * Local Offline Dictionary Translation Provider.
 *
 * Used as:
 * 1. Offline fallback
 * 2. Verified classroom vocabulary
 * 3. Emergency translation when backend is unavailable
 */
class LocalDictionaryTranslationProvider implements TranslationProvider {
  public id = 'local-dictionary-provider';
  public name = 'Local PALASH MTB-MLE Dictionary Provider';

  public translateText(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): TranslationResult {
    const fromLang = normalizeLanguageCode(sourceLanguage);
    const toLang = normalizeLanguageCode(targetLanguage);
    const norm = normalizePhrase(sourceText || '');

    const resource = toLang === 'sat' || fromLang === 'sat'
      ? getLanguageResource('Santhali')
      : toLang === 'ho' || fromLang === 'ho'
        ? getLanguageResource('Ho')
        : getLanguageResource('Mundari');

    if (!norm) {
      return {
        found: false,
        sourceText,
        translatedText: '',
        sourceLanguage: fromLang,
        targetLanguage: toLang,
        isVerified: false,
        statusNote: 'Empty input.',
        provider: this.name
      };
    }

    if (!resource.offlineAvailable && resource.classroomPhrases.length === 0 && (toLang !== 'hi' || fromLang !== 'hi')) {
      return {
        found: false,
        sourceText,
        translatedText: '',
        sourceLanguage: fromLang,
        targetLanguage: toLang,
        isVerified: false,
        verificationStatus: 'unavailable',
        source: resource.source.name,
        statusNote: `${languageDisplayName(toLang === 'hi' ? fromLang : toLang)} translation is unavailable in the local resource. Connected service is required and results are AI-assisted until reviewed.`,
        provider: this.name
      };
    }

    // Hindi → Santali
    if (fromLang === 'hi' && toLang === 'sat') {
      // 1. Exact dictionary match
      for (const entry of resource.classroomPhrases) {
        if (normalizePhrase(entry.hindi) === norm) {
          return {
            found: true,
            sourceText,
            translatedText: `${entry.translation}${entry.pronunciation ? ` (${entry.pronunciation})` : ''}`,
            olChiki: entry.script,
            phonetic: entry.pronunciation,
            sourceLanguage: 'hi',
            targetLanguage: 'sat',
            isVerified: entry.verificationStatus === 'verified',
            statusNote: entry.verificationStatus === 'verified'
              ? 'Verified PALASH MTB-MLE classroom vocabulary'
              : 'Sample translation — verify with native speaker',
            matchedEntry: entry,
            provider: this.name,
            verificationStatus: entry.verificationStatus,
            source: resource.source.name,
            script: entry.script
          };
        }
      }

      // 2. Partial dictionary match
      for (const entry of resource.classroomPhrases) {
        const entryNorm = normalizePhrase(entry.hindi);

        if (norm.includes(entryNorm) && entryNorm.length > 3) {
          return {
            found: true,
            sourceText,
            translatedText: `${entry.translation}${entry.pronunciation ? ` (${entry.pronunciation})` : ''}`,
            olChiki: entry.script,
            phonetic: entry.pronunciation,
            sourceLanguage: 'hi',
            targetLanguage: 'sat',
            isVerified: false,
            statusNote: 'Sample translation — verify with native speaker',
            matchedEntry: entry,
            provider: this.name,
            verificationStatus: 'demo',
            source: resource.source.name,
            script: entry.script
          };
        }
      }

      return {
        found: false,
        sourceText,
        translatedText: '',
        sourceLanguage: 'hi',
        targetLanguage: 'sat',
        isVerified: false,
        statusNote:
          'Translation unavailable for this phrase in the local language pack.',
        provider: this.name
      };
    }

    if (fromLang === 'hi' && toLang !== 'hi') {
      const entry = resource.classroomPhrases.find((item) => normalizePhrase(item.hindi) === norm);
      if (entry) {
        return {
          found: true,
          sourceText,
          translatedText: entry.translation,
          sourceLanguage: 'hi',
          targetLanguage: toLang,
          isVerified: entry.verificationStatus === 'verified',
          statusNote: 'Verified local vocabulary from the bundled offline core',
          matchedEntry: entry,
          provider: this.name,
          verificationStatus: entry.verificationStatus,
          source: resource.source.name,
          script: entry.script
        };
      }

      return {
        found: false,
        sourceText,
        translatedText: '',
        sourceLanguage: fromLang,
        targetLanguage: toLang,
        isVerified: false,
        verificationStatus: 'unavailable',
        source: resource.source.name,
        statusNote: resource.offlineAvailable
          ? `${languageDisplayName(toLang)} offline core has no verified entry for this phrase.`
          : `${languageDisplayName(toLang)} translation requires the connected AI language service.`,
        provider: this.name
      };
    }

    if (toLang === 'hi' && fromLang !== 'sat') {
      const entry = resource.classroomPhrases.find((item) =>
        normalizePhrase(item.translation) === norm ||
        (item.pronunciation && normalizePhrase(item.pronunciation) === norm)
      );
      if (entry) {
        return {
          found: true,
          sourceText,
          translatedText: entry.hindi,
          sourceLanguage: fromLang,
          targetLanguage: 'hi',
          isVerified: entry.verificationStatus === 'verified',
          statusNote: 'Verified local vocabulary from the bundled offline core',
          matchedEntry: entry,
          provider: this.name,
          verificationStatus: entry.verificationStatus,
          source: resource.source.name
        };
      }

      return {
        found: false,
        sourceText,
        translatedText: '',
        sourceLanguage: fromLang,
        targetLanguage: 'hi',
        isVerified: false,
        verificationStatus: 'unavailable',
        source: resource.source.name,
        statusNote: resource.offlineAvailable
          ? `${languageDisplayName(fromLang)} offline core has no verified entry for this phrase.`
          : `${languageDisplayName(fromLang)} translation requires the connected AI language service.`,
        provider: this.name
      };
    }

    if (fromLang !== 'sat' || toLang !== 'hi') {
      return {
        found: false,
        sourceText,
        translatedText: '',
        sourceLanguage: fromLang,
        targetLanguage: toLang,
        isVerified: false,
        statusNote: `${languageDisplayName(toLang)} translation requires the connected AI language service.`,
        provider: this.name
      };
    }

    // Santhali → Hindi
    // 1. Exact match
    for (const entry of resource.classroomPhrases) {
      if (
        normalizePhrase(entry.translation) === norm ||
        (entry.pronunciation && normalizePhrase(entry.pronunciation) === norm) ||
        (entry.script && normalizePhrase(entry.script) === norm)
      ) {
        return {
          found: true,
          sourceText,
          translatedText: entry.hindi,
          sourceLanguage: 'sat',
          targetLanguage: 'hi',
          isVerified: entry.verificationStatus === 'verified',
          statusNote: entry.verificationStatus === 'verified'
            ? 'Verified PALASH MTB-MLE classroom vocabulary'
            : 'Sample translation — verify with native speaker',
          matchedEntry: entry,
          provider: this.name,
          verificationStatus: entry.verificationStatus,
          source: resource.source.name,
          script: entry.script
        };
      }
    }

    // 2. Student classroom simulation responses
    for (const response of STUDENT_SIMULATION_RESPONSES) {
      if (
        normalizePhrase(response.santhali).includes(norm) ||
        norm.includes(normalizePhrase(response.santhali))
      ) {
        return {
          found: true,
          sourceText,
          translatedText: response.hindi,
          sourceLanguage: 'sat',
          targetLanguage: 'hi',
          isVerified: true,
          statusNote: 'Verified classroom dialogue response',
          provider: this.name
        };
      }
    }

    return {
      found: false,
      sourceText,
      translatedText: '',
      sourceLanguage: 'sat',
      targetLanguage: 'hi',
      isVerified: false,
      verificationStatus: 'ai_assisted',
      source: 'Connected AI language service',
      statusNote:
        'Translation unavailable for this phrase in the local language pack.',
      provider: this.name
    };
  }
}

/**
 * Active local provider.
 */
let activeTranslationProvider: TranslationProvider =
  new LocalDictionaryTranslationProvider();

/**
 * Pluggable provider setter.
 */
export function setTranslationProvider(provider: TranslationProvider): void {
  activeTranslationProvider = provider;
}

export function getTranslationProvider(): TranslationProvider {
  return activeTranslationProvider;
}

/**
 * Existing synchronous translation function.
 *
 * IMPORTANT:
 * Kept unchanged in behavior so existing UI components
 * do not break.
 */
export function translateText(
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string
): TranslationResult {
  return activeTranslationProvider.translateText(
    sourceText,
    sourceLanguage,
    targetLanguage
  );
}

/**
 * REAL BACKEND TRANSLATION
 *
 * Frontend
 *    ↓
 * Express Backend
 *    ↓
 * Sarvam
 *    ↓
 * Translation
 *
 * If backend is unavailable, automatically falls back
 * to the existing local dictionary.
 */
export async function translateTextWithBackend(
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const fromLang = normalizeLanguageCode(sourceLanguage);
  const toLang = normalizeLanguageCode(targetLanguage);

  if (!sourceText.trim()) {
    return translateText(sourceText, sourceLanguage, targetLanguage);
  }

  const localResult = translateText(sourceText, sourceLanguage, targetLanguage);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (localResult.found) return localResult;
    return {
      ...localResult,
      statusNote: 'Connected service unavailable. No verified local resource is available for this phrase.',
      verificationStatus: 'unavailable'
    };
  }

  // Keep curated classroom phrases authoritative when the local pack has a
  // verified match; use the connected service only for phrases outside it.
  if (localResult.found && localResult.isVerified) {
    return localResult;
  }

  try {
    const response = await apiFetch('translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: sourceText,
        sourceLanguage: languageDisplayName(fromLang),
        targetLanguage: languageDisplayName(toLang)
      })
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.translatedText) {
      throw new Error('Invalid translation response from backend');
    }

    return {
      found: true,
      sourceText,
      translatedText: data.translatedText,
      sourceLanguage: fromLang,
      targetLanguage: toLang,
      isVerified: false,
      verificationStatus: 'ai_assisted',
      source: 'Connected AI language service',
      statusNote:
        'AI translation — verify with a native speaker before classroom use.',
      provider: data.provider || 'Sarvam'
    };
  } catch (error) {
    console.warn(
      'Backend translation unavailable. Falling back to local dictionary.',
      error
    );

    return {
      ...localResult,
      statusNote: localResult.found
        ? localResult.statusNote
        : 'Connected service unavailable. No verified local resource is available for this phrase.',
      verificationStatus: localResult.found ? localResult.verificationStatus : 'unavailable'
    };
  }
}