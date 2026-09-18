import hoVocabulary from './ho/vocabulary.json';
import hoMetadata from './ho/metadata.json';
import mundariVocabulary from './mundari/vocabulary.json';
import mundariGrammarRules from './mundari/grammar_rules.json';
import mundariMetadata from './mundari/metadata.json';

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

export const HO_OFFLINE_CORE = {
  vocabulary: hoVocabulary as OfflineCoreVocabularyEntry[],
  classroomPhrases: [] as OfflineCoreVocabularyEntry[],
  flnTerms: [] as OfflineCoreVocabularyEntry[],
  numbers: [] as OfflineCoreVocabularyEntry[],
  metadata: hoMetadata
};

export const MUNDARI_OFFLINE_CORE = {
  vocabulary: mundariVocabulary as OfflineCoreVocabularyEntry[],
  classroomPhrases: [] as OfflineCoreVocabularyEntry[],
  flnTerms: [] as OfflineCoreVocabularyEntry[],
  numbers: [] as OfflineCoreVocabularyEntry[],
  grammarRules: mundariGrammarRules as OfflineCoreGrammarRule[],
  metadata: mundariMetadata
};
