import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Radio,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react';

export const LearningInsightsView: React.FC = () => {
  const {
    classroomSessions,
    stats,
    setActiveTab,
    createWorksheetFromLesson
  } = useApp();

  // --------------------------------------------------
  // CLASSROOM COMPREHENSION
  // --------------------------------------------------

  const highComp = classroomSessions.filter(
    (s) => s.comprehension === 'High'
  ).length;

  const modComp = classroomSessions.filter(
    (s) => s.comprehension === 'Moderate'
  ).length;

  const lowComp = classroomSessions.filter(
    (s) =>
      s.comprehension === 'Needs Simplification'
  ).length;

  const totalSessions =
    classroomSessions.length;

  const highCompPct = totalSessions
    ? Math.round(
        (highComp / totalSessions) * 100
      )
    : 0;

  const modCompPct = totalSessions
    ? Math.round(
        (modComp / totalSessions) * 100
      )
    : 0;

  const lowCompPct = totalSessions
    ? Math.round(
        (lowComp / totalSessions) * 100
      )
    : 0;

  // --------------------------------------------------
  // VOCABULARY / LANGUAGE MASTERY
  // --------------------------------------------------

  const vocabularyRatio =
    stats.flashcardsTotal > 0
      ? stats.flashcardsLearnedCount /
        stats.flashcardsTotal
      : 0;

  const languageRatio =
    stats.languagePracticeTotal > 0
      ? stats.languagePracticeLearnedCount /
        stats.languagePracticeTotal
      : 0;

  // --------------------------------------------------
  // DYNAMIC RECOMMENDATION LOGIC
  // --------------------------------------------------

  let primaryRecommendation = {
    badge: 'Start Here',
    title: 'Build Your First Classroom Session',
    description:
      'Use Live Classroom to practice Hindi-to-Santhali teaching and capture classroom response data.',
    action: 'Teach in Live Classroom',
    tab: 'live-classroom',
    icon: Radio
  };

  if (totalSessions > 0) {
    if (lowCompPct >= 40) {
      primaryRecommendation = {
        badge: 'Needs Simplification',
        title:
          'Simplify the Next Lesson with Mother-Tongue Support',
        description:
          'Recent sessions show that learners may need simpler explanations, shorter prompts, and stronger Santhali language bridges.',
        action: 'Teach in Live Classroom',
        tab: 'live-classroom',
        icon: AlertCircle
      };
    } else if (modCompPct >= 40) {
      primaryRecommendation = {
        badge: 'Reinforce Learning',
        title:
          'Add More Guided Practice to the Next Lesson',
        description:
          'Students are showing moderate comprehension. Reinforce the concept with concrete examples and a short worksheet.',
        action: 'Generate Practice Sheet',
        tab: 'worksheets',
        icon: TrendingUp
      };
    } else {
      primaryRecommendation = {
        badge: 'Strong Progress',
        title:
          'Continue Mother-Tongue Classroom Practice',
        description:
          'Recent classroom sessions show positive comprehension. Continue using Santhali bridges and local examples.',
        action: 'Teach in Live Classroom',
        tab: 'live-classroom',
        icon: CheckCircle2
      };
    }
  }

  let vocabularyRecommendation = {
    badge: 'Vocabulary',
    title: 'Build Your Santhali Vocabulary',
    description:
      'Practice bilingual flashcards before the next classroom session.',
    action: 'Open Flashcards',
    tab: 'flashcards'
  };

  if (vocabularyRatio >= 0.75) {
    vocabularyRecommendation = {
      badge: 'Vocabulary Strong',
      title: 'Expand Classroom Vocabulary',
      description:
        'Your flashcard mastery is strong. Add new topic-specific mother-tongue vocabulary.',
      action: 'Open Flashcards',
      tab: 'flashcards'
    };
  }

  let languageRecommendation = {
    badge: 'Teacher Fluency',
    title: 'Practice Santhali Classroom Phrases',
    description:
      'Use the Language Lab to practice commands, encouragement, and assessment phrases.',
    action: 'Open Language Lab',
    tab: 'language-lab'
  };

  if (languageRatio >= 0.75) {
    languageRecommendation = {
      badge: 'Teacher Fluency Strong',
      title: 'Practice More Advanced Classroom Dialogue',
      description:
        'Your foundational phrase practice is strong. Continue expanding classroom interaction vocabulary.',
      action: 'Open Language Lab',
      tab: 'language-lab'
    };
  }

  // --------------------------------------------------
  // READINESS
  // --------------------------------------------------

  const readiness =
    stats.readinessPercent || 0;

  let readinessMessage =
    'Complete lessons, worksheets, flashcards, and language practice to improve classroom readiness.';

  if (readiness >= 80) {
    readinessMessage =
      'You are highly prepared for mother-tongue supported classroom teaching.';
  } else if (readiness >= 50) {
    readinessMessage =
      'You have a good foundation. Continue practicing language and classroom workflows.';
  }

  // --------------------------------------------------
  // HELPER
  // --------------------------------------------------

  const handleRecommendation = (
    tab: string
  ) => {
    setActiveTab(tab as any);
  };

  return (
    <div
      id="learning-insights-view"
      className="max-w-6xl mx-auto space-y-6 pb-12"
    >
      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          Learning Insights & Adaptive Loop
        </h2>

        <p className="text-xs sm:text-sm text-stone-500">
          Data-driven instructional recommendations
          derived from classroom activity and teacher
          practice.
        </p>
      </div>

      {/* HIGH LEVEL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Classroom Sessions</span>
            <Radio className="w-4 h-4 text-rose-600" />
          </div>

          <div className="text-3xl font-extrabold text-stone-900">
            {stats.classroomSessionsCount}
          </div>

          <p className="text-xs text-stone-400">
            Total classes recorded
          </p>
        </div>

        {/* Readiness */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Classroom Readiness</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="text-3xl font-extrabold text-indigo-900">
            {stats.readinessPercent}%
          </div>

          <p className="text-xs text-stone-400">
            {stats.readinessLabel}
          </p>
        </div>

        {/* Vocabulary */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Vocabulary Mastered</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>

          <div className="text-3xl font-extrabold text-stone-900">
            {stats.flashcardsLearnedCount}

            <span className="text-sm font-normal text-stone-400">
              /{stats.flashcardsTotal}
            </span>
          </div>

          <p className="text-xs text-stone-400">
            Mother-tongue words
          </p>
        </div>

        {/* Language */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Teacher Oral Mastery</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="text-3xl font-extrabold text-emerald-900">
            {stats.languagePracticeLearnedCount}

            <span className="text-sm font-normal text-stone-400">
              /{stats.languagePracticeTotal}
            </span>
          </div>

          <p className="text-xs text-stone-400">
            Classroom commands practiced
          </p>
        </div>
      </div>

      {/* READINESS SUMMARY */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />

            <span className="font-bold text-sm text-stone-900">
              Teacher Readiness
            </span>
          </div>

          <span className="text-xs font-bold text-indigo-700">
            {readiness}%
          </span>
        </div>

        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, readiness)
              )}%`
            }}
          />
        </div>

        <p className="text-xs text-stone-500 mt-3">
          {readinessMessage}
        </p>
      </div>

      {/* ADAPTIVE RECOMMENDATIONS */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-5 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-lg text-white">
              Adaptive Pedagogical Recommendations
            </h3>

            <p className="text-xs text-slate-300">
              Recommendations adapt to classroom
              comprehension and teacher practice data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* RECOMMENDATION 1 */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />

                {primaryRecommendation.badge}
              </div>

              <h4 className="font-bold text-sm text-white">
                {primaryRecommendation.title}
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                {primaryRecommendation.description}
              </p>
            </div>

            <button
              onClick={() =>
                handleRecommendation(
                  primaryRecommendation.tab
                )
              }
              className="mt-2 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>
                {primaryRecommendation.action}
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RECOMMENDATION 2 */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold border border-amber-500/20">
                <Layers className="w-3 h-3" />

                {vocabularyRecommendation.badge}
              </div>

              <h4 className="font-bold text-sm text-white">
                {vocabularyRecommendation.title}
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                {vocabularyRecommendation.description}
              </p>
            </div>

            <button
              onClick={() =>
                handleRecommendation(
                  vocabularyRecommendation.tab
                )
              }
              className="mt-2 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>
                {vocabularyRecommendation.action}
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RECOMMENDATION 3 */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 text-[10px] font-semibold border border-sky-500/20">
                <Sparkles className="w-3 h-3" />

                {languageRecommendation.badge}
              </div>

              <h4 className="font-bold text-sm text-white">
                {languageRecommendation.title}
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                {languageRecommendation.description}
              </p>
            </div>

            <button
              onClick={() =>
                handleRecommendation(
                  languageRecommendation.tab
                )
              }
              className="mt-2 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-between transition-colors border border-white/10"
            >
              <span>
                {languageRecommendation.action}
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* COMPREHENSION + SESSION HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COMPREHENSION */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="font-bold text-stone-900 text-sm">
              Comprehension Health
            </span>

            <span className="text-xs text-stone-400">
              {totalSessions} Sessions
            </span>
          </div>

          <div className="space-y-4">
            {/* HIGH */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-emerald-800">
                  High Comprehension
                </span>

                <span className="font-bold text-stone-900">
                  {highComp} ({highCompPct}%)
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${highCompPct}%`
                  }}
                />
              </div>
            </div>

            {/* MODERATE */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-amber-800">
                  Moderate Engagement
                </span>

                <span className="font-bold text-stone-900">
                  {modComp} ({modCompPct}%)
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${modCompPct}%`
                  }}
                />
              </div>
            </div>

            {/* LOW */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-rose-800">
                  Needs Simplification
                </span>

                <span className="font-bold text-stone-900">
                  {lowComp} ({lowCompPct}%)
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${lowCompPct}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 leading-relaxed border border-stone-100">
            <strong>Adaptive signal:</strong>{' '}
            {totalSessions === 0
              ? 'Complete a live classroom session to begin generating personalized insights.'
              : lowCompPct >= 40
              ? 'Recent sessions indicate that lesson simplification and stronger mother-tongue support should be prioritized.'
              : modCompPct >= 40
              ? 'Recent sessions indicate that additional guided practice may help strengthen comprehension.'
              : 'Recent sessions indicate positive classroom comprehension. Continue the current teaching approach.'}
          </div>
        </div>

        {/* SESSION HISTORY */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-600" />

              <span className="font-bold text-stone-900 text-sm">
                Classroom Session History
              </span>
            </div>

            <button
              onClick={() =>
                setActiveTab('live-classroom')
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              + Start New Session
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {classroomSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No sessions logged yet. Complete a
                live class to view detailed insights.
              </div>
            ) : (
              classroomSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 transition-all space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {session.topic}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                        {session.grade}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${
                        session.comprehension ===
                        'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.comprehension ===
                            'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {session.comprehension}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-500 text-[11px] pt-1">
                    <div>
                      Duration:{' '}
                      {Math.round(
                        session.durationSeconds / 60
                      )}{' '}
                      mins
                    </div>

                    <div>
                      Teacher Prompts:{' '}
                      {session.teacherPromptsCount}
                    </div>

                    <div>
                      Student Turns:{' '}
                      {session.studentResponsesCount}
                    </div>

                    <div>
                      Language: {session.language}
                    </div>
                  </div>

                  {session.suggestedNextAction && (
                    <div className="p-2 bg-stone-50 rounded-lg text-stone-700 text-[11px] flex items-center justify-between">
                      <span>
                        <strong>
                          Recommended next:
                        </strong>{' '}
                        {session.suggestedNextAction}
                      </span>

                      <button
                        onClick={() => {
                          createWorksheetFromLesson({
                            id: 'temp',
                            title: session.topic,
                            grade: session.grade,
                            subject:
                              session.subject,
                            topic: session.topic,
                            difficulty:
                              'Beginner',
                            durationMinutes: 30,
                            localContext:
                              'Classroom session',
                            objective: '',
                            materials: [],
                            warmUp: '',
                            teacherExplanation:
                              '',
                            localContextExample:
                              '',
                            classroomActivity:
                              '',
                            practice: '',
                            assessment: '',
                            motherTongueSupport: {
                              language:
                                'Santhali',
                              keyPhrases: []
                            },
                            createdAt: '',
                            updatedAt: ''
                          });
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 ml-2 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Create Worksheet
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};