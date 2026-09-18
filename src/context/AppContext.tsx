import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode
} from 'react';

import {
  Lesson,
  Worksheet,
  ClassroomSession,
  TranslationRecord,
  Flashcard,
  LanguagePracticeItem,
  TeacherSettings,
  NotificationItem,
  SyncDomain,
  SyncQueueItem,
  NavigationTab,
  GradeLevel,
  SubjectArea
} from '../types';
import { apiFetch } from '../services/apiClient';
import {
  readOfflineDocument,
  readOfflineSyncQueue,
  writeOfflineDocument,
  writeOfflineSyncQueue
} from '../services/offlineStorage';

import {
  INITIAL_TEACHER_SETTINGS,
  INITIAL_LESSONS,
  INITIAL_WORKSHEETS,
  INITIAL_CLASSROOM_SESSIONS,
  INITIAL_TRANSLATIONS,
  INITIAL_FLASHCARDS,
  INITIAL_LANGUAGE_PRACTICE,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

const STORAGE_KEY =
  'neuropathshala_master_store_v1';

export interface ToastInfo {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Data
  lessons: Lesson[];
  worksheets: Worksheet[];
  classroomSessions: ClassroomSession[];
  translationHistory: TranslationRecord[];
  flashcards: Flashcard[];
  languagePractice: LanguagePracticeItem[];
  languagePracticeItems: LanguagePracticeItem[];
  settings: TeacherSettings;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  syncQueue: SyncQueueItem[];

  // Derived Analytics
  stats: {
    lessonsCompleted: number;
    worksheetsCreated: number;
    classroomSessionsCount: number;
    translationsCount: number;
    flashcardsLearnedCount: number;
    flashcardsTotal: number;
    languagePracticeLearnedCount: number;
    languagePracticeTotal: number;
    questionsAnswered: number;
    readinessPercent: number;
    readinessLabel: string;
  };

  // Cross-page presets
  activeLiveClassPreset: {
    grade: GradeLevel;
    subject: SubjectArea;
    topic: string;
    lessonId?: string;
    phrase?: {
      language: 'Santhali' | 'Ho' | 'Mundari';
      hindi: string;
      translatedText: string;
      pronunciation?: string;
      audioUrl?: string;
      resourceId?: string;
      statusNote: string;
      isVerified: boolean;
    };
  } | null;

  clearLiveClassPreset: () => void;

  activeWorksheetPreset: {
    topic: string;
    grade: GradeLevel;
    subject: SubjectArea;
    simplified?: boolean;
  } | null;

  clearWorksheetPreset: () => void;

  // Actions
  saveLesson: (lesson: Lesson) => void;
  updateLesson: (lesson: Lesson) => void;
  deleteLesson: (id: string) => void;
  duplicateLesson: (id: string) => void;

  saveWorksheet: (worksheet: Worksheet) => void;
  updateWorksheet: (worksheet: Worksheet) => void;
  deleteWorksheet: (id: string) => void;
  duplicateWorksheet: (id: string) => void;

  saveClassroomSession: (
    session: ClassroomSession
  ) => void;

  addTranslationRecord: (
    record: Omit<
      TranslationRecord,
      'id' | 'timestamp'
    >
  ) => void;

  deleteTranslationRecord: (
    id: string
  ) => void;

  toggleFlashcardLearned: (
    id: string
  ) => void;

  addFlashcards: (
    cards: Flashcard[]
  ) => void;

  // NEW: AI Language Lab
  addLanguagePracticeItems: (
    items: LanguagePracticeItem[]
  ) => void;

  toggleLanguagePracticeLearned: (
    id: string
  ) => void;

  updateLanguagePracticeItem: (
    item: LanguagePracticeItem
  ) => void;

  updateSettings: (
    partial: Partial<TeacherSettings>
  ) => void;

  syncNow: () => Promise<void>;

  // Notifications & Toasts
  toasts: ToastInfo[];

  showToast: (
    text: string,
    type?: 'success' | 'info' | 'warning'
  ) => void;

  dismissToast: (
    id: string
  ) => void;

  markNotificationRead: (
    id: string
  ) => void;

  clearAllNotifications: () => void;

  // Demo Control
  resetDemoData: () => void;

  // Cross-page workflow shortcuts
  startLiveClassFromLesson: (
    lesson: Lesson
  ) => void;

  startLiveClassFromPhrase: (phrase: {
    language: 'Santhali' | 'Ho' | 'Mundari';
    hindi: string;
    translatedText: string;
    pronunciation?: string;
    audioUrl?: string;
    resourceId?: string;
    statusNote: string;
    isVerified: boolean;
  }) => void;

  createWorksheetFromLesson: (
    lesson: Lesson,
    simplified?: boolean
  ) => void;

  createSimplifiedActivityFromInsights: () => void;
}

const AppContext =
  createContext<AppContextType | undefined>(
    undefined
  );

export const AppProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [activeTab, setActiveTab] =
    useState<NavigationTab>('dashboard');

  /* =========================
     CORE STATE
  ========================= */

  const [lessons, setLessons] =
    useState<Lesson[]>(() => {
      if (typeof window === 'undefined')
        return INITIAL_LESSONS;

      try {
        const saved =
          localStorage.getItem(
            `${STORAGE_KEY}_lessons`
          );

        return saved
          ? JSON.parse(saved)
          : INITIAL_LESSONS;
      } catch {
        return INITIAL_LESSONS;
      }
    });

  const [worksheets, setWorksheets] =
    useState<Worksheet[]>(() => {
      if (typeof window === 'undefined')
        return INITIAL_WORKSHEETS;

      try {
        const saved =
          localStorage.getItem(
            `${STORAGE_KEY}_worksheets`
          );

        return saved
          ? JSON.parse(saved)
          : INITIAL_WORKSHEETS;
      } catch {
        return INITIAL_WORKSHEETS;
      }
    });

  const [
    classroomSessions,
    setClassroomSessions
  ] = useState<ClassroomSession[]>(() => {
    if (typeof window === 'undefined')
      return INITIAL_CLASSROOM_SESSIONS;

    try {
      const saved =
        localStorage.getItem(
          `${STORAGE_KEY}_sessions`
        );

      return saved
        ? JSON.parse(saved)
        : INITIAL_CLASSROOM_SESSIONS;
    } catch {
      return INITIAL_CLASSROOM_SESSIONS;
    }
  });

  const [
    translationHistory,
    setTranslationHistory
  ] = useState<TranslationRecord[]>(() => {
    if (typeof window === 'undefined')
      return INITIAL_TRANSLATIONS;

    try {
      const saved =
        localStorage.getItem(
          `${STORAGE_KEY}_translations`
        );

      return saved
        ? JSON.parse(saved)
        : INITIAL_TRANSLATIONS;
    } catch {
      return INITIAL_TRANSLATIONS;
    }
  });

  const [flashcards, setFlashcards] =
    useState<Flashcard[]>(() => {
      if (typeof window === 'undefined')
        return INITIAL_FLASHCARDS;

      try {
        const saved =
          localStorage.getItem(
            `${STORAGE_KEY}_flashcards`
          );

        return saved
          ? JSON.parse(saved)
          : INITIAL_FLASHCARDS;
      } catch {
        return INITIAL_FLASHCARDS;
      }
    });

  const [
    languagePractice,
    setLanguagePractice
  ] = useState<LanguagePracticeItem[]>(() => {
    if (typeof window === 'undefined')
      return INITIAL_LANGUAGE_PRACTICE;

    try {
      const saved =
        localStorage.getItem(
          `${STORAGE_KEY}_practice`
        );

      return saved
        ? JSON.parse(saved)
        : INITIAL_LANGUAGE_PRACTICE;
    } catch {
      return INITIAL_LANGUAGE_PRACTICE;
    }
  });

  const [settings, setSettings] =
    useState<TeacherSettings>(() => {
      if (typeof window === 'undefined')
        return INITIAL_TEACHER_SETTINGS;

      try {
        const saved =
          localStorage.getItem(
            `${STORAGE_KEY}_settings`
          );

        return saved
          ? JSON.parse(saved)
          : INITIAL_TEACHER_SETTINGS;
      } catch {
        return INITIAL_TEACHER_SETTINGS;
      }
    });

  const [
    notifications,
    setNotifications
  ] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined')
      return INITIAL_NOTIFICATIONS;

    try {
      const saved =
        localStorage.getItem(
          `${STORAGE_KEY}_notifications`
        );

      return saved
        ? JSON.parse(saved)
        : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [toasts, setToasts] =
    useState<ToastInfo[]>([]);

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(`${STORAGE_KEY}_sync_queue`) || '[]');
    } catch {
      return [];
    }
  });

  const hasHydratedRef = useRef(false);
  const offlineStorageReadyRef = useRef(false);

  /* =========================
     CROSS PAGE PRESETS
  ========================= */

  const [
    activeLiveClassPreset,
    setActiveLiveClassPreset
  ] = useState<{
    grade: GradeLevel;
    subject: SubjectArea;
    topic: string;
    lessonId?: string;
    phrase?: {
      language: 'Santhali' | 'Ho' | 'Mundari';
      hindi: string;
      translatedText: string;
      pronunciation?: string;
      statusNote: string;
      isVerified: boolean;
    };
  } | null>(null);

  const [
    activeWorksheetPreset,
    setActiveWorksheetPreset
  ] = useState<{
    topic: string;
    grade: GradeLevel;
    subject: SubjectArea;
    simplified?: boolean;
  } | null>(null);

  /* =========================
     PERSISTENCE
  ========================= */

  useEffect(() => {
    let cancelled = false;
    const hydrateOfflineStore = async () => {
      try {
        const [storedLessons, storedWorksheets, storedSessions, storedTranslations, storedFlashcards, storedPractice, storedSettings, storedNotifications, storedQueue] = await Promise.all([
          readOfflineDocument<Lesson[]>(`${STORAGE_KEY}_lessons`),
          readOfflineDocument<Worksheet[]>(`${STORAGE_KEY}_worksheets`),
          readOfflineDocument<ClassroomSession[]>(`${STORAGE_KEY}_sessions`),
          readOfflineDocument<TranslationRecord[]>(`${STORAGE_KEY}_translations`),
          readOfflineDocument<Flashcard[]>(`${STORAGE_KEY}_flashcards`),
          readOfflineDocument<LanguagePracticeItem[]>(`${STORAGE_KEY}_practice`),
          readOfflineDocument<TeacherSettings>(`${STORAGE_KEY}_settings`),
          readOfflineDocument<NotificationItem[]>(`${STORAGE_KEY}_notifications`),
          readOfflineSyncQueue<SyncQueueItem>()
        ]);

        if (cancelled) return;
        if (storedLessons) setLessons(storedLessons);
        if (storedWorksheets) setWorksheets(storedWorksheets);
        if (storedSessions) setClassroomSessions(storedSessions);
        if (storedTranslations) setTranslationHistory(storedTranslations);
        if (storedFlashcards) setFlashcards(storedFlashcards);
        if (storedPractice) setLanguagePractice(storedPractice);
        if (storedSettings) setSettings(storedSettings);
        if (storedNotifications) setNotifications(storedNotifications);
        if (storedQueue) setSyncQueue(storedQueue);

        if (!storedLessons) await writeOfflineDocument(`${STORAGE_KEY}_lessons`, lessons);
        if (!storedWorksheets) await writeOfflineDocument(`${STORAGE_KEY}_worksheets`, worksheets);
        if (!storedSessions) await writeOfflineDocument(`${STORAGE_KEY}_sessions`, classroomSessions);
        if (!storedTranslations) await writeOfflineDocument(`${STORAGE_KEY}_translations`, translationHistory);
        if (!storedFlashcards) await writeOfflineDocument(`${STORAGE_KEY}_flashcards`, flashcards);
        if (!storedPractice) await writeOfflineDocument(`${STORAGE_KEY}_practice`, languagePractice);
        if (!storedSettings) await writeOfflineDocument(`${STORAGE_KEY}_settings`, settings);
        if (!storedNotifications) await writeOfflineDocument(`${STORAGE_KEY}_notifications`, notifications);
        if (!storedQueue) await writeOfflineSyncQueue(syncQueue);
      } catch {
        // localStorage remains the fallback when IndexedDB is unavailable or corrupted.
      } finally {
        if (!cancelled) offlineStorageReadyRef.current = true;
      }
    };
    void hydrateOfflineStore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      hasHydratedRef.current = true;
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const markDirty = (domain: SyncDomain) => {
    if (!hasHydratedRef.current) return;
    setSyncQueue((prev) => {
      if (prev.some((item) => item.domain === domain)) return prev;
      return [
        ...prev,
        {
          id: `sync-${domain}-${Date.now()}`,
          domain,
          queuedAt: new Date().toISOString(),
          attempts: 0
        }
      ];
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_sync_queue`, JSON.stringify(syncQueue));
      if (offlineStorageReadyRef.current) void writeOfflineSyncQueue(syncQueue).catch(() => undefined);
    } catch (e) {
      console.error('Failed to persist sync queue', e);
    }
  }, [syncQueue]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_lessons`,
        JSON.stringify(lessons)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_lessons`, lessons).catch(() => undefined);
      markDirty('lessons');
    } catch (e) {
      console.error(
        'Failed to persist lessons',
        e
      );
    }
  }, [lessons]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_worksheets`,
        JSON.stringify(worksheets)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_worksheets`, worksheets).catch(() => undefined);
      markDirty('worksheets');
    } catch (e) {
      console.error(
        'Failed to persist worksheets',
        e
      );
    }
  }, [worksheets]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_sessions`,
        JSON.stringify(classroomSessions)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_sessions`, classroomSessions).catch(() => undefined);
      markDirty('classroomSessions');
    } catch (e) {
      console.error(
        'Failed to persist sessions',
        e
      );
    }
  }, [classroomSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_translations`,
        JSON.stringify(translationHistory)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_translations`, translationHistory).catch(() => undefined);
      markDirty('translations');
    } catch (e) {
      console.error(
        'Failed to persist translations',
        e
      );
    }
  }, [translationHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_flashcards`,
        JSON.stringify(flashcards)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_flashcards`, flashcards).catch(() => undefined);
      markDirty('flashcards');
    } catch (e) {
      console.error(
        'Failed to persist flashcards',
        e
      );
    }
  }, [flashcards]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_practice`,
        JSON.stringify(languagePractice)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_practice`, languagePractice).catch(() => undefined);
      markDirty('languagePractice');
    } catch (e) {
      console.error(
        'Failed to persist language practice',
        e
      );
    }
  }, [languagePractice]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_settings`,
        JSON.stringify(settings)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_settings`, settings).catch(() => undefined);
      markDirty('settings');
    } catch (e) {
      console.error(
        'Failed to persist settings',
        e
      );
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_notifications`,
        JSON.stringify(notifications)
      );
      if (offlineStorageReadyRef.current) void writeOfflineDocument(`${STORAGE_KEY}_notifications`, notifications).catch(() => undefined);
      markDirty('notifications');
    } catch (e) {
      console.error(
        'Failed to persist notifications',
        e
      );
    }
  }, [notifications]);

  /* =========================
     TOASTS
  ========================= */

  const showToast = (
    text: string,
    type:
      | 'success'
      | 'info'
      | 'warning' = 'success'
  ) => {
    const now = Date.now();
    const id =
      `toast-${now}-${Math.random()
        .toString(36)
        .substring(2, 6)}`;

    setToasts((prev) => {
      const duplicateExists = prev.some(
        (toast) => toast.text === text && toast.type === type
      );

      if (duplicateExists) return prev;

      return [
        ...prev,
        {
          id,
          text,
          type
        }
      ];
    });

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter(
          (t) => t.id !== id
        )
      );
    }, 4000);
  };

  const dismissToast = (
    id: string
  ) => {
    setToasts((prev) =>
      prev.filter(
        (t) => t.id !== id
      )
    );
  };

  /* =========================
     NOTIFICATIONS
  ========================= */

  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem['type']
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type
    };

    setNotifications((prev) => [
      newNotif,
      ...prev
    ]);
  };

  const markNotificationRead = (
    id: string
  ) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, read: true }
          : n
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);

    showToast(
      'All notifications cleared',
      'info'
    );
  };

  /* =========================
     ANALYTICS
  ========================= */

  const stats = useMemo(() => {
    const lessonsCompleted =
      lessons.length;

    const worksheetsCreated =
      worksheets.length;

    const classroomSessionsCount =
      classroomSessions.length;

    const translationsCount =
      translationHistory.length;

    const flashcardsLearnedCount =
      flashcards.filter(
        (f) => f.learned
      ).length;

    const flashcardsTotal =
      flashcards.length;

    const languagePracticeLearnedCount =
      languagePractice.filter(
        (p) => p.learned
      ).length;

    const languagePracticeTotal =
      languagePractice.length;

    const worksheetQuestionsCount =
      worksheets.reduce(
        (acc, w) =>
          acc +
          (w.questions
            ? w.questions.length
            : 0),
        0
      );

    const sessionStudentResponsesCount =
      classroomSessions.reduce(
        (acc, s) =>
          acc +
          (s.studentResponsesCount ||
            0),
        0
      );

    const questionsAnswered =
      worksheetQuestionsCount +
      sessionStudentResponsesCount;

    const lessonScore =
      Math.min(
        30,
        lessonsCompleted * 10
      );

    const classroomScore =
      Math.min(
        40,
        classroomSessionsCount * 15 +
          worksheetsCreated * 5
      );

    const vocabScore =
      Math.min(
        30,
        Math.round(
          (flashcardsLearnedCount /
            (flashcardsTotal || 1)) *
            15 +
            (languagePracticeLearnedCount /
              (languagePracticeTotal ||
                1)) *
              15
        )
      );

    const totalCalculated =
      lessonScore +
      classroomScore +
      vocabScore;

    let readinessLabel =
      'Getting started';

    if (totalCalculated === 0) {
      readinessLabel =
        'Complete your first lesson to build classroom readiness.';
    } else if (
      totalCalculated < 40
    ) {
      readinessLabel =
        'Foundations building — initial classroom readiness.';
    } else if (
      totalCalculated < 75
    ) {
      readinessLabel =
        'Active classroom readiness — curriculum & practice active.';
    } else {
      readinessLabel =
        'High classroom readiness — multilingual teaching aligned.';
    }

    return {
      lessonsCompleted,
      worksheetsCreated,
      classroomSessionsCount,
      translationsCount,
      flashcardsLearnedCount,
      flashcardsTotal,
      languagePracticeLearnedCount,
      languagePracticeTotal,
      questionsAnswered,
      readinessPercent:
        totalCalculated,
      readinessLabel
    };
  }, [
    lessons,
    worksheets,
    classroomSessions,
    translationHistory,
    flashcards,
    languagePractice
  ]);

  const unreadNotificationCount =
    useMemo(
      () =>
        notifications.filter(
          (n) => !n.read
        ).length,
      [notifications]
    );

  /* =========================
     LESSON OPERATIONS
  ========================= */

  const saveLesson = (
    lesson: Lesson
  ) => {
    setLessons((prev) => [
      lesson,
      ...prev
    ]);

    showToast(
      `Lesson "${lesson.title.substring(
        0,
        24
      )}..." saved.`
    );

    addNotification(
      'Lesson saved',
      `Created: ${lesson.title}`,
      'lesson'
    );
  };

  const updateLesson = (
    updated: Lesson
  ) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === updated.id
          ? updated
          : l
      )
    );

    showToast(
      `Lesson "${updated.title.substring(
        0,
        24
      )}..." updated.`
    );
  };

  const deleteLesson = (
    id: string
  ) => {
    setLessons((prev) =>
      prev.filter(
        (l) => l.id !== id
      )
    );

    showToast(
      'Lesson deleted.',
      'info'
    );
  };

  const duplicateLesson = (
    id: string
  ) => {
    const target =
      lessons.find(
        (l) => l.id === id
      );

    if (!target) return;

    const duplicated: Lesson = {
      ...target,
      id: `les-${Date.now()}`,
      title: `${target.title} (Copy)`,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString()
    };

    setLessons((prev) => [
      duplicated,
      ...prev
    ]);

    showToast(
      'Lesson duplicated.'
    );
  };

  /* =========================
     WORKSHEET OPERATIONS
  ========================= */

  const saveWorksheet = (
    worksheet: Worksheet
  ) => {
    setWorksheets((prev) => [
      worksheet,
      ...prev
    ]);

    showToast(
      `Worksheet "${worksheet.title.substring(
        0,
        24
      )}..." created.`
    );

    addNotification(
      'Worksheet created',
      `Created: ${worksheet.title}`,
      'worksheet'
    );
  };

  const updateWorksheet = (
    updated: Worksheet
  ) => {
    setWorksheets((prev) =>
      prev.map((w) =>
        w.id === updated.id
          ? updated
          : w
      )
    );

    showToast(
      'Worksheet updated.'
    );
  };

  const deleteWorksheet = (
    id: string
  ) => {
    setWorksheets((prev) =>
      prev.filter(
        (w) => w.id !== id
      )
    );

    showToast(
      'Worksheet deleted.',
      'info'
    );
  };

  const duplicateWorksheet = (
    id: string
  ) => {
    const target =
      worksheets.find(
        (w) => w.id === id
      );

    if (!target) return;

    const duplicated: Worksheet = {
      ...target,
      id: `ws-${Date.now()}`,
      title: `${target.title} (Copy)`,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString()
    };

    setWorksheets((prev) => [
      duplicated,
      ...prev
    ]);

    showToast(
      'Worksheet duplicated.'
    );
  };

  /* =========================
     CLASSROOM SESSION
  ========================= */

  const saveClassroomSession = (
    session: ClassroomSession
  ) => {
    setClassroomSessions((prev) => [
      session,
      ...prev
    ]);

    showToast(
      'Classroom session completed and saved.'
    );

    addNotification(
      'Class session completed',
      `${session.grade} ${session.subject} session recorded (${session.translationCount} exchanges).`,
      'classroom'
    );
  };

  /* =========================
     TRANSLATIONS
  ========================= */

  const addTranslationRecord = (
    record: Omit<
      TranslationRecord,
      'id' | 'timestamp'
    >
  ) => {
    const fullRecord: TranslationRecord =
      {
        ...record,
        id: `tr-${Date.now()}`,
        timestamp:
          new Date().toLocaleString(
            [],
            {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }
          )
      };

    setTranslationHistory(
      (prev) => [
        fullRecord,
        ...prev
      ]
    );

    showToast(
      'Translation recorded in history.'
    );
  };

  const deleteTranslationRecord = (
    id: string
  ) => {
    setTranslationHistory((prev) =>
      prev.filter(
        (t) => t.id !== id
      )
    );

    showToast(
      'Translation removed from history.',
      'info'
    );
  };

  /* =========================
     FLASHCARDS
  ========================= */

  const addFlashcards = (
    cards: Flashcard[]
  ) => {
    if (!cards.length) return;

    setFlashcards((prev) => [
      ...cards,
      ...prev
    ]);

    showToast(
      `${cards.length} AI flashcard${
        cards.length > 1
          ? 's'
          : ''
      } added to the deck.`,
      'success'
    );

    addNotification(
      'AI Flashcards Generated',
      `${cards.length} new bilingual flashcards were added to the deck.`,
      'lesson'
    );
  };

  const toggleFlashcardLearned = (
    id: string
  ) => {
    setFlashcards((prev) =>
      prev.map((fc) => {
        if (fc.id === id) {
          const nextState =
            !fc.learned;

          showToast(
            nextState
              ? `Flashcard marked learned: ${fc.frontHindi}`
              : `Flashcard reset: ${fc.frontHindi}`,
            'info'
          );

          return {
            ...fc,
            learned: nextState
          };
        }

        return fc;
      })
    );
  };

  /* =========================
     LANGUAGE PRACTICE
  ========================= */

  const addLanguagePracticeItems = (
    items: LanguagePracticeItem[]
  ) => {
    if (!items.length) return;

    setLanguagePractice((prev) => [
      ...items,
      ...prev
    ]);

    showToast(
      `${items.length} AI language practice phrase${
        items.length > 1
          ? 's'
          : ''
      } added.`,
      'success'
    );

    addNotification(
      'AI Language Practice Generated',
      `${items.length} new Hindi–Santhali classroom phrases were added.`,
      'lesson'
    );
  };

  const toggleLanguagePracticeLearned =
    (id: string) => {
      setLanguagePractice((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const nextState =
              !item.learned;

            showToast(
              nextState
                ? `Phrase mastered: ${item.phraseHindi}`
                : `Phrase marked for review: ${item.phraseHindi}`,
              'info'
            );

            return {
              ...item,
              learned: nextState
            };
          }

          return item;
        })
      );
    };

  const updateLanguagePracticeItem = (updated: LanguagePracticeItem) => {
    setLanguagePractice((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    showToast('Language phrase review saved.', 'info');
  };

  /* =========================
     SETTINGS
  ========================= */

  const updateSettings = (
    partial: Partial<TeacherSettings>
  ) => {
    setSettings((prev) => ({
      ...prev,
      ...partial
    }));

    showToast(
      'Settings saved.'
    );
  };

  const syncNow = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      updateSettings({ syncState: 'offline' });
      showToast('Connection unavailable. Changes remain queued on this device.', 'warning');
      return;
    }

    updateSettings({ syncState: 'syncing' });

    try {
      const response = await apiFetch('sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue: syncQueue,
          syncedAt: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error(`Sync returned HTTP ${response.status}`);

      setSyncQueue([]);
      updateSettings({
        syncState: 'synced',
        lastSyncedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      showToast('Offline changes synchronized successfully.', 'success');
    } catch {
      setSyncQueue((prev) => prev.map((item) => ({ ...item, attempts: item.attempts + 1 })));
      updateSettings({ syncState: 'offline' });
      showToast('Sync paused. Changes remain safely queued on this device.', 'warning');
    }
  };

  /* =========================
     RESET DEMO DATA
  ========================= */

  const resetDemoData = () => {
    setLessons(
      INITIAL_LESSONS
    );

    setWorksheets(
      INITIAL_WORKSHEETS
    );

    setClassroomSessions(
      INITIAL_CLASSROOM_SESSIONS
    );

    setTranslationHistory(
      INITIAL_TRANSLATIONS
    );

    setFlashcards(
      INITIAL_FLASHCARDS
    );

    setLanguagePractice(
      INITIAL_LANGUAGE_PRACTICE
    );

    setSettings(
      INITIAL_TEACHER_SETTINGS
    );

    setNotifications(
      INITIAL_NOTIFICATIONS
    );

    if (
      typeof window !==
      'undefined'
    ) {
      localStorage.removeItem(
        `${STORAGE_KEY}_lessons`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_worksheets`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_sessions`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_translations`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_flashcards`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_practice`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_settings`
      );

      localStorage.removeItem(
        `${STORAGE_KEY}_notifications`
      );
    }

    showToast(
      'Demo data reset: Entire application restored to initial state.',
      'info'
    );

    addNotification(
      'Demo Data Reset',
      'All records restored to standard demo state.',
      'system'
    );
  };

  /* =========================
     CROSS-PAGE WORKFLOW
  ========================= */

  const startLiveClassFromLesson = (
    lesson: Lesson
  ) => {
    setActiveLiveClassPreset({
      grade: lesson.grade,
      subject: lesson.subject,
      topic: lesson.topic,
      lessonId: lesson.id
    });

    setActiveTab(
      'live-classroom'
    );

    showToast(
      `Live Class loaded with topic: "${lesson.topic}"`
    );
  };

  const startLiveClassFromPhrase = (phrase: {
    language: 'Santhali' | 'Ho' | 'Mundari';
    hindi: string;
    translatedText: string;
    pronunciation?: string;
    audioUrl?: string;
    resourceId?: string;
    statusNote: string;
    isVerified: boolean;
  }) => {
    setActiveLiveClassPreset({
      grade: settings.primaryGrade,
      subject: 'Foundational Literacy',
      topic: 'Classroom instruction practice',
      phrase
    });
    setActiveTab('live-classroom');
    showToast(`Loaded verified ${phrase.language} phrase into Live Classroom.`);
  };

  const createWorksheetFromLesson = (
    lesson: Lesson,
    simplified?: boolean
  ) => {
    setActiveWorksheetPreset({
      topic: lesson.topic,
      grade: lesson.grade,
      subject: lesson.subject,
      simplified: !!simplified
    });

    setActiveTab(
      'worksheets'
    );

    showToast(
      `Worksheet generator pre-filled with "${lesson.topic}".`
    );
  };

  const createSimplifiedActivityFromInsights =
    () => {
      setActiveWorksheetPreset({
        topic:
          'Simple Numbers & Object Counting (Simplified)',
        grade: 'Grade 2',
        subject:
          'Foundational Numeracy',
        simplified: true
      });

      setActiveTab(
        'worksheets'
      );

      showToast(
        'Opened worksheet generator with simplified visual activity.'
      );
    };

  /* =========================
     PROVIDER
  ========================= */

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,

        lessons,
        worksheets,
        classroomSessions,
        translationHistory,
        flashcards,
        languagePractice,
        languagePracticeItems:
          languagePractice,
        settings,
        notifications,
        unreadNotificationCount,

        stats,

        activeLiveClassPreset,

        clearLiveClassPreset:
          () =>
            setActiveLiveClassPreset(
              null
            ),

        activeWorksheetPreset,

        clearWorksheetPreset:
          () =>
            setActiveWorksheetPreset(
              null
            ),

        saveLesson,
        updateLesson,
        deleteLesson,
        duplicateLesson,

        saveWorksheet,
        updateWorksheet,
        deleteWorksheet,
        duplicateWorksheet,

        saveClassroomSession,

        addTranslationRecord,
        deleteTranslationRecord,

        toggleFlashcardLearned,
        addFlashcards,

        // NEW
        addLanguagePracticeItems,
        toggleLanguagePracticeLearned,
        updateLanguagePracticeItem,

        updateSettings,
        syncNow,

        syncQueue,

        toasts,
        showToast,
        dismissToast,

        markNotificationRead,
        clearAllNotifications,

        resetDemoData,

        startLiveClassFromLesson,
        startLiveClassFromPhrase,
        createWorksheetFromLesson,
        createSimplifiedActivityFromInsights
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp =
  (): AppContextType => {
    const context =
      useContext(AppContext);

    if (!context) {
      throw new Error(
        'useApp must be used within an AppProvider'
      );
    }

    return context;
  };