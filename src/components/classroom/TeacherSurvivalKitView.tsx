import React, { useEffect, useMemo, useState } from 'react';
import { Backpack, CheckCircle2, Info, Languages, Volume2, WifiOff, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getLanguageResource, searchLanguageResources } from '../../data/languageResources';
import { toLiveClassPhrase } from '../../data/resourceAdapters';
import { getRecentResourceIds, recordRecentResource, clearRecentResources } from '../../utils/recentResources';
import { LanguageResourceItem } from '../../types';
import { getAudioStatus, playAudio, isAudioAvailable } from '../../services/audioService';
import { TRIBAL_LANGUAGES, TRIBAL_LANGUAGE_PROFILES, TRIBAL_LANGUAGE_STATUS, TribalLanguage } from '../../types';

type KitCategory = 'Greetings' | 'Classroom Instructions' | 'Questions' | 'Literacy' | 'Numbers' | 'Mathematics' | 'Classroom Management' | 'Important / Emergency';

const CATEGORY_MAP: Record<KitCategory, string[]> = {
  Greetings: ['Greetings'],
  'Classroom Instructions': ['Activities', 'Classroom Management'],
  Questions: ['Assessment'],
  Literacy: ['Foundational Literacy'],
  Numbers: ['Numbers'],
  Mathematics: ['Foundational Numeracy'],
  'Classroom Management': ['Classroom Management'],
  'Important / Emergency': []
};

const CATEGORIES: KitCategory[] = Object.keys(CATEGORY_MAP) as KitCategory[];

