import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GradeLevel,
  SubjectArea,
  ClassroomExchange,
  ClassroomSession,
  StudentObservation,
  StudentObservationStatus,
  TRIBAL_LANGUAGE_PROFILES,
  TRIBAL_LANGUAGE_STATUS
} from '../../types';
import { STUDENT_SIMULATION_RESPONSES, normalizePhrase } from '../../data/dictionary';
import { getLanguageResource } from '../../data/languageResources';
import {
  playHindiAudio,
  playAudio,
  isAudioAvailable,
  getAudioStatus,
  stopAllAudio
} from '../../services/audioService';
import {
  normalizeLanguageCode,
  translateTextWithBackend
} from '../../services/translationService';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';
import {
  Radio,
  Play,
  Pause,
  StopCircle,
  Volume2,
  Copy,
  Check,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Clock,
  ArrowRight,
  FileText,
  TrendingUp,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

const TOPIC_PRESETS = [
  'Numbers & Counting 1 to 5',
  'Counting Forest Mahua Seeds',
  'Shapes & Nature Objects',
  'Basic Everyday Words',
  'Reading & Sound Identification',
  'First Letters (Ol Chiki Sounds)',
  'Simple Addition with Haat Vegetables',
  'Simple Subtraction'
];

export const LiveClassroomView: React.FC = () => {
  const {
    activeLiveClassPreset,
    clearLiveClassPreset,
    saveClassroomSession,
    addTranslationRecord,
    setActiveTab,
    createWorksheetFromLesson,
    showToast
  } = useApp();

  // Classroom Setup State
  const [inClass, setInClass] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    activeLiveClassPreset?.grade || 'Grade 2'
  );
  const [selectedSubject, setSelectedSubject] = useState<SubjectArea>(
    activeLiveClassPreset?.subject || 'Foundational Numeracy'
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(
    activeLiveClassPreset?.topic || 'Numbers & Counting 1 to 5'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<'Santhali' | 'Ho' | 'Mundari'>(activeLiveClassPreset?.phrase?.language || 'Santhali');

  // Active Session State
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [exchanges, setExchanges] = useState<ClassroomExchange[]>([]);

  // Teacher Input State
  const [teacherHindiInput, setTeacherHindiInput] = useState(activeLiveClassPreset?.phrase?.hindi || '');
  const [teacherTranslatedResult, setTeacherTranslatedResult] = useState<string | null>(activeLiveClassPreset?.phrase?.translatedText || null);
  const [teacherPronunciation, setTeacherPronunciation] = useState<string | null>(activeLiveClassPreset?.phrase?.pronunciation || null);
  const [teacherAudioUrl, setTeacherAudioUrl] = useState<string | null>(activeLiveClassPreset?.phrase?.audioUrl || null);
  const [teacherTranslationNote, setTeacherTranslationNote] = useState<string>(activeLiveClassPreset?.phrase?.statusNote || '');
  const [isTeacherVerified, setIsTeacherVerified] = useState<boolean>(activeLiveClassPreset?.phrase?.isVerified ?? true);
  const [teacherResourceId, setTeacherResourceId] = useState<string | null>(activeLiveClassPreset?.phrase?.resourceId || null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Speech Recognition hook for Hindi voice input
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);
  const [voiceResponseLatencyMs, setVoiceResponseLatencyMs] = useState<number | null>(null);
  const speechEndedAtRef = useRef<number | null>(null);

  const {
    isSupported: isMicSupported,
    status: micStatus,
    toggleListening: toggleSpeechMic,
    stopListening: stopSpeechMic
  } = useSpeechRecognition({
    lang: 'hi-IN',
    onTranscript: (transcript, isFinal) => {
      setTeacherHindiInput(transcript);
      if (isFinal) {
        speechEndedAtRef.current = performance.now();
        void handleTeacherTranslate(transcript, true);
        setMicStatusMsg(null);
      }
    },
    onError: (friendlyMsg) => {
      setMicStatusMsg(friendlyMsg);
    }
  });

  // Student Input State
  const [studentInput, setStudentInput] = useState('');
  const [studentTranslatedResult, setStudentTranslatedResult] = useState<string | null>(null);
  const [studentObservations, setStudentObservations] = useState<StudentObservation[]>([]);
  const [teacherNote, setTeacherNote] = useState('');

  // Session Summary Modal State
  const [completedSession, setCompletedSession] = useState<ClassroomSession | null>(null);
  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Auto-fill preset if arrived via "Start Live Class" from lesson
  useEffect(() => {
    if (activeLiveClassPreset) {
      setSelectedGrade(activeLiveClassPreset.grade);
      setSelectedSubject(activeLiveClassPreset.subject);
      setSelectedTopic(activeLiveClassPreset.topic);
      if (activeLiveClassPreset.phrase) {
        setSelectedLanguage(activeLiveClassPreset.phrase.language);
        setTeacherHindiInput(activeLiveClassPreset.phrase.hindi);
        setTeacherTranslatedResult(activeLiveClassPreset.phrase.translatedText);
        setTeacherResourceId(activeLiveClassPreset.phrase.resourceId || null);
        setTeacherPronunciation(activeLiveClassPreset.phrase.pronunciation || null);
        setTeacherAudioUrl(activeLiveClassPreset.phrase.audioUrl || null);
        setTeacherTranslationNote(activeLiveClassPreset.phrase.statusNote);
        setIsTeacherVerified(activeLiveClassPreset.phrase.isVerified);
      }
    }
  }, [activeLiveClassPreset]);

  // Session Timer
  useEffect(() => {
    let interval: any = null;
    if (inClass && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inClass, isPaused]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartClass = () => {
    setInClass(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setSessionStartTime(new Date().toISOString());
    setExchanges([]);
    setStudentObservations([]);
    setTeacherNote('');
    if (!activeLiveClassPreset?.phrase) {
      setTeacherHindiInput('');
      setTeacherTranslatedResult(null);
      setTeacherResourceId(null);
      setTeacherPronunciation(null);
      setTeacherAudioUrl(null);
      setTeacherTranslationNote('');
    }
    setStudentInput('');
    setStudentTranslatedResult(null);
    setCompletedSession(null);
    showToast(`Live Class started: ${selectedGrade} - ${selectedTopic}`);
  };

  const handleTeacherTranslate = async (textToTranslate?: string, fromVoice = false) => {
    const query =
      textToTranslate !== undefined
        ? textToTranslate
        : teacherHindiInput;

    if (!query.trim()) return;

    try {
      const result = await translateTextWithBackend(
        query.trim(),
        'hi',
        normalizeLanguageCode(selectedLanguage)
      );

      if (result.found) {
        setTeacherTranslatedResult(result.translatedText);
        setTeacherResourceId(result.matchedEntry?.id || null);
        setTeacherPronunciation(result.phonetic || null);
        setTeacherAudioUrl(result.audioUrl || null);
        setTeacherTranslationNote(result.statusNote);
        setIsTeacherVerified(result.isVerified);

        if (fromVoice) {
          const audioResult = playAudio(result.translatedText, normalizeLanguageCode(selectedLanguage), {
            rate: 0.82,
            audioUrl: result.audioUrl
          });
          if (speechEndedAtRef.current !== null) {
            setVoiceResponseLatencyMs(Math.round(performance.now() - speechEndedAtRef.current));
            speechEndedAtRef.current = null;
          }
          if (!audioResult.success) setMicStatusMsg(audioResult.message);
        }
      } else {
        setTeacherTranslatedResult(null);
        setTeacherResourceId(null);
        setTeacherPronunciation(null);
        setTeacherAudioUrl(null);
        setTeacherTranslationNote(result.statusNote);
        setIsTeacherVerified(false);
        if (fromVoice) {
          setVoiceResponseLatencyMs(null);
          speechEndedAtRef.current = null;
        }
      }
    } catch (error) {
      console.error('Teacher translation failed:', error);

      setTeacherTranslatedResult(null);
      setTeacherResourceId(null);
      setTeacherPronunciation(null);
      setTeacherAudioUrl(null);
      setTeacherTranslationNote(
        'Translation unavailable. Please try again.'
      );
      setIsTeacherVerified(false);
      if (fromVoice) {
        setVoiceResponseLatencyMs(null);
        speechEndedAtRef.current = null;
      }
    }
  };

  const handleSendTeacherExchange = () => {
    if (!teacherHindiInput.trim()) return;

    const translation = teacherTranslatedResult || 'Translation unavailable. Use a verified local phrase or connected service.';
    const newExchange: ClassroomExchange = {
      id: `ex-${Date.now()}`,
      speaker: 'teacher',
      text: teacherHindiInput.trim(),
      translatedText: translation,
      direction: 'hi-to-sat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVerified: isTeacherVerified
    };

    setExchanges((prev) => [...prev, newExchange]);

    // Record into global translation history if translated successfully
    if (teacherTranslatedResult) {
      addTranslationRecord({
        sourceLanguage: 'Hindi',
        targetLanguage: selectedLanguage,
        sourceText: teacherHindiInput.trim(),
        translatedText: teacherTranslatedResult,
        isVerified: isTeacherVerified,
        statusNote: teacherTranslationNote,
        resourceId: teacherResourceId || undefined
      });
    }

    setTeacherHindiInput('');
    setTeacherTranslatedResult(null);
    setTeacherPronunciation(null);
    setTeacherTranslationNote('');
  };

  const recordStudentObservation = (status: StudentObservationStatus) => {
    if (!teacherHindiInput.trim()) return;
    const observation: StudentObservation = {
      id: `obs-${Date.now()}`,
      status,
      resourceId: teacherResourceId || undefined,
      phraseHindi: teacherHindiInput.trim(),
      activity: getStudentActivity(teacherHindiInput),
      recordedAt: new Date().toISOString()
    };
    setStudentObservations((current) => [...current, observation]);
    showToast('Student observation saved to this class.', 'success');
  };

  const handleSendStudentExchange = async (
    simulatedSanthaliText?: string
  ) => {
    const textToSend =
      simulatedSanthaliText || studentInput;

    if (!textToSend.trim()) return;

    try {
      const result = await translateTextWithBackend(
        textToSend.trim(),
        normalizeLanguageCode(selectedLanguage),
        'hi'
      );

      const translated = result.found
        ? result.translatedText
        : 'Translation unavailable for this student phrase.';

      const newExchange: ClassroomExchange = {
        id: `ex-${Date.now()}`,
        speaker: 'student',
        text: textToSend.trim(),
        translatedText: translated,
        direction: 'sat-to-hi',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isVerified: result.isVerified
      };

      setExchanges((prev) => [
        ...prev,
        newExchange
      ]);

      if (result.found) {
        addTranslationRecord({
          sourceLanguage: selectedLanguage,
          targetLanguage: 'Hindi',
          sourceText: textToSend.trim(),
          translatedText: translated,
          isVerified: result.isVerified,
          statusNote:
            result.statusNote ||
            'Student classroom dialogue response'
        });
      }

      setStudentInput('');
      setStudentTranslatedResult(null);

    } catch (error) {
      console.error(
        'Student translation failed:',
        error
      );

      showToast(
        'Student translation failed',
        'warning'
      );
    }
  };

  const handleEndClass = () => {
    const endedAt = new Date().toISOString();
    const teacherPromptsCount = exchanges.filter((e) => e.speaker === 'teacher').length;
    const studentResponsesCount = exchanges.filter((e) => e.speaker === 'student').length;
    const translationCount = exchanges.length;

    // Calculate honest comprehension indicator based on student responses & duration
    let comprehension: 'High' | 'Moderate' | 'Needs Simplification' = 'Moderate';
    if (studentResponsesCount >= 3) {
      comprehension = 'High';
    } else if (studentResponsesCount === 0 && teacherPromptsCount > 2) {
      comprehension = 'Needs Simplification';
    }

    const sessionData: ClassroomSession = {
      id: `ses-${Date.now()}`,
      grade: selectedGrade,
      subject: selectedSubject,
      topic: selectedTopic,
      language: selectedLanguage,
      startedAt: sessionStartTime,
      endedAt,
      durationSeconds: Math.max(elapsedSeconds, 45), // Honest count
      exchanges,
      translationCount,
      teacherPromptsCount,
      studentResponsesCount,
      comprehension,
      suggestedNextAction:
        comprehension === 'Needs Simplification'
          ? 'Provide visual concrete counters (seeds/pebbles) and simpler mother-tongue phrases.'
          : 'Reinforce learning with a child-friendly printable worksheet.',
      createdAt: endedAt,
      observations: studentObservations,
      teacherNote: teacherNote.trim() || undefined
    };

    stopSpeechMic();
    stopAllAudio();
    saveClassroomSession(sessionData);
    setCompletedSession(sessionData);
    setInClass(false);
    clearLiveClassPreset();
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handlePlayAudio = (text: string, lang: 'hi' | 'sat', audioUrl?: string | null) => {
    if (!text) return;
    const result = lang === 'hi'
      ? playHindiAudio(text)
      : playAudio(text, normalizeLanguageCode(selectedLanguage), { rate: 0.82, audioUrl: audioUrl || undefined });
    if (!result.success) {
      showToast(result.message, 'warning');
    }
  };

  const toggleMic = () => {
    setMicStatusMsg(null);
    if (!isMicSupported) {
      setMicStatusMsg("Voice input isn't supported in this browser. You can type Hindi text.");
      return;
    }
    toggleSpeechMic('hi-IN');
  };

  const getStudentActivity = (hindi: string) => {
    const resourceItem = getLanguageResource(selectedLanguage).classroomPhrases.find((item) => normalizePhrase(item.hindi) === normalizePhrase(hindi));
    if (resourceItem?.activity) return `${resourceItem.activity.icon} ${resourceItem.activity.label}`;
    if (hindi.includes('गिनो') || hindi.includes('गिनती')) return '🔢 Count classroom objects';
    if (hindi.includes('लिखो') || hindi.includes('अक्षर')) return '✏️ Write or trace';
    if (hindi.includes('देखो')) return '👀 Look at the board or visual';
    if (hindi.includes('सुनो')) return '👂 Listen and repeat';
    return '🤝 Respond with the teacher';
  };

  // -------------------------------------------------------------
  // 1. SETUP SCREEN (When not in class)
  // -------------------------------------------------------------
  if (!inClass && !completedSession) {
    return (
      <div id="classroom-setup-screen" className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              Live Interactive Classroom Assistant
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Classroom Session Setup
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Select grade, foundational subject, and tribal language bridge to begin teaching.
            </p>
          </div>

          {/* Grade Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Select Grade
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] as GradeLevel[]).map(
                (grade) => (
                  <button
                    key={grade}
                    id={`setup-grade-${grade.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setSelectedGrade(grade)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      selectedGrade === grade
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {grade}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Subject Area Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Subject Area (FLN)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['Foundational Literacy', 'Foundational Numeracy'] as SubjectArea[]).map(
                (subject) => (
                  <button
                    key={subject}
                    id={`setup-subject-${subject.includes('Literacy') ? 'lit' : 'num'}`}
                    onClick={() => setSelectedSubject(subject)}
                    className={`p-3.5 rounded-xl border text-left font-medium transition-all ${
                      selectedSubject === subject
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-sm font-bold">{subject}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {subject === 'Foundational Literacy'
                        ? 'Letters, sounds, storytelling & oral expression'
                        : 'Numbers, counting, shapes & concrete operations'}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Topic Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Classroom Topic
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOPIC_PRESETS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    selectedTopic === topic
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
            <div className="pt-1">
              <input
                id="custom-topic-input"
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="Or type custom classroom topic..."
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Target Tribal Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Target Mother Tongue Bridge
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Santhali */}
              <button
                id="setup-lang-santhali"
                onClick={() => setSelectedLanguage('Santhali')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedLanguage === 'Santhali'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Santhali (ᱥᱟᱱᱛᱟᱲᱤ)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
                    Offline core
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Script: {TRIBAL_LANGUAGE_PROFILES.Santhali.script}. Verified classroom phrase pack active.
                </p>
              </button>

              <button
                id="setup-lang-ho"
                onClick={() => setSelectedLanguage('Ho')}
                className={`p-3.5 rounded-xl border text-left transition-all ${selectedLanguage === 'Ho' ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Ho (ᱦᱳ)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {TRIBAL_LANGUAGE_STATUS.Ho.label}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Script: {TRIBAL_LANGUAGE_PROFILES.Ho.script}. {TRIBAL_LANGUAGE_STATUS.Ho.note}.
                </p>
              </button>

              <button
                id="setup-lang-mundari"
                onClick={() => setSelectedLanguage('Mundari')}
                className={`p-3.5 rounded-xl border text-left transition-all ${selectedLanguage === 'Mundari' ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Mundari (ᱢᱩᱱᱰᱟᱲᱤ)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {TRIBAL_LANGUAGE_STATUS.Mundari.label}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Script: {TRIBAL_LANGUAGE_PROFILES.Mundari.script}. {TRIBAL_LANGUAGE_STATUS.Mundari.note}.
                </p>
              </button>
            </div>
          </div>

          {activeLiveClassPreset?.phrase && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">✓ Verified phrase ready</span>
                <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">{activeLiveClassPreset.phrase.language}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Teacher</p><p className="mt-1 font-bold text-emerald-950">{activeLiveClassPreset.phrase.hindi}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{activeLiveClassPreset.phrase.language}</p><p className="mt-1 font-bold text-emerald-950">{activeLiveClassPreset.phrase.translatedText}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Pronunciation</p><p className="mt-1 font-semibold text-emerald-900">{activeLiveClassPreset.phrase.pronunciation || 'Not available'}</p></div>
              </div>
              <p className="mt-3 text-xs font-semibold text-emerald-800">Status: ✓ Verified classroom phrase</p>
            </div>
          )}

          {/* Start CTA */}
          <div className="pt-2">
            <button
              id="start-live-class-btn"
              onClick={handleStartClass}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Live Class ({selectedGrade} • {selectedTopic})</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. SESSION SUMMARY SCREEN (When class ended)
  // -------------------------------------------------------------
  if (completedSession) {
    return (
      <div id="classroom-summary-screen" className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 border-b border-stone-100 pb-5">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 mb-1">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Classroom Session Completed!
            </h2>
            <p className="text-sm text-stone-500">
              Session recorded into local shared storage. Learning Insights & Dashboard have been updated.
            </p>
          </div>

          {/* Session Overview Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-center">
            <div>
              <div className="text-xs text-stone-500">Duration</div>
              <div className="text-lg font-bold text-stone-900">
                {Math.floor(completedSession.durationSeconds / 60)}m {completedSession.durationSeconds % 60}s
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Teacher Prompts</div>
              <div className="text-lg font-bold text-indigo-700">
                {completedSession.teacherPromptsCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Student Responses</div>
              <div className="text-lg font-bold text-emerald-700">
                {completedSession.studentResponsesCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Comprehension</div>
              <div className="text-sm font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {completedSession.comprehension}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 text-xs text-stone-600">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="font-semibold text-stone-800">Topic:</span>
              <span>{completedSession.topic} ({completedSession.grade})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="font-semibold text-stone-800">Target Language:</span>
              <span>{completedSession.language} (PALASH MTB-MLE)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="font-semibold text-stone-800">Total Exchanges:</span>
              <span>{completedSession.translationCount} dialogue turns</span>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-1">
              <span className="font-bold text-indigo-900">Student observations</span>
              {completedSession.observations?.length ? (
                completedSession.observations.map((observation) => (
                  <div key={observation.id} className="flex items-center justify-between gap-3 text-indigo-800">
                    <span>{observation.phraseHindi}</span>
                    <span className="font-semibold">{observation.status.replaceAll('_', ' ')}</span>
                  </div>
                ))
              ) : (
                <p className="text-indigo-700">No observation recorded. Add one during the next classroom prompt.</p>
              )}
            </div>
            {completedSession.teacherNote && <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><span className="font-bold text-stone-800">Teacher note</span><p className="mt-1 text-stone-700">{completedSession.teacherNote}</p></div>}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Adaptive Teaching Recommendation:
              </span>
              <p className="text-amber-800 leading-relaxed">
                {completedSession.suggestedNextAction}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              id="summary-create-worksheet-btn"
              onClick={() => {
                createWorksheetFromLesson({
                  id: 'temp',
                  title: completedSession.topic,
                  grade: completedSession.grade,
                  subject: completedSession.subject,
                  topic: completedSession.topic,
                  difficulty: 'Beginner',
                  durationMinutes: 30,
                  localContext: 'Classroom practice',
                  objective: '',
                  materials: [],
                  warmUp: '',
                  teacherExplanation: '',
                  localContextExample: '',
                  classroomActivity: '',
                  practice: '',
                  assessment: '',
                  motherTongueSupport: { language: 'Santhali', keyPhrases: [] },
                  createdAt: '',
                  updatedAt: ''
                });
              }}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Create Worksheet for this Class</span>
            </button>

            <button
              id="summary-view-insights-btn"
              onClick={() => setActiveTab('learning-insights')}
              className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Learning Insights</span>
            </button>

            <button
              id="summary-continue-lessons-btn"
              onClick={() => setActiveTab('lessons')}
              className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Go to Lesson Library</span>
            </button>

            <button
              id="summary-back-dashboard-btn"
              onClick={() => {
                setCompletedSession(null);
                setActiveTab('dashboard');
              }}
              className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. ACTIVE CLASS EXPERIENCE
  // -------------------------------------------------------------
  return (
    <div id="live-classroom-active-screen" className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Top Banner: Topic, Timer, Status, Controls */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-semibold border border-slate-700">
                {selectedGrade}
              </span>
              <span className="text-xs text-slate-300 font-medium">{selectedSubject}</span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white mt-0.5">{selectedTopic}</h3>
            <p className="text-[11px] text-slate-400">Target Bridge: {selectedLanguage} • {TRIBAL_LANGUAGE_STATUS[selectedLanguage].local ? 'Offline Core Available' : 'Connected Service Required'}</p>
          </div>
        </div>

        {/* Timer & Session Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 font-mono text-sm font-bold border border-slate-700">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            id="pause-resume-class-btn"
            onClick={() => {
              setIsPaused(!isPaused);
              showToast(isPaused ? 'Class resumed' : 'Class paused', 'info');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            id="end-class-btn"
            onClick={handleEndClass}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-950/40 cursor-pointer"
          >
            <StopCircle className="w-4 h-4" />
            <span>End Class</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm text-xs">
        {[
          ['1', 'Teacher Hindi', 'Say or type the instruction'],
          ['2', selectedLanguage, 'Show the classroom phrase'],
          ['3', 'Student understanding', 'Check the response'],
          ['4', 'Learning activity', selectedTopic]
        ].map(([step, title, detail]) => (
          <div key={step} className="rounded-xl bg-stone-50 p-3 border border-stone-100">
            <span className="text-[10px] font-bold text-indigo-600">STEP {step}</span>
            <p className="mt-1 font-bold text-stone-900">{title}</p>
            <p className="mt-1 text-[11px] leading-snug text-stone-500">{detail}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Interaction Panel & Conversation Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col: Teacher & Student Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* TEACHER HINDI INPUT PANEL */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                Teacher Hindi Instruction (शिक्षक निर्देश)
              </span>
              <span className="text-[11px] text-stone-500">Hindi → {selectedLanguage}</span>
            </div>

            {/* Input field + Mic button */}
            <div className="relative">
              <textarea
                id="teacher-hindi-input"
                rows={2}
                value={teacherHindiInput}
                onChange={(e) => {
                  setTeacherHindiInput(e.target.value);
                  // Translate only when the teacher presses the Translate action.
                }}
                placeholder="यहाँ हिंदी में निर्देश टाइप करें (जैसे: 'बच्चों, इन वस्तुओं को गिनो')..."
                className="w-full text-sm p-3 pr-12 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-stone-800"
              />
              <button
                id="mic-speech-input-btn"
                type="button"
                onClick={toggleMic}
                title={
                  !isMicSupported
                    ? "Voice input isn't supported in this browser"
                    : micStatus === 'listening'
                    ? 'Stop microphone'
                    : micStatus === 'processing'
                    ? 'Processing speech...'
                    : 'Speak in Hindi'
                }
                className={`absolute right-2.5 top-2.5 p-2 rounded-lg transition-colors ${
                  micStatus === 'listening'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : micStatus === 'processing'
                    ? 'bg-amber-500 text-white'
                    : !isMicSupported
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                aria-label="Speech recognition toggle"
              >
                {micStatus === 'listening' ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {micStatusMsg && (
              <div
                id="classroom-mic-status-msg"
                className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/70 flex items-center justify-between"
              >
                <span>{micStatusMsg}</span>
                <button
                  type="button"
                  onClick={() => setMicStatusMsg(null)}
                  className="text-amber-600 hover:text-amber-900 ml-2 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Quick suggested prompt chips for this topic */}
            <div className="space-y-1">
              <span className="text-[11px] text-stone-400">Quick Classroom Prompts:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'बच्चों, इन वस्तुओं को गिनो',
                  'यहाँ देखो',
                  'ध्यान से सुनो',
                  'कितने आम हैं',
                  'बहुत अच्छा',
                  'शाबाश',
                  'किताब खोलो'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setTeacherHindiInput(prompt);
                      handleTeacherTranslate(prompt);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTeacherTranslate()}
              disabled={!teacherHindiInput.trim()}
              className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Translate to {selectedLanguage}
            </button>

            {voiceResponseLatencyMs !== null && (
              <div className={`rounded-xl border px-3 py-2 text-xs ${voiceResponseLatencyMs <= 3000 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                <span className="font-bold">Voice response: {(voiceResponseLatencyMs / 1000).toFixed(2)}s</span>
                <span className="ml-2">{voiceResponseLatencyMs <= 3000 ? 'Within the 3-second target.' : 'Above target; use a saved phrase or text mode.'}</span>
              </div>
            )}

            {/* Translation Output Card */}
            {teacherTranslatedResult ? (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">
                    {selectedLanguage} Translation:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 font-medium">
                    {isTeacherVerified ? 'Verified classroom phrase' : 'AI-assisted translation — verify'}
                  </span>
                </div>

                <div className="text-base font-bold text-emerald-950 leading-relaxed font-sans">
                  {teacherTranslatedResult}
                </div>

                {teacherPronunciation && (
                  <div className="border-t border-emerald-200/60 pt-2 text-xs text-emerald-900">
                    <span className="font-semibold">Pronunciation:</span> {teacherPronunciation}
                  </div>
                )}

                <p className="text-[11px] text-emerald-800">{teacherTranslationNote}</p>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-950">
                  <p className="font-bold">Student Understanding</p>
                  <p className="mt-1 text-[11px] text-indigo-700">Watch for the learner to respond to the translated instruction.</p>
                  <p className="mt-3 font-bold">Learning Activity</p>
                  <p className="mt-1 text-sm font-semibold">{getStudentActivity(teacherHindiInput)}</p>
                  <p className="mt-1 text-[11px] text-indigo-700">Use the phrase, then look for this simple classroom response.</p>
                  <p className="mt-3 font-bold">Record observation</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {([
                      ['understood', 'Understood'],
                      ['needs_repetition', 'Needs repetition'],
                      ['needs_visual_support', 'Needs visual'],
                      ['needs_mother_tongue', 'Needs mother tongue'],
                      ['mastered', 'Mastered']
                    ] as const).map(([status, label]) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => recordStudentObservation(status)}
                        className="rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-indigo-800 hover:bg-indigo-100"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {studentObservations.length > 0 && (
                    <p className="mt-2 text-[10px] text-indigo-700">{studentObservations.length} observation{studentObservations.length === 1 ? '' : 's'} saved for this session.</p>
                  )}
                  <label className="mt-3 block text-[11px] font-semibold text-indigo-900">Optional teacher note
                    <textarea value={teacherNote} onChange={(event) => setTeacherNote(event.target.value)} maxLength={280} rows={2} placeholder="Students understood after repeating twice." className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-xs font-normal text-stone-800" />
                  </label>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <div className="flex items-center gap-2">
                    <button
                      id="listen-teacher-translation-btn"
                      onClick={() => handlePlayAudio(teacherTranslatedResult, 'sat', teacherAudioUrl)}
                      disabled={!isAudioAvailable(normalizeLanguageCode(selectedLanguage), teacherAudioUrl || undefined)}
                      title={isAudioAvailable(normalizeLanguageCode(selectedLanguage), teacherAudioUrl || undefined) ? getAudioStatus(normalizeLanguageCode(selectedLanguage), teacherAudioUrl || undefined).reason : `Audio preview unavailable for ${selectedLanguage}`}
                      aria-label={isAudioAvailable(normalizeLanguageCode(selectedLanguage), teacherAudioUrl || undefined) ? `Play audio preview in ${selectedLanguage}` : `Audio unavailable for ${selectedLanguage}`}
                      className="inline-flex items-center gap-1 text-xs text-emerald-800 font-medium px-2 py-1 rounded bg-white/70 hover:bg-white transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAudioAvailable(normalizeLanguageCode(selectedLanguage), teacherAudioUrl || undefined) ? 'Play audio preview' : 'Audio unavailable'}</span>
                    </button>

                    <button
                      id="copy-teacher-translation-btn"
                      onClick={() => handleCopy(teacherTranslatedResult)}
                      className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-950 font-medium px-2 py-1 rounded bg-white/70 hover:bg-white transition-colors"
                    >
                      {copiedText === teacherTranslatedResult ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <button
                    id="send-teacher-prompt-btn"
                    onClick={handleSendTeacherExchange}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Add to Class Dialogue</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : teacherHindiInput.trim() ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">
                  Translation unavailable for this phrase.
                </p>
                <p className="text-amber-800 text-[11px]">
                  Click any of the suggested classroom prompts above to test the selected mother-tongue bridge.
                </p>
                <button
                  onClick={handleSendTeacherExchange}
                  className="mt-1 px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-medium"
                >
                  Record Hindi prompt only
                </button>
              </div>
            ) : null}
          </div>

          {/* STUDENT SIMULATED RESPONSE PANEL */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                Student Response Area (छात्र उत्तर)
              </span>
              <span className="text-[11px] text-stone-500">{selectedLanguage} → Hindi Bridge</span>
            </div>

            <p className="text-xs text-stone-500">
              Select or type a student's {selectedLanguage} oral response to see reverse translation back to Hindi:
            </p>

            {selectedLanguage === 'Santhali' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STUDENT_SIMULATION_RESPONSES.map((resp, idx) => (
                  <button
                    key={idx}
                    id={`student-resp-btn-${idx}`}
                    onClick={() => handleSendStudentExchange(resp.santhali)}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all text-xs"
                  >
                    <div className="font-bold text-stone-900 truncate">{resp.label}</div>
                    <div className="text-[11px] text-emerald-700 truncate mt-0.5 font-sans">
                      {resp.santhali}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                No verified {selectedLanguage} student-response samples are bundled. Enter a response manually or use the connected service.
              </div>
            )}

            {/* Custom Student input */}
            <div className="flex gap-2 pt-1">
              <input
                id="custom-student-input"
                type="text"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder={`Or type student's ${selectedLanguage} words...`}
                className="flex-1 text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                id="send-student-custom-btn"
                onClick={() => handleSendStudentExchange()}
                disabled={!studentInput.trim()}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Conversation Timeline (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden h-[540px]">
          <div className="p-4 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                Live Classroom Dialogue
              </span>
              <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full font-semibold text-stone-700">
                {exchanges.length}
              </span>
            </div>
            <span className="text-[11px] text-stone-400">Real-time log</span>
          </div>

          <div
            id="classroom-timeline-list"
            className="flex-1 p-4 overflow-y-auto space-y-3 divide-y divide-stone-100/60"
          >
            {exchanges.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <Radio className="w-8 h-8 text-stone-300 mb-2 animate-pulse" />
                <p className="text-xs font-medium text-stone-600">No dialogue recorded yet.</p>
                <p className="text-[11px] text-stone-400 mt-1 max-w-xs">
                  Type a Hindi teacher instruction or click a student response chip on the left to begin the session.
                </p>
              </div>
            ) : (
              exchanges.map((ex) => (
                <div key={ex.id} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ex.speaker === 'teacher'
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {ex.speaker === 'teacher' ? '👨‍🏫 Teacher (शिक्षक)' : '🧒 Student (छात्र)'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{ex.timestamp}</span>
                  </div>

                  <div className="font-medium text-stone-900 pl-1">{ex.text}</div>

                  <div
                    className={`p-2 rounded-lg text-xs font-sans flex items-start justify-between gap-2 ${
                      ex.speaker === 'teacher'
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-100'
                        : 'bg-indigo-50 text-indigo-950 border border-indigo-100'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-stone-500 block">
                        {ex.direction === 'hi-to-sat' ? `↳ ${selectedLanguage}:` : '↳ Hindi Meaning:'}
                      </span>
                      <span className="font-semibold">{ex.translatedText}</span>
                    </div>

                    <button
                      onClick={() => handlePlayAudio(ex.translatedText, ex.direction === 'hi-to-sat' ? 'sat' : 'hi')}
                      disabled={ex.direction === 'hi-to-sat' ? !isAudioAvailable(normalizeLanguageCode(selectedLanguage)) : !isAudioAvailable('hi-IN')}
                      title={
                        ex.direction === 'hi-to-sat'
                          ? `Play ${selectedLanguage} voice preview`
                          : 'Listen to Hindi audio (hi-IN)'
                      }
                      aria-label={
                        ex.direction === 'hi-to-sat'
                          ? `Play ${selectedLanguage} voice preview`
                          : 'Listen to Hindi audio'
                      }
                      className={`p-1 rounded ${
                        ex.direction === 'hi-to-sat' && !isAudioAvailable(normalizeLanguageCode(selectedLanguage))
                          ? 'text-stone-300 cursor-not-allowed opacity-50'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-stone-50 border-t border-stone-100 text-center">
            <button
              id="end-class-bottom-btn"
              onClick={handleEndClass}
              className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Complete Class Session & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


