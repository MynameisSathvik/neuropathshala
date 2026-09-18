import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_RESOURCES } from '../../data/languageResources';
import { TRIBAL_LANGUAGES, TribalLanguage } from '../../types';
import { getAudioStatus } from '../../services/audioService';

export const TeacherOnboardingView: React.FC = () => {
  const { updateSettings, setActiveTab } = useApp();
  const [language, setLanguage] = useState<TribalLanguage>('Santhali');
  const [grade, setGrade] = useState('Grade 2');
  const [subject, setSubject] = useState('Foundational Literacy');

  const finish = () => {
    updateSettings({
      targetLanguage: language,
      primaryGrade: grade as 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5',
      onboardingCompleted: true
    });
    setActiveTab('teacher-survival-kit');
  };

  return (
    <main className="np-onboarding min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="np-onboarding-hero relative overflow-hidden rounded-[2rem] bg-[#183a2f] px-6 py-7 text-white shadow-2xl shadow-emerald-950/15 sm:px-9 sm:py-9">
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-200/10 px-3 py-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> NeuroPathshala</span>
              <span className="text-emerald-300/60">PALASH MTB-MLE</span>
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">Make the first words feel familiar.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50/75 sm:text-base">A Hindi-medium teaching assistant for mother-tongue-supported foundational learning. Choose a language, see what is actually bundled, and take one verified phrase into class.</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-emerald-100/80">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-amber-300" /> Traceable resources</span>
              <span className="inline-flex items-center gap-1.5"><WifiOff className="h-4 w-4 text-emerald-300" /> Designed for offline schools</span>
            </div>
          </div>
          <div className="np-onboarding-sun absolute -right-16 -top-24 h-72 w-72 rounded-full border-[24px] border-amber-200/10 shadow-[0_0_0_22px_rgba(255,255,255,.04),0_0_0_48px_rgba(236,184,94,.05)]" aria-hidden="true" />
          <div className="absolute bottom-0 right-8 hidden h-28 w-44 rounded-t-[5rem] border-x border-t border-emerald-200/20 bg-emerald-100/5 sm:block" aria-hidden="true" />
        </header>

        <section className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(31,61,46,.06)] sm:p-7" aria-labelledby="onboarding-language-heading">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Step 01 · Language bridge</p>
              <h2 id="onboarding-language-heading" className="mt-1 text-lg font-bold text-stone-950">Choose the classroom language</h2>
              <p className="mt-1 text-xs text-stone-500">Verified local resources are preferred. Connected translation is always labelled separately.</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[11px] font-bold text-stone-500 sm:inline-flex"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> {TRIBAL_LANGUAGES.length} pathways</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {TRIBAL_LANGUAGES.map((item) => {
              const resource = LANGUAGE_RESOURCES[item];
              const selected = language === item;
              const audioStatus = getAudioStatus(item);
              return (
                <button key={item} type="button" aria-pressed={selected} onClick={() => setLanguage(item)} className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selected ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-500 shadow-md shadow-emerald-900/10' : 'border-stone-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-900/5'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-950">{item}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-label="Selected" />}
                  </div>
                  <div className={`mt-3 h-1 w-12 rounded-full transition-all ${selected ? 'bg-emerald-500' : 'bg-stone-200 group-hover:w-16 group-hover:bg-emerald-300'}`} />
                  <p className="mt-2 text-xs text-stone-600">Verified local resources: <strong>{resource.classroomPhrases.filter((entry) => entry.verificationStatus === 'verified').length}</strong></p>
                  <p className="mt-1 text-xs text-stone-600">Script: <strong>{resource.scripts.length ? resource.scripts.join(', ') : 'Not bundled'}</strong></p>
                  <p className="mt-1 text-xs text-stone-600">Offline: <strong>{resource.offlineAvailable ? 'Available' : 'Unavailable locally'}</strong></p>
                  <p className="mt-1 text-xs text-stone-600">Audio: <strong>{resource.classroomPhrases.some((entry) => entry.audio?.verified) ? 'Verified recordings' : audioStatus.available ? 'Speech preview' : 'Unavailable'}</strong></p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(31,61,46,.06)] sm:grid-cols-[1fr_1.15fr] sm:p-7" aria-labelledby="onboarding-context-heading">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Step 02 · Teaching context</p>
            <h2 id="onboarding-context-heading" className="mt-1 text-lg font-bold text-stone-950">Set the first classroom moment</h2>
            <p className="mt-1 text-xs text-stone-500">This helps the first classroom screen open at the right level.</p>
            <div className="mt-5 hidden items-center gap-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-950 sm:flex"><BookOpen className="h-5 w-5 shrink-0 text-amber-700" /><span>Start small: one grade, one learning goal, one phrase children can use today.</span></div>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-stone-700">Grade
              <select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm">
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-stone-700">Focus
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm">
                <option>Foundational Literacy</option>
                <option>Foundational Numeracy</option>
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="How NeuroPathshala works">
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/75 p-4"><WifiOff className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-xs font-bold text-emerald-950">Works offline</p><p className="mt-1 text-xs leading-relaxed text-emerald-900">Bundled verified resources, lessons, worksheets, flashcards, and saved observations.</p></div>
          <div className="rounded-2xl border border-sky-200/80 bg-sky-50/75 p-4"><Wifi className="h-5 w-5 text-sky-700" /><p className="mt-3 text-xs font-bold text-sky-950">Connected when needed</p><p className="mt-1 text-xs leading-relaxed text-sky-900">AI translation and remote services require internet and are not automatically verified.</p></div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/75 p-4"><CheckCircle2 className="h-5 w-5 text-amber-700" /><p className="mt-3 text-xs font-bold text-amber-950">Verified means traceable</p><p className="mt-1 text-xs leading-relaxed text-amber-900">Local phrases show their source, script, pronunciation, and audio availability.</p></div>
        </section>

        <div className="flex flex-col items-stretch justify-between gap-3 rounded-3xl bg-stone-900 p-4 text-white shadow-xl shadow-stone-950/10 sm:flex-row sm:items-center sm:p-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Ready when you are</p><p className="mt-1 text-sm text-stone-300">Your first classroom bridge will open with {language} resources.</p></div>
          <button type="button" onClick={finish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-950 shadow-lg shadow-amber-950/20 transition-colors hover:bg-amber-300">Try a verified phrase <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </main>
  );
};