export const TeacherSurvivalKitView: React.FC = () => {
  const { addTranslationRecord, showToast, setActiveTab, startLiveClassFromPhrase } = useApp();
  const [language, setLanguage] = useState<TribalLanguage>('Santhali');
  const [category, setCategory] = useState<KitCategory>('Classroom Management');
  const [search, setSearch] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>(getRecentResourceIds);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('neuropathshala_saved_resource_ids') || localStorage.getItem('neuropathshala_saved_phrases') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('neuropathshala_saved_resource_ids', JSON.stringify(savedIds));
  }, [savedIds]);

  const entries = useMemo(() => {
    const resourceEntries = search.trim()
      ? searchLanguageResources(search, language)
      : getLanguageResource(language).classroomPhrases;
    return resourceEntries.filter((entry) => CATEGORY_MAP[category].includes(entry.category));
  }, [category, language, search]);

  const savePhrase = (entry: LanguageResourceItem) => {
    const id = entry.id;
    if (savedIds.includes(id)) return;
    setSavedIds((current) => [...current, id]);
    setRecentIds(recordRecentResource(entry.id));
    addTranslationRecord({
      sourceLanguage: 'Hindi',
      targetLanguage: language,
      sourceText: entry.hindi,
      translatedText: entry.translation,
      isVerified: entry.verificationStatus === 'verified',
      statusNote: `Saved from the ${entry.verificationStatus} language resource.`
    });
    showToast('Phrase saved to translation history.', 'success');
  };

  const listen = (entry: LanguageResourceItem) => {
    const result = playAudio(entry.translation, language, {
      audioUrl: entry.audio?.verified ? entry.audio.url : undefined
    });
    showToast(result.message, result.success ? 'info' : 'warning');
  };

  const useInLiveClassroom = (entry: LanguageResourceItem) => {
    if (entry.verificationStatus !== 'verified') {
      showToast('Only verified phrases can be loaded directly into Live Classroom.', 'warning');
      return;
    }

    setRecentIds(recordRecentResource(entry.id));
    startLiveClassFromPhrase(toLiveClassPhrase(entry));
  };

  const recentEntries = recentIds
    .map((id) => getLanguageResource('Santhali').classroomPhrases.find((entry) => entry.id === id))
    .filter((entry): entry is LanguageResourceItem => Boolean(entry));

  return (
    <div id="teacher-survival-kit-view" className="np-survival-kit max-w-6xl mx-auto space-y-5 pb-12">
      <section className="rounded-2xl border border-[#294c40] bg-[#17372d] text-white p-5 sm:p-6 shadow-lg shadow-emerald-950/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              <Backpack className="w-3.5 h-3.5" /> Teacher reference · PALASH MTB-MLE
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-[2rem]">Classroom Language Reference</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/75">A verified phrase reference for Hindi-medium teachers working in multilingual primary classrooms. Find the Hindi instruction, review the local form, then use or save it for class.</p>
          </div>
          <div className="min-w-56 border-l border-emerald-200/20 pl-4 lg:max-w-xs">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300"><WifiOff className="w-4 h-4" /> Offline core</div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-50/75">Santhali verified phrases remain available on this device. Ho and Mundari require a connected language service.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100"><Languages className="h-4 w-4 text-stone-700" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Language coverage</p><h3 className="font-bold text-stone-900">Choose the classroom language</h3><p className="text-xs text-stone-500">Script information is shown separately from language availability.</p></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TRIBAL_LANGUAGES.map((item) => {
            const profile = TRIBAL_LANGUAGE_PROFILES[item];
            const status = TRIBAL_LANGUAGE_STATUS[item];
            return <button key={item} type="button" onClick={() => setLanguage(item)} className={`text-left rounded-xl border p-3 transition-colors ${language === item ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600' : 'border-stone-200 hover:border-stone-400'}`}>
              <div className="flex items-center justify-between"><span className="font-bold text-sm text-stone-900">{item}</span><span className={`text-[10px] rounded-full px-2 py-0.5 font-semibold ${status.local ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>{status.label}</span></div>
              <p className="mt-1 text-xs text-stone-500">Script: {profile.script}</p>
              <p className="mt-1 text-[11px] text-stone-400">{status.note}</p>
            </button>;
          })}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Classroom Language Reference categories">
        {CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold ${category === item ? 'bg-indigo-600 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}>{item}</button>)}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <label htmlFor="survival-kit-search" className="text-xs font-bold text-stone-700">Search Hindi, language, English, or category</label>
        <input id="survival-kit-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try: book" className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
      </div>

      {language === 'Santhali' && recentEntries.length > 0 && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4" aria-labelledby="recent-resources-heading">
          <div className="flex items-center justify-between gap-3">
            <div><h3 id="recent-resources-heading" className="text-sm font-bold text-indigo-950">Recently used</h3><p className="mt-1 text-[11px] text-indigo-800">Quickly return to phrases used or opened on this device.</p></div>
            <button type="button" onClick={() => { clearRecentResources(); setRecentIds([]); }} className="text-[11px] font-semibold text-indigo-700 underline">Clear</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentEntries.map((entry) => <button key={entry.id} type="button" onClick={() => useInLiveClassroom(entry)} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-left text-xs text-indigo-950 hover:bg-indigo-100"><span className="font-bold">{entry.hindi}</span><span className="mt-0.5 block text-[10px] text-indigo-700">{entry.translation}</span></button>)}
          </div>
        </section>
      )}

      {language !== 'Santhali' ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 text-center">
          <Info className="mx-auto h-7 w-7 text-sky-600" />
          <h3 className="mt-3 font-bold text-sky-950">Verified phrase pack not bundled yet</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm text-sky-900">{language} is available as a connected-service pathway. This demo does not invent or present unverified {language} translations. Use the Translator when the language service is connected.</p>
          <button type="button" onClick={() => setActiveTab('translator')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-bold text-white">Open connected translator <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><Info className="mx-auto h-7 w-7 text-amber-600" /><h3 className="mt-3 font-bold text-amber-950">Translation unavailable for this category</h3><p className="mt-1 text-sm text-amber-900">Try a verified classroom phrase from another category.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {entries.map((entry) => {
            const phraseId = entry.id;
            const saved = savedIds.includes(phraseId);
            const audioAvailable = isAudioAvailable(language, entry.audio?.verified ? entry.audio.url : undefined);
            const audioStatus = getAudioStatus(language, entry.audio?.verified ? entry.audio.url : undefined);
            const audioLabel = audioStatus.providerType === 'verified-recording' ? 'Listen' : 'Preview voice';
            return <article key={phraseId} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Hindi</p><p className="mt-1 font-bold text-stone-900">{entry.hindi}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800"><CheckCircle2 className="w-3 h-3" /> {entry.verificationStatus === 'verified' ? 'Verified classroom phrase' : 'Demo/sample'}</span></div>
              <div className="mt-4 rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">{language} · {TRIBAL_LANGUAGE_PROFILES[language].script}</p><p className="mt-1 text-lg font-bold text-emerald-950">{entry.translation}</p><p className="mt-1 text-xs text-emerald-800">Pronunciation: {entry.pronunciation || 'Unavailable'}</p><p className="mt-1 text-[11px] text-emerald-800/80">Source: {entry.source.name}</p></div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => useInLiveClassroom(entry)} className="order-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 focus-visible:outline-indigo-700">Use in Live Classroom <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button><button type="button" onClick={() => listen(entry)} disabled={!audioAvailable} title={audioAvailable ? audioStatus.reason : 'Audio preview unavailable in this browser'} className="order-2 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Volume2 className="w-3.5 h-3.5" /> {audioAvailable ? audioLabel : 'Audio unavailable'}</button><button type="button" onClick={() => savePhrase(entry)} disabled={saved} className="order-3 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 disabled:bg-stone-100 disabled:text-stone-400">{saved ? 'Saved for class' : 'Save phrase'}</button></div>
              <p className="mt-3 text-[11px] text-stone-500">{entry.english || 'Classroom resource'}</p>
            </article>;
          })}
        </div>
      )}
    </div>
  );
};