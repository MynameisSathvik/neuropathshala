import React, { useMemo, useState } from 'react';
import { BookOpen, FileText, Layers, Languages, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_RESOURCES } from '../../data/languageResources';

export const ResourceLibraryView: React.FC = () => {
  const { lessons, worksheets, flashcards, translationHistory, setActiveTab } = useApp();
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const resources = useMemo(() => [
    ...lessons.map((item) => ({ id: item.id, type: 'Lesson', title: item.title, detail: `${item.grade} · ${item.subject}`, action: () => setActiveTab('lessons'), icon: BookOpen })),
    ...worksheets.map((item) => ({ id: item.id, type: 'Worksheet', title: item.title, detail: `${item.grade} · ${item.questions.length} questions`, action: () => setActiveTab('worksheets'), icon: FileText })),
    ...flashcards.map((item) => ({ id: item.id, type: 'Flashcard', title: item.frontHindi, detail: `${item.category} · ${item.targetLanguage || 'Santhali'}`, action: () => setActiveTab('flashcards'), icon: Layers })),
    ...translationHistory.map((item) => ({ id: item.id, type: 'Translation', title: item.sourceText, detail: `${item.sourceLanguage} to ${item.targetLanguage}`, action: () => setActiveTab('translator'), icon: Languages }))
  ].filter((item) => !normalizedQuery || `${item.type} ${item.title} ${item.detail}`.toLowerCase().includes(normalizedQuery)), [lessons, worksheets, flashcards, translationHistory, normalizedQuery, setActiveTab]);

  return (
    <section id="resource-library-view" className="max-w-6xl mx-auto space-y-6 pb-12">
      <header>
        <h2 className="text-2xl font-bold text-stone-900">Resource Library</h2>
        <p className="mt-1 text-sm text-stone-500">Search resources already available on this device.</p>
      </header>
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <Search className="h-5 w-5 text-stone-400" aria-hidden="true" />
        <input aria-label="Search local resources" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons, worksheets, flashcards, translations" className="min-h-11 w-full border-0 text-sm outline-none" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return <button key={`${resource.type}-${resource.id}`} onClick={resource.action} className="flex min-h-28 items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300" aria-label={`Open ${resource.type}: ${resource.title}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-700"><Icon className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">{resource.type}</span><span className="mt-1 block truncate text-sm font-bold text-stone-900">{resource.title}</span><span className="mt-1 block text-xs text-stone-500">{resource.detail}</span><span className="mt-2 block text-[11px] font-semibold text-indigo-700">Available locally</span></span>
          </button>;
        })}
      </div>
      {resources.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-600">No local resources match this search.</div>}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900">Bundled language resources: {Object.values(LANGUAGE_RESOURCES).reduce((total, resource) => total + resource.classroomPhrases.length, 0)} classroom phrases. Connected translations are not counted as offline resources.</div>
    </section>
  );
};
