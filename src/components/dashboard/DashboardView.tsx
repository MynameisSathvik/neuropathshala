import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRIBAL_LANGUAGES, TRIBAL_LANGUAGE_STATUS } from '../../types';
import { LANGUAGE_RESOURCES } from '../../data/languageResources';
import { getSavedResourceIds } from '../../utils/recentResources';
import {
  Radio,
  BookOpen,
  FileText,
  Languages,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkle,
  Plus,
  WifiOff,
  Mic,
  Target,
  ShieldCheck,
  ClipboardCheck,
  Backpack,
  ArrowUpRight,
  CalendarDays,
  UserRound,
  Wifi
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    stats,
    lessons,
    worksheets,
    classroomSessions,
    translationHistory,
    settings,
    setActiveTab,
    startLiveClassFromLesson,
    createWorksheetFromLesson
  } = useApp();

  const recentLessons = lessons.slice(0, 3);
  const resourceList = Object.values(LANGUAGE_RESOURCES);
  const verifiedPhraseCount = resourceList.reduce((sum, resource) => sum + resource.classroomPhrases.filter((item) => item.verificationStatus === 'verified').length, 0);
  const offlineCoreCount = resourceList.filter((resource) => resource.offlineAvailable).length;
  const observationsRecorded = classroomSessions.reduce((sum, session) => sum + (session.observations?.length || 0), 0);
  const phrasesUsed = classroomSessions.reduce((sum, session) => sum + session.exchanges.filter((exchange) => exchange.speaker === 'teacher').length, 0);
  const favoriteCount = getSavedResourceIds().length;
  const recentSessions = classroomSessions.slice(0, 2);
  const nextLesson = recentLessons[0];
  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12
    ? 'Good morning'
    : currentDate.getHours() < 17
      ? 'Good afternoon'
      : 'Good evening';
  const formattedDate = currentDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const teachingRunway = [
    {
      label: 'Prepare',
      detail: nextLesson ? 'Lesson plan selected' : 'Create a lesson plan',
      complete: lessons.length > 0,
      tab: 'lessons' as const,
      icon: BookOpen
    },
    {
      label: 'Bridge',
      detail: translationHistory.length > 0 ? 'Phrase bridge tested' : 'Translate a classroom phrase',
      complete: translationHistory.length > 0,
      tab: 'translator' as const,
      icon: Languages
    },
    {
      label: 'Teach',
      detail: classroomSessions.length > 0 ? 'Live class recorded' : 'Start the live classroom',
      complete: classroomSessions.length > 0,
      tab: 'live-classroom' as const,
      icon: Radio
    },
    {
      label: 'Reinforce',
      detail: stats.worksheetsCreated > 0 ? 'Practice sheet ready' : 'Create a practice sheet',
      complete: stats.worksheetsCreated > 0,
      tab: 'worksheets' as const,
      icon: ClipboardCheck
    }
  ];
  const nextRunwayStep = teachingRunway.find((step) => !step.complete) || teachingRunway[teachingRunway.length - 1];
  const runwayProgress = Math.round((teachingRunway.filter((step) => step.complete).length / teachingRunway.length) * 100);
  return (
    <div id="dashboard-view" className="space-y-7 max-w-7xl mx-auto pb-10">
      {/* Hero Card */}
      <div
        id="dashboard-hero"
        className="np-hero-grid relative overflow-hidden rounded-[2rem] text-white p-6 sm:p-8 lg:p-10 border border-indigo-400/20 shadow-2xl shadow-indigo-950/25"
      >
        <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="max-w-2xl">
          <div className="np-live-status inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-300/25 text-emerald-200 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {settings.offlineMode ? 'Offline-first classroom ready' : 'Connected classroom mode'}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-indigo-200 mb-2">
            <span className="inline-flex items-center gap-1.5"><UserRound className="w-3.5 h-3.5" /> {greeting}, {settings.teacherName || 'Teacher'}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {formattedDate}</span>
          </div>
          <p className="text-amber-200/90 text-xs font-bold tracking-[0.16em] uppercase mb-2">Teacher command centre</p>
          <h2 className="np-hero-enter text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-white leading-[1.08]">
            Make every child feel<br className="hidden sm:block" /> understood.
          </h2>

          <p className="np-hero-enter-subheading mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            NeuroPathshala assists Hindi-medium primary teachers in delivering foundational
            literacy and numeracy (FLN) through mother-tongue bridge support in{' '}
            <strong className="text-emerald-300 font-semibold">Santhali</strong>, Ho, and Mundari.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="np-hero-enter-cta mt-7 flex flex-wrap items-center gap-3">
            <button
              id="dashboard-start-live-class-btn"
              onClick={() => setActiveTab('live-classroom')}
              className="np-primary-cta inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-950/30 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Start Live Class</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="dashboard-create-lesson-btn"
              onClick={() => setActiveTab('lessons')}
              className="np-secondary-cta inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-medium text-sm border border-white/10"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>Create Lesson</span>
            </button>

            <button
              id="dashboard-create-worksheet-btn"
              onClick={() => setActiveTab('worksheets')}
              className="np-secondary-cta inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-medium text-sm border border-white/10"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Create Worksheet</span>
            </button>

            <button
              id="dashboard-open-translator-btn"
              onClick={() => setActiveTab('translator')}
              className="np-secondary-cta inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-medium text-sm border border-white/10"
            >
              <Languages className="w-4 h-4 text-sky-300" />
              <span>Open Translator</span>
            </button>

          </div>
        </div>

        <div className="hidden w-[18rem] shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-xl lg:block">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] font-bold text-indigo-200">
            <span>Today at a glance</span>
            <Wifi className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200 font-bold">Offline classroom mode</p>
            <p className="mt-1 text-sm font-semibold text-white">{settings.offlineMode ? 'Local teaching resources ready' : 'Connected resources available'}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-indigo-100">Verified phrases and saved lesson materials remain available on this device.</p>
          </div>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-indigo-200 font-bold">Next prepared lesson</p>
            <p className="mt-1 text-sm font-semibold text-white line-clamp-2">{nextLesson?.title || 'Create your first lesson plan'}</p>
            <p className="mt-1 text-[11px] text-indigo-200">{nextLesson ? `${nextLesson.grade} · ${nextLesson.durationMinutes} minutes` : 'Start with a guided FLN plan'}</p>
          </div>
        </div>
        </div>

        {/* Decorative corner background motif */}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3" aria-label="Today's teaching priorities">
        <button type="button" onClick={() => setActiveTab('live-classroom')} className="group text-left rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-700">Priority 01</span>
            <Radio className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="mt-2 text-sm font-bold text-stone-900">Teach the next prepared lesson</p>
          <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">{nextLesson?.topic || 'Choose a foundational topic to begin.'}</p>
        </button>
        <button type="button" onClick={() => setActiveTab('translator')} className="group text-left rounded-2xl border border-sky-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-sky-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-sky-700">Priority 02</span>
            <Languages className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="mt-2 text-sm font-bold text-stone-900">Bridge one classroom phrase</p>
          <p className="mt-1 text-[11px] text-stone-500">{translationHistory.length} phrase{translationHistory.length === 1 ? '' : 's'} in your history</p>
        </button>
        <button type="button" onClick={() => setActiveTab('worksheets')} className="group text-left rounded-2xl border border-amber-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-amber-700">Priority 03</span>
            <ClipboardCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="mt-2 text-sm font-bold text-stone-900">Prepare the take-home practice</p>
          <p className="mt-1 text-[11px] text-stone-500">{stats.worksheetsCreated} worksheet{stats.worksheetsCreated === 1 ? '' : 's'} ready to print</p>
        </button>
        <button type="button" onClick={() => setActiveTab('teacher-survival-kit')} className="group text-left rounded-2xl border border-rose-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-rose-700">Priority 04</span>
            <Backpack className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="mt-2 text-sm font-bold text-stone-900">Open the classroom language reference</p>
          <p className="mt-1 text-[11px] text-stone-500">{verifiedPhraseCount} verified classroom phrases in the local resource catalog</p>
        </button>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm" aria-label="Classroom impact metrics">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-emerald-700">Impact</p>
            <h3 className="mt-1 text-xl font-bold text-stone-900">From teacher readiness to student learning</h3>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">NeuroPathshala helps Hindi-medium teachers overcome tribal-language barriers and deliver mother-tongue-supported learning.</p>
          </div>
          <p className="text-[11px] text-stone-500">Demo values from this device, not programme-wide claims.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Students assisted', value: classroomSessions.reduce((sum, session) => sum + session.studentResponsesCount, 0), note: 'Recorded student responses', tone: 'text-rose-700' },
            { label: 'Lessons supported', value: stats.lessonsCompleted, note: 'Saved FLN plans', tone: 'text-indigo-700' },
            { label: 'Verified classroom phrases', value: verifiedPhraseCount, note: 'Across bundled language resources', tone: 'text-emerald-700' },
            { label: 'Target languages', value: resourceList.length, note: 'Santhali, Ho, Mundari', tone: 'text-sky-700' },
            { label: 'Offline core resources', value: offlineCoreCount + lessons.length + worksheets.length + stats.flashcardsTotal, note: 'Local packs, lessons, sheets and cards', tone: 'text-amber-700' }
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-stone-50 p-3 border border-stone-100">
              <p className="text-[11px] font-semibold text-stone-500">{metric.label}</p>
              <p className={`mt-1 text-2xl font-extrabold ${metric.tone}`}>{metric.value}</p>
              <p className="mt-1 text-[10px] text-stone-400">{metric.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6 shadow-sm" aria-label="Language resource credibility">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-emerald-800">Responsible language support</p>
            <h3 className="mt-1 text-xl font-bold text-emerald-950">What the assistant can stand behind</h3>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-emerald-900">Local resource records keep their provenance and verification state. Connected AI is clearly separated from classroom-ready local content.</p>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-emerald-200 bg-white p-3"><p className="font-bold text-emerald-900">Verified</p><p className="mt-1 text-emerald-800">{verifiedPhraseCount} bundled Santhali classroom phrases with Ol Chiki and pronunciation metadata.</p></div>
          <div className="rounded-xl border border-sky-200 bg-white p-3"><p className="font-bold text-sky-900">AI-assisted</p><p className="mt-1 text-sky-800">Connected translation may help outside the local pack and must be reviewed before classroom use.</p></div>
          <div className="rounded-xl border border-amber-200 bg-white p-3"><p className="font-bold text-amber-900">Partial local coverage</p><p className="mt-1 text-amber-800">Ho vocabulary and corpus-derived Mundari phrases are bundled. Unsupported phrases and native audio may require connected services.</p></div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm" aria-label="Classroom activity">
        <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.16em] font-bold text-sky-700">Classroom activity</p><h3 className="mt-1 text-xl font-bold text-stone-900">What this device has recorded</h3></div><button type="button" onClick={() => setActiveTab('live-classroom')} className="text-xs font-bold text-sky-700 underline">Open classroom</button></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><p className="text-[11px] text-stone-500">Sessions</p><p className="mt-1 text-2xl font-bold text-stone-900">{classroomSessions.length}</p></div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><p className="text-[11px] text-stone-500">Teacher phrases used</p><p className="mt-1 text-2xl font-bold text-stone-900">{phrasesUsed}</p></div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><p className="text-[11px] text-stone-500">Observations</p><p className="mt-1 text-2xl font-bold text-stone-900">{observationsRecorded}</p></div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><p className="text-[11px] text-stone-500">Favorites</p><p className="mt-1 text-2xl font-bold text-stone-900">{favoriteCount}</p></div>
        </div>
      </section>

      <section id="dashboard-teaching-runway" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-indigo-600">Adaptive teaching runway</p>
            <h3 className="mt-1 text-xl font-bold text-stone-900">From preparation to practice</h3>
            <p className="mt-1 text-xs text-stone-500">A live checklist built from your saved classroom activity.</p>
          </div>
          <div className="min-w-44">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
              <span>{teachingRunway.filter((step) => step.complete).length} of {teachingRunway.length} stages complete</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" style={{ width: `${runwayProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {teachingRunway.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <button
                key={step.label}
                type="button"
                onClick={() => setActiveTab(step.tab)}
                className={`relative text-left rounded-2xl border p-3 transition-all hover:-translate-y-0.5 ${step.complete ? 'border-emerald-200 bg-emerald-50/70' : 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-400'}`}
              >
                {index < teachingRunway.length - 1 && (
                  <span className="hidden lg:block absolute top-7 -right-2 z-10 w-3 h-px bg-slate-300" />
                )}
                <div className="flex items-center justify-between">
                  <span className={`grid place-items-center w-8 h-8 rounded-xl ${step.complete ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    <StepIcon className="w-4 h-4" />
                  </span>
                  {step.complete && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="mt-3 text-xs font-bold text-stone-900">{index + 1}. {step.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-stone-500">{step.detail}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-indigo-950 px-4 py-3 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-indigo-200">Next best action</p>
            <p className="mt-1 text-sm font-semibold">{nextRunwayStep.detail}</p>
          </div>
          <button type="button" onClick={() => setActiveTab(nextRunwayStep.tab)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-950 hover:bg-indigo-50">
            Continue runway <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* PALASH deployment cockpit: translates the programme brief into a daily teacher view. */}
      <section id="dashboard-deployment-cockpit" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-indigo-600">PALASH deployment cockpit</p>
            <h3 className="mt-1 text-xl font-bold text-stone-900">Ready to bridge the next lesson</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Deployment capability map
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <button
            id="dashboard-offline-readiness-card"
            onClick={() => setActiveTab('settings')}
            className="text-left rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 hover:border-emerald-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-emerald-600 text-white"><WifiOff className="w-4 h-4" /></span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-emerald-800">Offline tablet mode</p>
            <p className="mt-1 text-sm font-bold text-stone-900">{settings.offlineMode ? 'Ready for field use' : 'Online mode enabled'}</p>
            <p className="mt-1 text-[11px] text-stone-500">Verified phrases and saved resources remain available locally; connected translation still needs internet.</p>
          </button>

          <button
            id="dashboard-language-coverage-card"
            onClick={() => setActiveTab('translator')}
            className="text-left rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 hover:border-sky-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-sky-600 text-white"><Languages className="w-4 h-4" /></span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-1 rounded-full">1 local pack</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-sky-800">Language bridge</p>
            <p className="mt-1 text-sm font-bold text-stone-900">{TRIBAL_LANGUAGES.length} language pathways</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRIBAL_LANGUAGES.map((language) => (
                <span key={language} className={`text-[10px] px-1.5 py-0.5 rounded-full ${TRIBAL_LANGUAGE_STATUS[language].local ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                  {language}: {TRIBAL_LANGUAGE_STATUS[language].label}
                </span>
              ))}
            </div>
          </button>

          <button
            id="dashboard-voice-bridge-card"
            onClick={() => setActiveTab('live-classroom')}
            className="text-left rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 hover:border-rose-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-rose-600 text-white"><Mic className="w-4 h-4" /></span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-full">Push to talk</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-rose-800">Voice classroom bridge</p>
            <p className="mt-1 text-sm font-bold text-stone-900">Hindi ↔ Santhali dialogue</p>
            <p className="mt-1 text-[11px] text-stone-500">Start a session with speech input and replayable prompts.</p>
          </button>

          <button
            id="dashboard-nipun-output-card"
            onClick={() => setActiveTab('worksheets')}
            className="text-left rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-600 text-white"><ClipboardCheck className="w-4 h-4" /></span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">NIPUN aligned</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-800">Curriculum outputs</p>
            <p className="mt-1 text-sm font-bold text-stone-900">{stats.worksheetsCreated} bilingual worksheet{stats.worksheetsCreated === 1 ? '' : 's'}</p>
            <p className="mt-1 text-[11px] text-stone-500">Generate low-cost practice and visual learning aids.</p>
          </button>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-950 p-4 sm:p-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200 font-bold">Recommended next action</p>
              <p className="mt-1 text-sm font-semibold">
                {translationHistory.length === 0
                  ? 'Translate one classroom instruction to seed your local language bridge.'
                  : classroomSessions.length === 0
                    ? 'Use the verified phrase set in a live class to test the voice workflow.'
                    : 'Review the latest classroom session and generate a targeted worksheet.'}
              </p>
            </div>
          </div>
          <button
            id="dashboard-recommended-action-btn"
            onClick={() => setActiveTab(translationHistory.length === 0 ? 'translator' : classroomSessions.length === 0 ? 'live-classroom' : 'worksheets')}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-950 hover:bg-indigo-50"
          >
            Open next tool <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Live translation', value: 'Hindi → Santhali', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Offline core available', value: 'Phrases + saved resources', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
          { label: 'Auto output', value: 'Worksheets + flashcards', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-3 ${item.tone}`}>
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-70">{item.label}</div>
            <div className="mt-2 text-sm font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Meaningful Real Analytics Grid (All from shared state!) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          id="stat-card-lessons"
          onClick={() => setActiveTab('lessons')}
          className="np-metric-card bg-white p-4 rounded-2xl hover:border-indigo-300 transition-all cursor-pointer" style={{ '--metric-accent': '#6366f1' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Lessons</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.lessonsCompleted}</div>
          <p className="text-[11px] text-stone-400 mt-1">Saved plans</p>
        </div>

        <div
          id="stat-card-worksheets"
          onClick={() => setActiveTab('worksheets')}
          className="np-metric-card bg-white p-4 rounded-2xl hover:border-emerald-300 transition-all cursor-pointer" style={{ '--metric-accent': '#10b981' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Worksheets</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.worksheetsCreated}</div>
          <p className="text-[11px] text-stone-400 mt-1">Printable sets</p>
        </div>

        <div
          id="stat-card-sessions"
          onClick={() => setActiveTab('live-classroom')}
          className="np-metric-card bg-white p-4 rounded-2xl hover:border-rose-300 transition-all cursor-pointer" style={{ '--metric-accent': '#f43f5e' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Live Sessions</span>
            <Radio className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.classroomSessionsCount}</div>
          <p className="text-[11px] text-stone-400 mt-1">Completed classes</p>
        </div>

        <div
          id="stat-card-translations"
          onClick={() => setActiveTab('translator')}
          className="np-metric-card bg-white p-4 rounded-2xl hover:border-sky-300 transition-all cursor-pointer" style={{ '--metric-accent': '#0ea5e9' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Translations</span>
            <Languages className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.translationsCount}</div>
          <p className="text-[11px] text-stone-400 mt-1">Phrases bridged</p>
        </div>

        <div
          id="stat-card-flashcards"
          onClick={() => setActiveTab('flashcards')}
          className="np-metric-card bg-white p-4 rounded-2xl hover:border-amber-300 transition-all cursor-pointer" style={{ '--metric-accent': '#f59e0b' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Flashcards</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.flashcardsLearnedCount}
            <span className="text-xs font-normal text-stone-400">/{stats.flashcardsTotal}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Mastered terms</p>
        </div>

        <div
          id="stat-card-language-lab"
          onClick={() => setActiveTab('language-lab')}
          className="np-metric-card bg-white p-4 rounded-2xl hover:border-purple-300 transition-all cursor-pointer" style={{ '--metric-accent': '#a855f7' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Language Lab</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.languagePracticeLearnedCount}
            <span className="text-xs font-normal text-stone-400">
              /{stats.languagePracticeTotal}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Teacher phrases</p>
        </div>
      </div>

      {/* Main Grid: Recent Lessons & Recent Classroom Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Lessons (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <h3 className="font-bold text-stone-900 text-base">Recent Lessons</h3>
            </div>
            <button
              id="view-all-lessons-btn"
              onClick={() => setActiveTab('lessons')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>View all ({lessons.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLessons.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500">
              <p className="text-sm">No lessons saved yet.</p>
              <button
                onClick={() => setActiveTab('lessons')}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                Create your first lesson
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  id={`dashboard-lesson-${lesson.id}`}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-indigo-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                        {lesson.grade}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                        {lesson.subject}
                      </span>
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.durationMinutes}m
                      </span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm sm:text-base leading-snug">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-1">
                      Context: {lesson.localContext} • {lesson.objective}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <button
                      id={`teach-lesson-${lesson.id}`}
                      onClick={() => startLiveClassFromLesson(lesson)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Start Live Class with this topic"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Teach</span>
                    </button>
                    <button
                      id={`worksheet-from-lesson-${lesson.id}`}
                      onClick={() => createWorksheetFromLesson(lesson)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Generate Worksheet from this lesson"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Worksheet</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Suggestion Strip */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold text-amber-900">Suggested FLN Activity:</span>
                <span className="text-amber-800 ml-1">
                  Teach counting 1 to 5 using forest Mahua seeds in Santhali.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('live-classroom')}
              className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium"
            >
              Start
            </button>
          </div>
        </div>

        {/* Recent Classroom Sessions & Activity Feed (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-stone-900 text-base">Recent Class Sessions</h3>
            </div>
            <button
              id="view-insights-from-sessions-btn"
              onClick={() => setActiveTab('learning-insights')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
                No classroom sessions recorded yet. Start a live class to begin tracking.
              </div>
            ) : (
              recentSessions.map((ses) => (
                <div
                  key={ses.id}
                  id={`dashboard-session-${ses.id}`}
                  className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                      {ses.grade} • {ses.subject}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {Math.round(ses.durationSeconds / 60)} mins
                    </span>
                  </div>

                  <h5 className="text-sm font-semibold text-stone-900">{ses.topic}</h5>

                  <div className="flex items-center justify-between text-xs text-stone-600 pt-1 border-t border-stone-100">
                    <span>{ses.translationCount} exchanges recorded</span>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Comprehension: {ses.comprehension}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Translation Bridge Feed */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-sky-600" />
                Recent Language Translations
              </span>
              <button
                onClick={() => setActiveTab('translator')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Open
              </button>
            </div>

            {translationHistory.slice(0, 3).map((tr) => (
              <div key={tr.id} className="text-xs space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <span>{tr.sourceLanguage} → {tr.targetLanguage}</span>
                  <span>{tr.timestamp}</span>
                </div>
                <div className="text-stone-800 font-medium truncate">"{tr.sourceText}"</div>
                <div className="text-emerald-700 truncate">↳ {tr.translatedText}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
