import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../services/apiClient';
import { Flashcard, TribalLanguage } from '../../types';
import { getLanguageResource } from '../../data/languageResources';
import { normalizePhrase } from '../../data/dictionary';
import { recordRecentResource } from '../../utils/recentResources';
import {
  playHindiAudio,
  playAudio,
  isAudioAvailable,
  stopAllAudio
} from '../../services/audioService';
import {
  Layers,
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';

type CardCategory =
  | 'All'
  | 'Numbers'
  | 'Objects'
  | 'Words'
  | 'Shapes'
  | 'Letters';

export const FlashcardsView: React.FC = () => {
  const {
    flashcards,
    toggleFlashcardLearned,
    addFlashcards,
    stats,
    showToast
  } = useApp();

  const [selectedCategory, setSelectedCategory] =
    useState<CardCategory>('All');

  const [currentCardIndex, setCurrentCardIndex] =
    useState<number>(0);

  const [isFlipped, setIsFlipped] =
    useState<boolean>(false);

  const [showGenerator, setShowGenerator] =
    useState(false);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [genCategory, setGenCategory] =
    useState<CardCategory>('Objects');

  const [genTopic, setGenTopic] =
    useState('Forest Seeds 1 to 5');

  const [genCount, setGenCount] =
    useState<number>(5);

  const [targetLanguage, setTargetLanguage] =
    useState<TribalLanguage>('Santhali');

  const CATEGORIES: CardCategory[] = [
    'All',
    'Numbers',
    'Objects',
    'Words',
    'Shapes',
    'Letters'
  ];

  const filteredCards =
    selectedCategory === 'All'
      ? flashcards
      : flashcards.filter(
          (c) => c.category === selectedCategory
        );

  const activeCard: Flashcard | undefined =
    filteredCards[currentCardIndex] ||
    filteredCards[0];

  const activeTranslation = activeCard?.backTranslation || activeCard?.backSanthali || '';
  const activeLanguage = activeCard?.targetLanguage || 'Santhali';
  const activeResourceItem = activeCard
    ? getLanguageResource(activeLanguage).words.find((item) =>
        normalizePhrase(item.hindi) === normalizePhrase(activeCard.frontHindi.replace(/\s*\([^)]*\)\s*$/, ''))
      )
    : undefined;
  const resourceTranslation = activeResourceItem?.translation || activeTranslation;

  useEffect(() => {
    if (activeResourceItem?.id) recordRecentResource(activeResourceItem.id);
  }, [activeResourceItem?.id]);

  const learnedCountInDeck =
    filteredCards.filter(
      (c) => c.learned
    ).length;

  /* =========================
     NAVIGATION
  ========================= */

  const handleNext = () => {
    if (!filteredCards.length) return;

    stopAllAudio();
    setIsFlipped(false);

    setCurrentCardIndex(
      (prev) =>
        (prev + 1) %
        filteredCards.length
    );
  };

  const handlePrev = () => {
    if (!filteredCards.length) return;

    stopAllAudio();
    setIsFlipped(false);

    setCurrentCardIndex(
      (prev) =>
        (prev - 1 + filteredCards.length) %
        filteredCards.length
    );
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  /* =========================
     LEARNED STATE
  ========================= */

  const handleToggleLearned = (
    cardId: string
  ) => {
    toggleFlashcardLearned(cardId);
  };

  /* =========================
     AUDIO
  ========================= */

  const handleAudio = (
    e: React.MouseEvent,
    text: string,
    lang: 'hi' | 'tribal'
  ) => {
    e.stopPropagation();

    const result = lang === 'hi'
      ? playHindiAudio(text)
      : playAudio(text, targetLanguage, {
          audioUrl: activeResourceItem?.audio?.verified ? activeResourceItem.audio.url : undefined
        });

    showToast(
      result.message,
      result.success
        ? 'info'
        : 'warning'
    );
  };

  /* =========================
     GEMINI FLASHCARD GENERATOR
  ========================= */

  const handleGenerateFlashcards =
    async () => {
      if (!genTopic.trim()) {
        showToast(
          'Please enter a topic.',
          'warning'
        );
        return;
      }

      setIsGenerating(true);

      try {
        const response =
          await apiFetch(
            'generate-flashcards',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json'
              },
              body: JSON.stringify({
                category:
                  genCategory,
                topic:
                  genTopic.trim(),
                count:
                  genCount,
                targetLanguage
              })
            }
          );

        if (!response.ok) {
          throw new Error(
            `Backend returned HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        if (
          !data.success ||
          !Array.isArray(
            data.flashcards
          )
        ) {
          throw new Error(
            'Invalid flashcard response'
          );
        }

        /* =========================
           MAP GEMINI RESPONSE
        ========================= */

        const generatedCards: Flashcard[] =
          data.flashcards.map(
            (
              card: any,
              index: number
            ) => ({
              id:
                `ai-${Date.now()}-${index}`,

              category:
                card.category ||
                genCategory,

              frontHindi:
                card.frontHindi ||
                '',

              backTranslation:
                card.backTranslation ||
                card.backSanthali ||
                card.phraseTargetLanguage ||
                '',

              backSanthali:
                card.backSanthali ||
                '',

              phonetic:
                card.phonetic ||
                '',

              englishMeaning:
                card.englishMeaning ||
                '',

              visualIcon:
                card.visualIcon ||
                '📚',

              localContextHint:
                card.localContextHint ||
                'AI-generated classroom example. Verify wording with a native speaker.',

              learned:
                false,
              targetLanguage,
              nipunOutcome: 'Foundational vocabulary and concept recognition'
            })
          );

        /* =========================
           ADD TO REAL APP STATE
        ========================= */

        addFlashcards(
          generatedCards
        );

        /* =========================
           SHOW GENERATED CARDS
        ========================= */

        setSelectedCategory(
          'All'
        );

        setCurrentCardIndex(
          0
        );

        setIsFlipped(
          false
        );

        setShowGenerator(
          false
        );

      } catch (error) {
        console.error(
          'Flashcard generation failed:',
          error
        );

        showToast(
          'Flashcard generation failed. Check that the backend is running.',
          'warning'
        );
      } finally {
        setIsGenerating(
          false
        );
      }
    };

  return (
    <div
      id="flashcards-view"
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Foundational Flashcards
          </h2>

          <p className="text-xs sm:text-sm text-stone-500">
                Interactive visual bilingual cards for Hindi and the selected tribal language.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={() =>
              setShowGenerator(
                !showGenerator
              )
            }
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />

            AI Generate
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">

            <Layers className="w-4 h-4 text-amber-600" />

            <span>
              Total Mastered:{' '}
              {stats.flashcardsLearnedCount}
              {' / '}
              {stats.flashcardsTotal}
            </span>

          </div>

        </div>

      </div>

      {/* =========================
          AI GENERATOR
      ========================= */}

      {showGenerator && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm">

          <div className="flex items-center gap-2 mb-4">

            <Sparkles className="w-5 h-5 text-indigo-600" />

            <div>
              <h3 className="font-bold text-stone-900">
                AI Flashcard Generator
              </h3>

              <p className="text-xs text-stone-500">
                Generate bilingual Hindi–tribal-language learning cards with Gemini.
              </p>
            </div>

          </div>

          <div className="grid sm:grid-cols-3 gap-3">

            {/* CATEGORY */}

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Category
              </label>

              <select
                value={genCategory}
                onChange={(e) =>
                  setGenCategory(
                    e.target
                      .value as CardCategory
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              >
                <option value="Numbers">
                  Numbers
                </option>

                <option value="Objects">
                  Objects
                </option>

                <option value="Words">
                  Words
                </option>

                <option value="Shapes">
                  Shapes
                </option>

                <option value="Letters">
                  Letters
                </option>
              </select>
            </div>

            {/* TOPIC */}

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Topic
              </label>

              <input
                value={genTopic}
                onChange={(e) =>
                  setGenTopic(
                    e.target.value
                  )
                }
                placeholder="e.g. Forest Seeds 1 to 5"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>

            {/* COUNT */}

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Cards
              </label>

              <select
                value={genCount}
                onChange={(e) =>
                  setGenCount(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              >
                <option value={3}>
                  3
                </option>

                <option value={5}>
                  5
                </option>

                <option value={8}>
                  8
                </option>

                <option value={10}>
                  10
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Target Mother Tongue</label>
              <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value as TribalLanguage)} className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm">
                <option value="Santhali">Santhali</option>
                <option value="Ho">Ho</option>
                <option value="Mundari">Mundari</option>
              </select>
            </div>

          </div>

          <button
            onClick={
              handleGenerateFlashcards
            }
            disabled={
              isGenerating
            }
            className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold"
          >
            {isGenerating
              ? 'Generating with Gemini...'
              : 'Generate Flashcards'}
          </button>

        </div>
      )}

      {/* =========================
          CATEGORY TABS
      ========================= */}

      <div className="w-full min-w-0 max-w-full flex gap-2 overflow-x-auto pb-1 scrollbar-none">

        {CATEGORIES.map(
          (cat) => {

            const countInCat =
              cat === 'All'
                ? flashcards.length
                : flashcards.filter(
                    (c) =>
                      c.category ===
                      cat
                  ).length;

            const learnedInCat =
              cat === 'All'
                ? flashcards.filter(
                    (c) =>
                      c.learned
                  ).length
                : flashcards.filter(
                    (c) =>
                      c.category ===
                        cat &&
                      c.learned
                  ).length;

            const isSelected =
              selectedCategory ===
              cat;

            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(
                    cat
                  );

                  setCurrentCardIndex(
                    0
                  );

                  setIsFlipped(
                    false
                  );
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >

                <span>
                  {cat === 'All'
                    ? 'All Decks'
                    : cat}
                </span>

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {learnedInCat}/
                  {countInCat}
                </span>

              </button>
            );
          }
        )}

      </div>

      {/* =========================
          MAIN FLASHCARD
      ========================= */}

      {activeCard ? (

        <div className="space-y-4">

          {/* PROGRESS */}

          <div className="flex items-center justify-between text-xs text-stone-500 px-1">

            <span>
              Card{' '}
              {currentCardIndex + 1}
              {' '}of{' '}
              {filteredCards.length}
            </span>

            <span>
              {learnedCountInDeck}
              {' '}of{' '}
              {filteredCards.length}
              {' '}mastered in this category
            </span>

          </div>

          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">

            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{
                width: `${
                  filteredCards.length
                    ? (
                        learnedCountInDeck /
                        filteredCards.length
                      ) * 100
                    : 0
                }%`
              }}
            />

          </div>

          {/* CARD */}

          <div
            key={`${activeCard.id}-${isFlipped ? 'answer' : 'question'}`}
            id={`flashcard-${activeCard.id}`}
            onClick={() =>
              setIsFlipped(
                !isFlipped
              )
            }
            className="np-flashcard min-h-[360px] sm:min-h-[400px] bg-white rounded-3xl p-6 sm:p-10 border-2 border-stone-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-950/10 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden"
          >

            <div aria-hidden="true" className="np-float absolute -right-5 -top-5 h-24 w-24 rounded-full bg-amber-100/70" />
            <div aria-hidden="true" className="np-float-delayed absolute -left-8 bottom-14 h-20 w-20 rounded-full bg-indigo-100/55" />

            {/* TOP */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <span className="np-card-icon text-3xl relative z-10">
                  {activeCard.visualIcon ||
                    '📚'}
                </span>

                <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">
                  {activeCard.category}
                </span>

              </div>

              <div className="flex items-center gap-2">

                {/* AUDIO */}

                <button
                  id="flashcard-audio-btn"
                  onClick={(e) =>
                    !isFlipped
                      ? handleAudio(
                          e,
                          activeCard.frontHindi,
                          'hi'
                        )
                      : handleAudio(
                          e,
                          activeTranslation,
                          'tribal'
                        )
                  }
                  disabled={
                    isFlipped
                      ? !isAudioAvailable(
                          targetLanguage
                        )
                      : !isAudioAvailable(
                          'hi-IN'
                        )
                  }
                  title={
                    !isFlipped
                      ? 'Play Hindi pronunciation (hi-IN)'
                      : `${targetLanguage} device preview unavailable.`
                  }
                  className={`p-2 rounded-xl transition-colors ${
                    isFlipped &&
                    !isAudioAvailable(
                      targetLanguage
                    )
                      ? 'bg-stone-100/70 text-stone-400 cursor-not-allowed opacity-60'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <Volume2
                    className={`w-4 h-4 ${
                      isFlipped &&
                      !isAudioAvailable(
                        targetLanguage
                      )
                        ? 'text-stone-400'
                        : 'text-emerald-700'
                    }`}
                  />
                </button>

                {/* MASTERED */}

                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    handleToggleLearned(
                      activeCard.id
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCard.learned
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  {activeCard.learned
                    ? '✓ Mastered'
                    : 'Mark Mastered'}
                </button>

              </div>

            </div>

            {/* CONTENT */}

            <div className="py-8 text-center space-y-3">

              {!isFlipped ? (

                /* FRONT */

                <div className="np-answer-reveal space-y-2 relative z-10">

                  <div className="text-xs font-bold tracking-wider uppercase text-stone-400">
                    Hindi Word (देवनागरी)
                  </div>

                  <div className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
                    {activeCard.frontHindi}
                  </div>

                  <p className="text-sm text-stone-500 font-medium">
                    {activeCard.englishMeaning}
                  </p>

                  <div className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-4 font-semibold">
                    <RotateCw className="w-3 h-3" />

                    Click card to reveal {activeLanguage} translation
                  </div>

                </div>

              ) : (

                /* BACK */

                <div className="np-answer-reveal space-y-3 relative z-10">

                  <div className="text-xs font-bold tracking-wider uppercase text-emerald-700">
                    {activeLanguage} Mother Tongue
                  </div>

                  <div className="text-4xl sm:text-5xl font-extrabold text-emerald-950 font-sans tracking-tight">
                    {resourceTranslation}
                  </div>

                  <div className="text-base font-semibold text-emerald-800 font-mono">
                    Phonetic: "
                    {activeResourceItem?.pronunciation || activeCard.phonetic || 'Unavailable'}
                    "
                  </div>

                  <div className="inline-block text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full font-medium">
                    {activeResourceItem
                      ? `${activeResourceItem.verificationStatus === 'verified' ? 'Verified local resource' : 'Demo/sample'} · ${activeResourceItem.source.name}`
                      : 'AI-assisted card. Verify with a native speaker before classroom use.'}
                  </div>

                  <div className="text-xs text-stone-500">
                    Script: {activeResourceItem?.script || 'Unavailable'} · Audio: {isAudioAvailable(activeLanguage, activeResourceItem?.audio?.verified ? activeResourceItem.audio.url : undefined) ? 'Available' : 'Unavailable'}
                  </div>

                  {activeCard.localContextHint && (

                    <div className="max-w-md mx-auto p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed text-left flex items-start gap-2 mt-4">

                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

                      <span>
                        <strong>
                          Classroom Context:
                        </strong>{' '}
                        {activeCard.localContextHint}
                      </span>

                    </div>

                  )}

                </div>

              )}

            </div>

            {/* BOTTOM */}

            <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-100">

              <span>
                {isFlipped
                  ? 'Showing: Mother-Tongue Bridge'
                  : 'Showing: Hindi Prompt'}
              </span>

              <span>
                Click anywhere to flip
              </span>

            </div>

          </div>

          {/* =========================
              NAVIGATION
          ========================= */}

          <div className="flex items-center justify-between pt-2">

            <button
              id="prev-flashcard-btn"
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />

              Previous
            </button>

            <button
              id="flip-flashcard-btn"
              onClick={() =>
                setIsFlipped(
                  !isFlipped
                )
              }
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />

              Flip Card
            </button>

            <button
              id="next-flashcard-btn"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs"
            >
              Next Card

              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      ) : (

        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm">
          No cards found in this category.
        </div>

      )}

    </div>
  );
};
