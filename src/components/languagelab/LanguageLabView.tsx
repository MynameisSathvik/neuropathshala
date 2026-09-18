import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../services/apiClient';
import { getLanguageResource } from '../../data/languageResources';
import {
  LanguagePracticeItem,
  TribalLanguage,
  TRIBAL_LANGUAGES,
  TRIBAL_LANGUAGE_STATUS,
  TRIBAL_LANGUAGE_PROFILES
} from '../../types';
import {
  playAudio,
  isAudioAvailable,
  stopAllAudio
} from '../../services/audioService';
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Award,
  Search,
  Check,
  Loader2
} from 'lucide-react';

export const LanguageLabView: React.FC = () => {
  const {
    languagePracticeItems,
    toggleLanguagePracticeLearned,
    updateLanguagePracticeItem,
    addLanguagePracticeItems,
    stats,
    showToast
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Generator
  const [showGenerator, setShowGenerator] = useState(false);
  const [genCategory, setGenCategory] =
    useState<string>('Classroom Phrases');
  const [genTopic, setGenTopic] =
    useState<string>('Basic classroom commands');
  const [genCount, setGenCount] =
    useState<number>(5);
  const [isGenerating, setIsGenerating] =
    useState(false);

  const [targetLanguage, setTargetLanguage] =
    useState<TribalLanguage>('Santhali');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [recordingId, setRecordingId] =
    useState<string | null>(null);

  const [recordedAudioUrl, setRecordedAudioUrl] =
    useState<{ [id: string]: string }>({});

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const streamRef =
    useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopAllAudio();

      Object.values(recordedAudioUrl).forEach((url) => {
        URL.revokeObjectURL(url);
      });

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // safe ignore
        }
      }
    };
  }, [recordedAudioUrl]);

  const CATEGORIES = [
    'All',
    'Classroom Phrases',
    'Greetings',
    'Numbers',
    'Objects',
    'Activities',
    'Encouragement',
    'Assessment'
  ];

  const GENERATOR_CATEGORIES = CATEGORIES.filter(
    (cat) => cat !== 'All'
  );

  const masteryRatio =
    stats.languagePracticeTotal > 0
      ? stats.languagePracticeLearnedCount /
        stats.languagePracticeTotal
      : 0;

  const selectedProfile = TRIBAL_LANGUAGE_PROFILES[targetLanguage];
  const bundledResourceItems = getLanguageResource(targetLanguage).classroomPhrases.filter((item) => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const matchesSearch = !query || [item.id, item.hindi, item.translation, item.english, item.category]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  let masteryBadge = {
    title: 'Beginner Teacher (आरंभिक स्तर)',
    desc: 'Practicing foundational classroom commands.',
    color:
      'bg-stone-100 text-stone-700 border-stone-300'
  };

  if (masteryRatio >= 0.75) {
    masteryBadge = {
      title:
        'Mother-Tongue Champion (मातृभाषा सेतु दक्ष)',
      desc:
        'High fluency in Santhali foundational instructional prompts.',
      color:
        'bg-emerald-100 text-emerald-900 border-emerald-300'
    };
  } else if (masteryRatio >= 0.4) {
    masteryBadge = {
      title:
        'Classroom Conversationalist (कक्षा संवादक)',
      desc:
        'Comfortable with daily commands and student praise.',
      color:
        'bg-indigo-100 text-indigo-900 border-indigo-300'
    };
  }

  const handleListen = (text: string) => {
    const status = playAudio(text, targetLanguage);

    showToast(
      status.message,
      status.success ? 'info' : 'warning'
    );
  };

  const submitApprovedPack = async () => {
    const approvedItems = languagePracticeItems.filter((item) => item.reviewStatus === 'approved' && item.targetLanguage === targetLanguage);
    if (!approvedItems.length) {
      showToast(`No approved ${targetLanguage} phrases to submit.`, 'warning');
      return;
    }
    try {
      const response = await apiFetch('language-pack/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage, items: approvedItems })
      });
      if (!response.ok) throw new Error('Review submission failed');
      showToast(`${approvedItems.length} approved ${targetLanguage} phrases submitted.`, 'success');
    } catch {
      showToast('Review submission unavailable. Approved phrases remain saved offline.', 'warning');
    }
  };

  const startSelfRecord = async (itemId: string) => {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      showToast(
        'Microphone recording is not supported in this browser.',
        'warning'
      );
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      streamRef.current = stream;

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(
            audioChunksRef.current,
            {
              type: 'audio/webm'
            }
          );

          const url =
            URL.createObjectURL(audioBlob);

          setRecordedAudioUrl((prev) => ({
            ...prev,
            [itemId]: url
          }));
        } catch {
          // safe ignore
        }

        stream
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      };

      mediaRecorder.start();

      setRecordingId(itemId);

      showToast(
        'Recording... Speak the Santhali phrase aloud.'
      );
    } catch {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      showToast(
        'Microphone access was denied. You can continue listening to the model pronunciation.',
        'warning'
      );
    }
  };

  const stopSelfRecord = () => {
    if (
      mediaRecorderRef.current &&
      recordingId
    ) {
      try {
        if (
          mediaRecorderRef.current.state !==
          'inactive'
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // safe ignore
      }

      setRecordingId(null);

      showToast(
        'Practice recorded! Play your recording below.'
      );
    }
  };

  // --------------------------------------------------
  // AI LANGUAGE PRACTICE GENERATOR
  // --------------------------------------------------

  const generateLanguagePractice =
    async () => {
      if (!genTopic.trim()) {
        showToast(
          'Please enter a practice topic.',
          'warning'
        );
        return;
      }

      if (genCount < 1 || genCount > 10) {
        showToast(
          'Choose between 1 and 10 practice phrases.',
          'warning'
        );
        return;
      }

      setIsGenerating(true);

      try {
        const response = await apiFetch(
          'generate-language-practice',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              category: genCategory,
              topic: genTopic.trim(),
              count: genCount,
              targetLanguage
            })
          }
        );

        if (!response.ok) {
          throw new Error(
            `Backend returned HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (
          !data.success ||
          !Array.isArray(data.items)
        ) {
          throw new Error(
            'Invalid language practice response'
          );
        }

        const generatedItems: LanguagePracticeItem[] =
          data.items
            .slice(0, genCount)
            .map(
              (
                item: any,
                index: number
              ) => ({
                id: `ai-language-${Date.now()}-${index}`,
                category:
                  item.category ||
                  genCategory,
                phraseHindi:
                  item.phraseHindi || '',
                phraseSanthali:
                  item.phraseSanthali || item.phraseHo || item.phraseMundari || '',
                phonetic:
                  item.phonetic || '',
                meaningContext:
                  item.meaningContext || '',
                learned: false
                ,targetLanguage
                ,reviewStatus: 'pending'
              })
            );

        if (!generatedItems.length) {
          throw new Error(
            'No practice phrases were generated.'
          );
        }

        addLanguagePracticeItems(
          generatedItems
        );

        setShowGenerator(false);

        setGenTopic(
          'Basic classroom commands'
        );

        setGenCount(5);

      } catch (error) {
        console.error(
          'Language practice generation failed:',
          error
        );

        showToast(
          'AI language practice generation failed. Make sure the backend is running.',
          'warning'
        );
      } finally {
        setIsGenerating(false);
      }
    };

  const filteredItems =
    languagePracticeItems.filter(
      (item) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          item.category === selectedCategory;

        const matchesSearch =
          !searchQuery.trim() ||
          item.phraseHindi
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            ) ||
          item.phraseSanthali
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            ) ||
          item.phonetic
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            ) ||
          item.meaningContext
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            );

        const matchesLanguage =
          (item.targetLanguage || 'Santhali') === targetLanguage;

        return (
          matchesLanguage &&
          matchesCategory &&
          matchesSearch &&
          (reviewFilter === 'all' || (item.reviewStatus || 'approved') === reviewFilter)
        );
      }
    );

  return (
    <div
      id="language-lab-view"
      className="max-w-5xl mx-auto space-y-6 pb-12"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Teacher Language Practice Lab
          </h2>

          <p className="text-xs sm:text-sm text-stone-500">
            Build teacher confidence in oral
            Santhali, Ho, and Mundari classroom commands,
            praise, and math routines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generate Button */}
          <button
            id="generate-language-practice"
            onClick={() =>
              setShowGenerator(
                !showGenerator
              )
            }
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />

            <span>
              {showGenerator
                ? 'Close Generator'
                : 'AI Generate'}
            </span>
          </button>

          {/* Mastery Badge */}
          <div
            className={`flex items-center gap-2.5 p-3 rounded-2xl border ${masteryBadge.color} shadow-2xs`}
          >
            <Award className="w-5 h-5 shrink-0" />

            <div className="text-xs">
              <div className="font-bold leading-tight">
                {masteryBadge.title}
              </div>

              <div className="text-[11px] opacity-80">
                {
                  stats.languagePracticeLearnedCount
                }{' '}
                of{' '}
                {
                  stats.languagePracticeTotal
                }{' '}
                Practiced
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-sky-800">Practice language</p>
            <p className="mt-1 text-sm font-semibold text-sky-950">Choose the language for generated teacher prompts and audio checks.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRIBAL_LANGUAGES.map((language) => {
              const status = TRIBAL_LANGUAGE_STATUS[language];
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => setTargetLanguage(language)}
                  className={`rounded-xl border px-3 py-2 text-left transition-colors ${targetLanguage === language ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-200 bg-white text-sky-900 hover:border-sky-400'}`}
                >
                  <span className="block text-xs font-bold">{language}</span>
                  <span className={`block text-[10px] ${targetLanguage === language ? 'text-sky-100' : 'text-sky-700'}`}>{TRIBAL_LANGUAGE_PROFILES[language].script}</span>
                  <span className={`block text-[10px] ${targetLanguage === language ? 'text-sky-100' : 'text-sky-700'}`}>{status.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-sky-800">{TRIBAL_LANGUAGE_STATUS[targetLanguage].note}. Existing phrases stay in their original language; generate a {targetLanguage} pack to add local content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-800">Writing system</p>
          <p className="mt-2 text-base font-bold text-emerald-950">{selectedProfile.script}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">{selectedProfile.scriptNote}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-amber-800">Resource readiness</p>
          <p className="mt-2 text-base font-bold text-amber-950">{selectedProfile.resourceLabel}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-800">{selectedProfile.resourceNote}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-indigo-800">Recommended next step</p>
          <p className="mt-2 text-base font-bold text-indigo-950">
            {targetLanguage === 'Santhali' ? 'Practice verified phrases' : 'Collect native-checked phrases'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-indigo-800">
            {targetLanguage === 'Santhali'
              ? 'Use the local pack first, then record teacher practice for review.'
              : 'Use generated drafts only as review material until a speaker approves them.'}
          </p>
        </div>
      </div>

      {bundledResourceItems.length > 0 && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-800">Bundled verified resource catalog</p>
              <p className="mt-1 text-xs text-emerald-900">These phrases are the same local records used by Translator, Survival Kit, Flashcards, and Live Classroom.</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-800">{bundledResourceItems.length} matches</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bundledResourceItems.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-emerald-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{item.id} · {item.category}</p>
                <p className="mt-1 text-xs font-bold text-stone-900">{item.hindi}</p>
                <p className="mt-1 text-sm font-bold text-emerald-950">{item.translation}</p>
                <p className="mt-1 text-[11px] text-emerald-800">{item.script || 'Script unavailable'} · {item.pronunciation || 'Pronunciation unavailable'}</p>
                <p className="mt-1 text-[10px] text-stone-500">Source: {item.source.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Generator */}
      {showGenerator && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-indigo-950">
                  AI Language Practice Generator
                </h3>

                <p className="text-[11px] text-indigo-700">
                  Generate teacher-ready Hindi →
                  {targetLanguage} classroom phrases.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Category
                </label>

                <select
                  value={genCategory}
                  onChange={(e) =>
                    setGenCategory(
                      e.target.value
                    )
                  }
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {GENERATOR_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Topic */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Primary Practice Topic
                </label>

                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) =>
                    setGenTopic(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Asking children to count 1 to 5"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              {/* Count */}
              <div className="w-full sm:w-32">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Number of Phrases
                </label>

                <select
                  value={genCount}
                  onChange={(e) =>
                    setGenCount(
                      Number(e.target.value)
                    )
                  }
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                    (count) => (
                      <option
                        key={count}
                        value={count}
                      >
                        {count}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                onClick={
                  generateLanguagePractice
                }
                disabled={isGenerating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Practice
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              <strong>Language verification:</strong>{' '}
              AI-generated Santhali phrases are
              not automatically native-speaker
              verified. Verify important classroom
              phrases before official use.
            </div>
          </div>
        </div>
      )}

      {/* Categories & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              placeholder="Search phrases or commands..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Practice daily for 5 minutes before
            morning school assembly.
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(cat)
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Practice Cards Grid */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-sky-800">Language pack review</p>
          <p className="mt-1 text-xs text-sky-900">Approve only phrases checked by a native speaker before classroom use.</p>
        </div>
        <div className="flex gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
            <button key={filter} onClick={() => setReviewFilter(filter)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold capitalize ${reviewFilter === filter ? 'bg-sky-700 text-white' : 'bg-white text-sky-800 border border-sky-200'}`}>
              {filter}
            </button>
          ))}
          <button onClick={submitApprovedPack} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white">Submit approved</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            id={`practice-item-${item.id}`}
            className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs flex flex-col justify-between space-y-4 ${
              item.learned
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-stone-200'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                  {item.category}
                </span>

                <button
                  id={`mark-practiced-${item.id}`}
                  onClick={() =>
                    toggleLanguagePracticeLearned(
                      item.id
                    )
                  }
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                    item.learned
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {item.learned ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        Practiced
                      </span>
                    </>
                  ) : (
                    <span>
                      Mark Practiced
                    </span>
                  )}
                </button>
              </div>

              {/* Hindi Meaning */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  Hindi Meaning (हिंदी)
                </div>

                <div className="text-sm sm:text-base font-bold text-stone-900">
                  {item.phraseHindi}
                </div>
              </div>

              {/* Selected target language */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">
                  {targetLanguage} Oral Phrase
                </div>

                <div className="text-base sm:text-lg font-extrabold text-emerald-950 font-sans">
                  {item.phraseSanthali}
                </div>

                <div className="text-xs text-stone-600 font-mono">
                  "{item.phonetic}"
                </div>
              </div>

              {item.meaningContext && (
                <p className="text-[11px] text-stone-500 leading-relaxed italic">
                  💡 {item.meaningContext}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${item.reviewStatus === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : item.reviewStatus === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                  {item.reviewStatus || 'approved'} review
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditingId(item.id); setEditingText(item.phraseSanthali); }} className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-bold text-stone-600 hover:bg-stone-50">Edit</button>
                  <button onClick={() => updateLanguagePracticeItem({ ...item, reviewStatus: 'approved', isVerified: true, reviewedAt: new Date().toISOString(), reviewNote: 'Approved by local language reviewer.' })} className="rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-800">Approve</button>
                  <button onClick={() => updateLanguagePracticeItem({ ...item, reviewStatus: 'rejected', isVerified: false, reviewedAt: new Date().toISOString(), reviewNote: 'Needs native-speaker correction.' })} className="rounded-lg bg-rose-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-800">Reject</button>
                </div>
              </div>
              {item.reviewNote && <p className="text-[10px] text-stone-500">{item.reviewNote}</p>}
              {editingId === item.id && <div className="flex gap-2"><input value={editingText} onChange={(event) => setEditingText(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs" /><button onClick={() => { updateLanguagePracticeItem({ ...item, phraseSanthali: editingText, reviewStatus: 'pending', isVerified: false, reviewedAt: new Date().toISOString(), reviewNote: 'Edited and returned for native-speaker review.' }); setEditingId(null); }} className="rounded-lg bg-sky-700 px-2.5 py-1 text-[10px] font-bold text-white">Save</button></div>}
            </div>

            {/* Audio & Recording */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
              {/* Reference Audio */}
              <button
                id={`listen-phrase-${item.id}`}
                onClick={() =>
                  handleListen(
                    item.phraseSanthali
                  )
                }
                disabled={!isAudioAvailable(targetLanguage)}
                title={
                  isAudioAvailable(
                    targetLanguage
                  )
                    ? 'Listen to model audio'
                    : `${targetLanguage} device preview unavailable.`
                }
                aria-label={
                  isAudioAvailable(
                    targetLanguage
                  )
                    ? 'Listen to model audio'
                    : `${targetLanguage} device preview unavailable.`
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isAudioAvailable(
                    targetLanguage
                  )
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    : 'bg-stone-100/70 text-stone-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Volume2
                  className={`w-3.5 h-3.5 ${
                    isAudioAvailable(targetLanguage)
                      ? 'text-emerald-700'
                      : 'text-stone-400'
                  }`}
                />

                <span>
                  {isAudioAvailable(targetLanguage)
                    ? `Listen ${targetLanguage} Preview`
                    : 'Audio Unavailable'}
                </span>
              </button>

              {/* Self Recording */}
              <div className="flex items-center gap-2">
                {recordingId === item.id ? (
                  <button
                    onClick={
                      stopSelfRecord
                    }
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 animate-pulse"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>
                      Stop Recording
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      startSelfRecord(
                        item.id
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-600" />

                    <span>
                      Record Voice
                    </span>
                  </button>
                )}

                {recordedAudioUrl[
                  item.id
                ] && (
                  <audio
                    src={
                      recordedAudioUrl[
                        item.id
                      ]
                    }
                    controls
                    className="h-8 max-w-[140px] text-xs"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <Search className="w-8 h-8 mx-auto text-stone-300 mb-3" />

          <h3 className="text-sm font-bold text-stone-800">
            No {targetLanguage} practice phrases found
          </h3>

          <p className="text-xs text-stone-500 mt-1">
            Generate a {targetLanguage} phrase pack above to begin reviewing local language content.
          </p>

          <button onClick={() => setShowGenerator(true)} className="mt-4 rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800">
            Generate {targetLanguage} pack
          </button>
        </div>
      )}
    </div>
  );
};