/// <reference types="react" />

import React, { useState, useEffect } from 'react';
import type { JSX as ReactJSX } from 'react';

import { useApp } from '../../context/AppContext';

import { getLanguageResource, searchLanguageResources } from '../../data/languageResources';
import { recordRecentResource } from '../../utils/recentResources';

import {
  playHindiAudio,
  playAudio,
  isAudioAvailable,
  stopAllAudio
} from '../../services/audioService';

import {
  languageDisplayName,
  translateTextWithBackend
} from '../../services/translationService';
import { LanguageResourceItem, TRIBAL_LANGUAGE_PROFILES, VerificationStatus } from '../../types';

import { useSpeechRecognition } from '../../utils/useSpeechRecognition';

import {
  ArrowLeftRight,
  Volume2,
  Copy,
  Check,
  Search,
  History,
  Trash2,
  CornerDownRight,
  Info,
  Mic,
  MicOff
} from 'lucide-react';

/*
 * React 19 JSX type compatibility.
 *
 * The project uses React's JSX namespace, while the editor
 * is currently looking for the global JSX.IntrinsicElements.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

const CATEGORIES: string[] = [
  'Greetings',
  'Classroom Management',
  'Foundational Literacy',
  'Foundational Numeracy',
  'Activities',
  'Assessment',
  'Encouragement',
  'Objects',
  'Numbers'
];

export const TranslatorView: React.FC = () => {
  const {
    translationHistory,
    addTranslationRecord,
    deleteTranslationRecord,
    showToast,
    setActiveTab,
    settings
  } = useApp();

  const [direction, setDirection] =
    useState<'hi-to-sat' | 'sat-to-hi'>('hi-to-sat');

  const [targetLanguage, setTargetLanguage] =
    useState<'sat' | 'ho' | 'unr'>('sat');

  const [inputText, setInputText] = useState('');

  const [translatedResult, setTranslatedResult] =
    useState<string | null>(null);

  const [translationNote, setTranslationNote] =
    useState<string>('');

  const [isVerified, setIsVerified] =
    useState<boolean>(false);

  const [translationStatus, setTranslationStatus] =
    useState<VerificationStatus>('unavailable');

  const [translationSource, setTranslationSource] =
    useState<string>('No verified local resource available');

  const [hasAttemptedTranslate, setHasAttemptedTranslate] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [micNotice, setMicNotice] =
    useState<string | null>(null);

  const [isTranslating, setIsTranslating] =
    useState(false);

  const [translationLatencyMs, setTranslationLatencyMs] =
    useState<number | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<string>('Greetings');

  const [phraseSearch, setPhraseSearch] =
    useState('');

  const {
    isSupported: isSpeechRecSupported,
    status: speechStatus,
    stopListening,
    toggleListening
  } = useSpeechRecognition({
    lang: 'hi-IN',

    onTranscript: (transcript, isFinal) => {
      setInputText(transcript);

      if (isFinal) {
        setMicNotice(null);
      }
    },

    onError: (friendlyMsg) => {
      setMicNotice(friendlyMsg);
    }
  });

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleMicToggle = () => {
    setMicNotice(null);

    if (direction === 'sat-to-hi') {
      setMicNotice(
        'Tribal-language voice input will be available when the language service is connected. Text input is active.'
      );
      return;
    }

    if (!isSpeechRecSupported) {
      setMicNotice(
        "Voice input isn't supported in this browser. You can type your message instead."
      );
      return;
    }

    toggleListening('hi-IN');
  };

  const handleSwap = () => {
    stopListening();
    stopAllAudio();

    setMicNotice(null);

    setDirection((prev) =>
      prev === 'hi-to-sat' ? 'sat-to-hi' : 'hi-to-sat'
    );

    setInputText(translatedResult || '');
    setTranslatedResult(null);
    setTranslationNote('');
    setHasAttemptedTranslate(false);
    setIsVerified(false);
    setTranslationStatus('unavailable');
    setTranslationSource('No verified local resource available');
  };

  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) {
      return;
    }

    setHasAttemptedTranslate(true);
    setIsTranslating(true);
    setTranslatedResult(null);
    setTranslationNote('');
    setIsVerified(false);
    setTranslationStatus('unavailable');
    setTranslationSource('No verified local resource available');
    const startedAt = performance.now();

    const fromLang =
      direction === 'hi-to-sat' ? 'hi' : targetLanguage;

    const toLang =
      direction === 'hi-to-sat' ? targetLanguage : 'hi';

    try {
      const res = await translateTextWithBackend(
        inputText.trim(),
        fromLang,
        toLang
      );

      if (res.found && res.translatedText) {
        setTranslatedResult(res.translatedText);
        setTranslationNote(res.statusNote);
        setIsVerified(res.isVerified);
        setTranslationStatus(res.verificationStatus || (res.isVerified ? 'verified' : 'ai_assisted'));
        setTranslationSource(res.source || 'Connected language service');
        if (res.matchedEntry) recordRecentResource(res.matchedEntry.id);

        addTranslationRecord({
          sourceLanguage:
            direction === 'hi-to-sat'
              ? 'Hindi'
              : languageDisplayName(targetLanguage),

          targetLanguage:
            direction === 'hi-to-sat'
              ? languageDisplayName(targetLanguage)
              : 'Hindi',

          sourceText: inputText.trim(),
          translatedText: res.translatedText,
          isVerified: res.isVerified,
          statusNote: res.statusNote,
          verificationStatus: res.verificationStatus,
          source: res.source,
          script: res.script,
          resourceId: res.matchedEntry?.id
        });

        showToast(
          `Translated with ${res.provider}`,
          'success'
        );
      } else {
        setTranslatedResult(null);
        setTranslationNote(res.statusNote);
        setIsVerified(false);
        setTranslationStatus(res.verificationStatus || 'unavailable');
        setTranslationSource(res.source || 'No verified local resource available');
      }
    } catch (error) {
      console.error('Translation failed:', error);

      setTranslatedResult(null);

      setTranslationNote(
        'Translation unavailable. Please try again or use a supported classroom phrase.'
      );

      setIsVerified(false);
      setTranslationStatus('unavailable');
      setTranslationSource('Connected service unavailable');

      showToast(
        'Translation failed',
        'warning'
      );
    } finally {
      setTranslationLatencyMs(Math.round(performance.now() - startedAt));
      setIsTranslating(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedResult(null);
    setTranslationNote('');
    setHasAttemptedTranslate(false);
    setIsVerified(false);
    setTranslationStatus('unavailable');
    setTranslationSource('No verified local resource available');
  };

  const handleCopy = (text: string) => {
    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text);

    setCopied(true);

    showToast('Copied to clipboard');

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleListen = (text: string) => {
    if (!text) {
      return;
    }

    const result = direction === 'hi-to-sat'
      ? playAudio(text, targetLanguage)
      : playHindiAudio(text);

    showToast(
      result.message,
      result.success ? 'info' : 'warning'
    );
  };

  const handleUsePhrase = (
    entry: LanguageResourceItem
  ) => {
    if (direction === 'hi-to-sat') {
      const translated = `${entry.translation}${entry.pronunciation ? ` (${entry.pronunciation})` : ''}`;

      const note =
        entry.verificationStatus === 'verified'
          ? 'Verified PALASH MTB-MLE classroom vocabulary'
          : 'Sample translation — verify with native speaker';

      setInputText(entry.hindi);
      recordRecentResource(entry.id);
      setTranslatedResult(translated);
      setTranslationNote(note);
      setIsVerified(entry.verificationStatus === 'verified');
      setHasAttemptedTranslate(true);

      addTranslationRecord({
        sourceLanguage: 'Hindi',
        targetLanguage: languageDisplayName(targetLanguage),
        sourceText: entry.hindi,
        translatedText: translated,
        isVerified: entry.verificationStatus === 'verified',
        statusNote: note,
        verificationStatus: entry.verificationStatus,
        source: entry.source.name,
        script: entry.script,
        resourceId: entry.id
      });
    } else {
      const note =
        entry.verificationStatus === 'verified'
          ? 'Verified PALASH MTB-MLE classroom vocabulary'
          : 'Sample translation — verify with native speaker';

      setInputText(entry.translation);
      recordRecentResource(entry.id);
      setTranslatedResult(entry.hindi);
      setTranslationNote(note);
      setIsVerified(entry.verificationStatus === 'verified');
      setHasAttemptedTranslate(true);

      addTranslationRecord({
        sourceLanguage: languageDisplayName(targetLanguage),
        targetLanguage: 'Hindi',
        sourceText: entry.translation,
        translatedText: entry.hindi,
        isVerified: entry.verificationStatus === 'verified',
        statusNote: note,
        verificationStatus: entry.verificationStatus,
        source: entry.source.name,
        script: entry.script,
        resourceId: entry.id
      });
    }
  };

  const selectedResourceLanguage = targetLanguage === 'sat'
    ? 'Santhali'
    : targetLanguage === 'ho'
      ? 'Ho'
      : 'Mundari';
  const filteredPhrases = (phraseSearch.trim()
    ? searchLanguageResources(phraseSearch, selectedResourceLanguage)
    : getLanguageResource(selectedResourceLanguage).classroomPhrases
  ).filter((entry) => entry.category === selectedCategory);

  const selectedProfile = targetLanguage === 'sat'
    ? TRIBAL_LANGUAGE_PROFILES.Santhali
    : targetLanguage === 'ho'
      ? TRIBAL_LANGUAGE_PROFILES.Ho
      : TRIBAL_LANGUAGE_PROFILES.Mundari;

  return (
    <div
      id="translator-view"
      className="max-w-6xl mx-auto space-y-6 pb-12"
    >

      {/* Linguistic Honesty Notice */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">

        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />

        <div>

          <span className="font-bold text-amber-950">
            Language support and PALASH context:
          </span>{' '}

          This suite supports Hindi bridges for Santhali, Ho, and Mundari in
          primary school classrooms across Jharkhand. Santhali remains fully
          supported locally, Ho has a curated offline vocabulary core, and
          Mundari has a local grammar core with lexical coverage still limited.
          Phrases are marked as{' '}

          <strong className="text-emerald-800">
            Verified
          </strong>{' '}

          (curriculum aligned) or{' '}

          <strong className="text-amber-800">
            Demo/sample
          </strong>.

          We do not make false claims of universal real-time AI translation
          accuracy.

        </div>
      </div>

      {/* Capability panel keeps local and connected language support visible. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-800">Offline engine</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-sm font-bold text-emerald-950">{settings.offlineMode ? 'Ready on this tablet' : 'Local fallback ready'}</p>
          <p className="mt-1 text-[11px] text-emerald-800/75">{selectedProfile.resourceNote}</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-indigo-800">Response target</span>
          <p className="mt-2 text-sm font-bold text-indigo-950">
            {translationLatencyMs === null ? 'Measure first response' : `${translationLatencyMs} ms last response`}
          </p>
            <p className="mt-1 text-[11px] text-indigo-800/75">
              {translationLatencyMs === null
                ? 'Translate a phrase to measure this device.'
                : translationLatencyMs <= 3000
                  ? 'Within the 3-second classroom response target.'
                  : 'Above target; use the local offline phrase pack.'}
            </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-amber-800">NIPUN output</span>
            <p className="mt-2 text-sm font-bold text-amber-950">Turn a prompt into practice</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('worksheets')}
            className="self-start rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
          >
            Create bilingual worksheet
          </button>
        </div>
      </div>

      {/* Main Translator */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">

        {/* Language Header */}
        <div className="p-4 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">

          <div className="flex items-center gap-3 font-semibold text-sm text-stone-800">

            <span
              className={`px-3 py-1.5 rounded-xl border ${
                direction === 'hi-to-sat'
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-stone-300 text-stone-700'
              }`}
            >
              Hindi (हिंदी)
            </span>

            <button
              id="translator-swap-btn"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors shadow-2xs"
              title="Swap Languages"
              aria-label="Swap translation direction"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <span
              className={`px-3 py-1.5 rounded-xl border ${
                direction === 'sat-to-hi'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-white border-stone-300 text-stone-700'
              }`}
            >
              {direction === 'hi-to-sat'
                ? languageDisplayName(targetLanguage)
                : 'Hindi (हिंदी)'}
            </span>

            {direction === 'hi-to-sat' && (
              <select
                id="translator-target-language"
                value={targetLanguage}
                onChange={(event) => setTargetLanguage(event.target.value as 'sat' | 'ho' | 'unr')}
                className="px-2 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700"
                aria-label="Target tribal language"
              >
                <option value="sat">Santhali · Ol Chiki</option>
                <option value="ho">Ho · Offline core</option>
                <option value="unr">Mundari · Offline core</option>
              </select>
            )}

            {direction === 'hi-to-sat' && (
              <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-600">
                <span className="font-bold text-stone-800">{selectedProfile.script}</span>
                <span className="mx-1.5 text-stone-400">·</span>
                {selectedProfile.scriptNote} {selectedProfile.resourceLabel}.
              </div>
            )}

          </div>

          <div className="text-xs text-stone-500 hidden sm:block">
            {direction === 'hi-to-sat'
              ? 'Teaching Prompt Bridge'
              : 'Student Dialogue Bridge'}
          </div>

        </div>

        {/* Translation Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">

          {/* Input */}
          <div className="p-5 space-y-4 flex flex-col justify-between">

            <div className="space-y-2">

              <div className="flex items-center justify-between text-xs text-stone-500">

                <span className="font-semibold text-stone-700">
                  {direction === 'hi-to-sat'
                    ? 'Hindi Input'
                    : `${languageDisplayName(targetLanguage)} Input`}
                </span>

                <div className="flex items-center gap-2">

                  {speechStatus === 'listening' && (
                    <span className="text-rose-600 font-semibold text-[11px] animate-pulse">
                      Listening...
                    </span>
                  )}

                  {speechStatus === 'processing' && (
                    <span className="text-amber-600 font-semibold text-[11px]">
                      Processing...
                    </span>
                  )}

                  <span>
                    {inputText.length} characters
                  </span>

                </div>

              </div>

              <div className="relative">

                <textarea
                  id="translator-input-area"
                  rows={5}
                  value={inputText}
                  onChange={(event) =>
                    setInputText(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      (event.ctrlKey || event.metaKey)
                    ) {
                      handleTranslate();
                    }
                  }}
                  placeholder={
                    direction === 'hi-to-sat'
                      ? "कक्षा का निर्देश लिखें (जैसे: 'बच्चों, बैठ जाओ', 'कितने आम हैं', 'बहुत अच्छा')..."
                      : "ᱥᱟᱱᱛᱟᱲᱤ ᱟᱹᱲᱟᱹ ᱚᱞ ᱢᱮ (e.g. 'Johar', 'Mit', 'Peya ul menaq-a')..."
                  }
                  className="w-full text-base p-3.5 pr-12 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-stone-900"
                />

                <button
                  id="translator-mic-btn"
                  type="button"
                  onClick={handleMicToggle}
                  title={
                    direction === 'sat-to-hi'
                      ? `${languageDisplayName(targetLanguage)} voice input is not available in this browser`
                      : !isSpeechRecSupported
                        ? "Voice input isn't supported in this browser"
                        : speechStatus === 'listening'
                          ? 'Stop microphone'
                          : speechStatus === 'processing'
                            ? 'Processing speech...'
                            : 'Speak in Hindi'
                  }
                  className={`absolute right-2.5 top-2.5 p-2 rounded-lg transition-colors ${
                    speechStatus === 'listening'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : speechStatus === 'processing'
                        ? 'bg-amber-500 text-white'
                        : !isSpeechRecSupported
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  aria-label="Toggle speech recognition"
                >
                  {speechStatus === 'listening' ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

              </div>

              {micNotice && (
                <div
                  id="translator-mic-status-msg"
                  className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/70 flex items-center justify-between"
                >

                  <span>
                    {micNotice}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setMicNotice(null)
                    }
                    className="text-amber-600 hover:text-amber-900 ml-2 font-bold"
                  >
                    ×
                  </button>

                </div>
              )}

            </div>

            <div className="flex items-center justify-between pt-2">

              <button
                id="translator-clear-btn"
                onClick={handleClear}
                disabled={!inputText}
                className="px-3 py-1.5 rounded-xl text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30"
              >
                Clear
              </button>

              <button
                id="translator-translate-btn"
                onClick={handleTranslate}
                disabled={
                  !inputText.trim() ||
                  isTranslating
                }
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isTranslating
                  ? 'Translating...'
                  : 'Translate'}
              </button>

            </div>

          </div>

          {/* Result */}
          <div className="p-5 space-y-4 flex flex-col justify-between bg-stone-50/40">

            <div className="space-y-2">

              <div className="flex items-center justify-between text-xs">

                <span className="font-semibold text-stone-700">
                  {direction === 'hi-to-sat'
                    ? `${languageDisplayName(targetLanguage)} Result`
                    : 'Hindi Result'}
                </span>

                {translatedResult && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified
                      ? 'Verified Classroom Term'
                      : 'AI Translation — Verify'}
                  </span>
                )}

              </div>

              <div
                id="translator-result-area"
                className="min-h-[120px] p-3.5 rounded-xl bg-white border border-stone-200 text-stone-900 flex flex-col justify-between"
              >

                {translatedResult ? (

                  <div className="text-lg font-bold text-emerald-950 font-sans leading-relaxed">
                    {translatedResult}
                  </div>

                ) : hasAttemptedTranslate ? (

                  <div className="text-sm text-amber-800 space-y-1">

                    <p className="font-semibold">
                      Translation unavailable.
                    </p>

                    <p className="text-xs text-stone-500">
                      Try again or use a supported classroom phrase below.
                    </p>

                  </div>

                ) : (

                  <div className="text-sm text-stone-400 italic">
                    Translation output will appear here with Ol Chiki script
                    and phonetic pronunciation.
                  </div>

                )}

                {translationNote && (
                  <div className="mt-3 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    Status: {translationNote}
                  </div>
                )}

                {hasAttemptedTranslate && (
                  <details className="mt-2 text-[11px] text-stone-600">
                    <summary className="cursor-pointer font-semibold text-stone-700">About this translation</summary>
                    <div className="mt-2 rounded-lg bg-stone-50 p-2.5 space-y-1">
                      <p>{translationStatus === 'verified' ? '✓ Verified classroom phrase' : translationStatus === 'ai_assisted' ? '🤖 AI-assisted translation' : '⚠ No verified local resource available'}</p>
                      <p>Source: {translationSource}</p>
                    </div>
                  </details>
                )}

              </div>

            </div>

            {/* Result Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">

              <button
                id="translator-listen-btn"
                onClick={() =>
                  translatedResult &&
                  handleListen(translatedResult)
                }
                disabled={
                  !translatedResult ||
                  (
                    direction === 'hi-to-sat'
                      ? !isAudioAvailable(`${targetLanguage}-IN`)
                      : !isAudioAvailable('hi-IN')
                  )
                }
                title={
                  !translatedResult
                    ? 'No translation output to listen to'
                    : direction === 'hi-to-sat'
                      ? `Play ${languageDisplayName(targetLanguage)} voice preview`
                      : 'Listen to Hindi translation (hi-IN)'
                }
                aria-label={
                  direction === 'hi-to-sat'
                    ? `Play ${languageDisplayName(targetLanguage)} voice preview`
                    : 'Listen to Hindi translation'
                }
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed"
              >

                <Volume2 className="w-3.5 h-3.5 text-stone-600" />

                <span>
                  {direction === 'hi-to-sat'
                    ? 'Play voice preview'
                    : 'Listen (Hindi)'}
                </span>

              </button>

              <button
                id="translator-copy-btn"
                onClick={() =>
                  translatedResult &&
                  handleCopy(translatedResult)
                }
                disabled={!translatedResult}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >

                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                )}

                <span>
                  Copy
                </span>

              </button>

              <button
                type="button"
                onClick={() => showToast('Correction queued for the next local language-pack review.', 'info')}
                disabled={!translatedResult}
                className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-30 text-amber-800 text-xs font-medium transition-colors"
              >
                Suggest correction
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* Phrases + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Supported Classroom Phrases */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>

              <h3 className="font-bold text-stone-900 text-base">
                {targetLanguage === 'sat'
                  ? 'Supported Santhali Classroom Phrases'
                  : `${languageDisplayName(targetLanguage)} Phrase Pack`}
              </h3>

              <p className="text-xs text-stone-500">
                {targetLanguage === 'sat'
                  ? 'Click any phrase to load into translator and test audio pronunciation.'
                  : 'A verified offline phrase pack for this language is not bundled yet.'}
              </p>

            </div>

            <div className="relative w-full sm:w-56">

              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />

              <input
                type="text"
                value={phraseSearch}
                onChange={(event) =>
                  setPhraseSearch(event.target.value)
                }
                placeholder="Filter phrases..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

          </div>

          {/* Categories */}
          {targetLanguage === 'sat' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">

            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {category}
              </button>
            ))}

          </div>
          )}

          {/* Phrase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto">

            {filteredPhrases.length === 0 ? (

              <div className="col-span-2 p-6 text-center text-xs text-stone-400">
                No phrases match your search.
              </div>

            ) : (

              filteredPhrases.map((phrase, index) => (
                <div
                  key={`${phrase.hindi}-${index}`}
                  onClick={() =>
                    handleUsePhrase(phrase)
                  }
                  className="p-3 rounded-xl border border-stone-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer space-y-1 group"
                >

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-xs text-stone-900">
                      {phrase.hindi}
                    </span>

                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {phrase.pronunciation || 'Pronunciation unavailable'}
                    </span>

                  </div>

                  <div className="text-xs text-emerald-900 font-bold font-sans">
                      {phrase.translation}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">

                    <span>
                      {phrase.english}
                    </span>

                    <CornerDownRight className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                  </div>

                </div>
              ))

            )}

          </div>

        </div>

        {/* History */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3">

          <div className="flex items-center justify-between border-b border-stone-100 pb-2">

            <div className="flex items-center gap-1.5">

              <History className="w-4 h-4 text-stone-500" />

              <h4 className="font-bold text-stone-900 text-sm">
                Translation History
              </h4>

            </div>

            <span className="text-xs text-stone-400 font-mono">
              {translationHistory.length}
            </span>

          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto">

            {translationHistory.length === 0 ? (

              <div className="p-6 text-center text-xs text-stone-400">
                No translation history yet. Successfully translated phrases
                will be recorded here.
              </div>

            ) : (

              translationHistory.map((record) => (
                <div
                  key={record.id}
                  id={`history-item-${record.id}`}
                  className="p-2.5 rounded-xl border border-stone-100 bg-stone-50 hover:bg-stone-100/80 transition-colors text-xs space-y-1"
                >

                  <div className="flex items-center justify-between text-[10px] text-stone-400">

                    <span>
                      {record.sourceLanguage} → {record.targetLanguage}
                    </span>

                    <span>
                      {record.timestamp}
                    </span>

                  </div>

                  <div className="font-medium text-stone-900 truncate">
                    "{record.sourceText}"
                  </div>

                  <div className="text-emerald-800 font-medium truncate font-sans">
                    ↳ {record.translatedText}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">

                    <button
                      onClick={() => {
                        setInputText(record.sourceText);
                        setTranslatedResult(record.translatedText);
                        setTranslationNote(record.statusNote);
                        setIsVerified(record.isVerified);
                        setHasAttemptedTranslate(true);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Reuse
                    </button>

                    <button
                      onClick={() =>
                        handleCopy(record.translatedText)
                      }
                      className="text-[10px] text-stone-500 hover:text-stone-800"
                    >
                      Copy
                    </button>

                    <button
                      onClick={() =>
                        deleteTranslationRecord(record.id)
                      }
                      className="text-[10px] text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                  </div>

                </div>
              ))

            )}

          </div>

        </div>

      </div>

    </div>
  );
};