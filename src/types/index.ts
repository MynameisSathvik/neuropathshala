export type GradeLevel = 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5';

export type SubjectArea = 'Foundational Literacy' | 'Foundational Numeracy';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LanguageCode = 'hi' | 'sat' | 'ho' | 'unr';

export type TribalLanguage = 'Santhali' | 'Ho' | 'Mundari';

export type VerificationStatus = 'verified' | 'ai_assisted' | 'demo' | 'unavailable';

export interface LanguageResourceSource {
  name: string;
  reference?: string;
  reviewed: boolean;
}

/** Import contract for future verified language packs. Pronunciation and audio are optional until verified. */
export interface LanguageResourceItem {
  id: string;
  language: TribalLanguage;
  hindi: string;
  translation: string;
  tribalText?: string;
  english?: string;
  script?: string;
  pronunciation?: string;
  category: string;
  verificationStatus: VerificationStatus;
  source: LanguageResourceSource;
  audioUrl?: string;
  resourceId?: string;
  audio?: {
    type: 'native_recording';
    url: string;
    verified: boolean;
  };
  image?: string;
  activity?: {
    label: string;
    icon: string;
  };
}

export interface LanguageResource {
  language: TribalLanguage;
  nativeName: string;
  scripts: string[];
  words: LanguageResourceItem[];
  classroomPhrases: LanguageResourceItem[];
  pronunciation: LanguageResourceItem[];
  categories: string[];
  source: LanguageResourceSource;
  verificationStatus: VerificationStatus;
  offlineAvailable: boolean;
}

export interface LanguagePackInput {
  language: TribalLanguage;
  nativeName: string;
  scripts: string[];
  categories: string[];
  source: LanguageResourceSource;
  offlineAvailable: boolean;
  entries: Array<Omit<LanguageResourceItem, 'language'>>;
}

export interface LanguagePackValidationResult {
  valid: boolean;
  errors: string[];
  resource?: LanguageResource;
}

export const TRIBAL_LANGUAGES: TribalLanguage[] = [
  'Santhali',
  'Ho',
  'Mundari'
];

export const TRIBAL_LANGUAGE_CODES: Record<TribalLanguage, LanguageCode> = {
  Santhali: 'sat',
  Ho: 'ho',
  Mundari: 'unr'
};

export interface TribalLanguageProfile {
  code: LanguageCode;
  script: string;
  scripts?: string[];
  scriptNote: string;
  resourceLabel: string;
  resourceNote: string;
}

export const TRIBAL_LANGUAGE_PROFILES: Record<TribalLanguage, TribalLanguageProfile> = {
  Santhali: {
    code: 'sat',
    script: 'Ol Chiki',
    scripts: ['Ol Chiki'],
    scriptNote: 'Ol Chiki representation is bundled for verified local phrases.',
    resourceLabel: 'Offline phrase pack',
    resourceNote: 'Curated classroom phrases are available without internet.'
  },
  Ho: {
    code: 'ho',
    script: 'No bundled script representation',
    scripts: [],
    scriptNote: 'Ho vocabulary is bundled locally from the supplied Ho-Hindi dictionary.',
    resourceLabel: 'Offline vocabulary core',
    resourceNote: 'Curated Ho vocabulary is available without internet; phrase coverage is limited.'
  },
  Mundari: {
    code: 'unr',
    script: 'No bundled script representation',
    scripts: [],
    scriptNote: 'A local Mundari grammar reference is bundled; lexical translation is not claimed without verified entries.',
    resourceLabel: 'Offline grammar core',
    resourceNote: 'Grammar metadata is available locally; lexical translation remains limited.'
  }
};

export const TRIBAL_LANGUAGE_STATUS: Record<TribalLanguage, {
  local: boolean;
  label: string;
  note: string;
}> = {
  Santhali: {
    local: true,
    label: 'Offline core',
    note: 'Verified local classroom phrase pack'
  },
  Ho: {
    local: true,
    label: 'Offline core',
    note: 'Curated Ho vocabulary is available locally; unsupported phrases remain unavailable'
  },
  Mundari: {
    local: true,
    label: 'Offline core',
    note: 'Local grammar core is loaded; lexical translation remains limited until verified'
  }
};

export interface Lesson {
  id: string;
  title: string;
  grade: GradeLevel;
  subject: SubjectArea;
  topic: string;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  localContext: string;
  objective: string;
  materials: string[];
  warmUp: string;
  teacherExplanation: string;
  localContextExample: string;
  classroomActivity: string;
  practice: string;
  assessment: string;
  motherTongueSupport: {
    language: TribalLanguage | string;
    keyPhrases: Array<{ hindi: string; santhali: string; translatedText?: string; phonetic: string }>;
  };
  createdAt: string;
  updatedAt: string;
  nipunOutcome?: string;
  resourceId?: string;
  resourceIds?: string[];
  targetLanguage?: TribalLanguage;
}

