import hoVocabulary from './ho/vocabulary.json';
import hoMetadata from './ho/metadata.json';
import mundariVocabulary from './mundari/vocabulary.json';
import mundariGrammarRules from './mundari/grammar_rules.json';
import mundariMetadata from './mundari/metadata.json';
import mundariClassroomPhrases from '../../data/mundari/processed/mundari_classroom_phrases.json';
import mundariTranslationIndex from '../../data/mundari/processed/mundari_translation_index.json';

export interface OfflineCoreVocabularyEntry {
  hindi: string;
  target: string;
  english: string;
  category: string;
  sourcePage: string;
}

export interface OfflineCoreGrammarRule {
  topic: string;
  rule: string;
  sourcePage: string;
  confidence: string;
}

export interface MundariCorpusEntry {
  hindi: string;
  mundari: string;
  category: string;
}

export interface MundariTranslationIndex {
  metadata: {
    source: string;
    repository: string;
    language_pair: string;
    source_format: string;
    rawRecordCount: number;
    validRecordCount: number;
    malformedRecordCount: number;
    uniquePairCount: number;
    classroomRecordCount: number;
  };
  lookup: Record<string, string[]>;
}

export const HO_OFFLINE_CORE = {
  vocabulary: hoVocabulary as OfflineCoreVocabularyEntry[],
  classroomPhrases: [] as OfflineCoreVocabularyEntry[],
  flnTerms: [] as OfflineCoreVocabularyEntry[],
  numbers: [] as OfflineCoreVocabularyEntry[],
  metadata: hoMetadata
};

export const MUNDARI_OFFLINE_CORE = {
  vocabulary: mundariVocabulary as OfflineCoreVocabularyEntry[],
  classroomPhrases: mundariClassroomPhrases.entries as MundariCorpusEntry[],
  flnTerms: [] as OfflineCoreVocabularyEntry[],
  numbers: [] as OfflineCoreVocabularyEntry[],
  grammarRules: mundariGrammarRules as OfflineCoreGrammarRule[],
  metadata: mundariMetadata,
  corpus: mundariTranslationIndex as MundariTranslationIndex
};