export interface WorksheetQuestion {
  id: string;
  questionNumber: number;
  type: 'count' | 'match' | 'fill' | 'wordPair';
  promptHindi: string;
  promptSanthali: string;
  promptTargetLanguage?: string;
  subtext?: string;
  options?: string[];
  answer?: string;
  visualSymbol?: string;
}

export interface Worksheet {
  id: string;
  title: string;
  grade: GradeLevel;
  subject: SubjectArea;
  topic: string;
  difficulty: DifficultyLevel;
  localContext: string;
  instructionsHindi: string;
  instructionsSanthali: string;
  instructionsTargetLanguage?: string;
  questions: WorksheetQuestion[];
  activityInstructions: string;
  answerKeyNotes: string;
  createdAt: string;
  updatedAt: string;
  nipunOutcome?: string;
  resourceId?: string;
  resourceIds?: string[];
  targetLanguage?: TribalLanguage;
}

export interface ClassroomExchange {
  id: string;
  speaker: 'teacher' | 'student';
  text: string;
  translatedText: string;
  direction: 'hi-to-sat' | 'sat-to-hi';
  timestamp: string;
  isVerified?: boolean;
}

export type StudentObservationStatus =
  | 'understood'
  | 'needs_repetition'
  | 'needs_visual_support'
  | 'needs_mother_tongue'
  | 'mastered';

export interface StudentObservation {
  id: string;
  status: StudentObservationStatus;
  resourceId?: string;
  phraseHindi: string;
  activity: string;
  recordedAt: string;
}

export interface ClassroomSession {
  id: string;
  grade: GradeLevel;
  subject: SubjectArea;
  topic: string;
  language: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  exchanges: ClassroomExchange[];
  translationCount: number;
  teacherPromptsCount: number;
  studentResponsesCount: number;
  comprehension: 'High' | 'Moderate' | 'Needs Simplification';
  suggestedNextAction: string;
  createdAt: string;
  observations?: StudentObservation[];
  teacherNote?: string;
}

export interface TranslationRecord {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  isVerified: boolean;
  statusNote: string;
  timestamp: string;
  verificationStatus?: VerificationStatus;
  source?: string;
  script?: string;
  resourceId?: string;
}

export interface Flashcard {
  id: string;
  category: 'Letters' | 'Words' | 'Numbers' | 'Objects' | 'Shapes';
  frontHindi: string;
  backTranslation?: string;
  backSanthali: string;
  olChikiScript?: string;
  phonetic: string;
  englishMeaning: string;
  localContextHint: string;
  learned: boolean;
  visualIcon?: string;
  targetLanguage?: TribalLanguage;
  resourceId?: string;
  nipunOutcome?: string;
}

export interface LanguagePracticeItem {
  id: string;
  category: 'Greetings' | 'Classroom Phrases' | 'Numbers' | 'Objects' | 'Activities' | 'Encouragement' | 'Assessment';
  phraseHindi: string;
  phraseSanthali: string;
  olChikiScript?: string;
  phonetic: string;
  meaningContext: string;
  learned: boolean;
  isVerified: boolean;
  targetLanguage?: TribalLanguage;
  resourceId?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNote?: string;
}

export interface TeacherSettings {
  teacherName: string;
  schoolName: string;
  district: string;
  state: string;
  primaryGrade: GradeLevel;
  targetLanguage: string;
  offlineMode: boolean;
  syncState: 'offline' | 'ready' | 'syncing' | 'synced';
  lastSyncedAt: string;
  notificationsEnabled: boolean;
  textSize: 'normal' | 'large';
  onboardingCompleted?: boolean;
}

export type SyncDomain =
  | 'lessons'
  | 'worksheets'
  | 'classroomSessions'
  | 'translations'
  | 'flashcards'
  | 'languagePractice'
  | 'settings'
  | 'notifications';

export interface SyncQueueItem {
  id: string;
  domain: SyncDomain;
  queuedAt: string;
  attempts: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'lesson' | 'worksheet' | 'classroom' | 'language' | 'system';
}

export type NavigationTab =
  | 'dashboard'
  | 'live-classroom'
  | 'teacher-survival-kit'
  | 'translator'
  | 'lessons'
  | 'worksheets'
  | 'flashcards'
  | 'language-lab'
  | 'resource-library'
  | 'learning-insights'
  | 'sync-offline'
  | 'settings';
