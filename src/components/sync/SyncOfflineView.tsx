import React, { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, HardDrive, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_RESOURCES } from '../../data/languageResources';

export const SyncOfflineView: React.FC = () => {
  const { settings, syncQueue, syncNow, lessons, worksheets, flashcards, translationHistory, languagePractice } = useApp();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [storageEstimate, setStorageEstimate] = useState<number | null>(null);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    if (navigator.storage?.estimate) navigator.storage.estimate().then(({ usage }) => setStorageEstimate(usage || 0)).catch(() => undefined);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);

  const localCounts = [
    ['Lessons', lessons.length], ['Worksheets', worksheets.length], ['Flashcards', flashcards.length],
    ['Translations', translationHistory.length], ['Practice phrases', languagePractice.length],
    ['Language phrases', Object.values(LANGUAGE_RESOURCES).reduce((total, resource) => total + resource.classroomPhrases.length, 0)]
  ];
  const formatBytes = (bytes: number | null) => bytes === null ? 'Unavailable' : bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

  return <section id="sync-offline-view" className="max-w-5xl mx-auto space-y-6 pb-12">
    <header><h2 className="text-2xl font-bold text-stone-900">Sync & Offline</h2><p className="mt-1 text-sm text-stone-500">Manage the classroom resources stored on this device.</p></header>
    <div className={`rounded-2xl border p-5 ${isOnline ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-stone-700">{isOnline ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <CloudOff className="h-5 w-5 text-amber-700" />}</span><div><p className="font-bold text-stone-900">{isOnline ? 'Connected' : 'Offline Mode'}</p><p className="text-xs text-stone-600">{isOnline ? 'Local changes can be synchronized.' : 'Core classroom resources remain available locally.'}</p></div></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-2xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Last synchronized</p><p className="mt-2 font-bold text-stone-900">{settings.lastSyncedAt || 'Not synchronized yet'}</p></div><div className="rounded-2xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Pending changes</p><p className="mt-2 font-bold text-stone-900">{syncQueue.length} domains</p></div><div className="rounded-2xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Estimated browser storage</p><p className="mt-2 font-bold text-stone-900">{formatBytes(storageEstimate)}</p></div></div>
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-stone-900">Resources available locally</h3><p className="mt-1 text-xs text-stone-500">Counts are read from the current local store.</p></div><button onClick={() => void syncNow()} disabled={!isOnline || settings.syncState === 'syncing'} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-900 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw className={`h-4 w-4 ${settings.syncState === 'syncing' ? 'animate-spin' : ''}`} />{settings.syncState === 'syncing' ? 'Synchronizing' : 'Sync now'}</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{localCounts.map(([label, count]) => <div key={label} className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-sm"><span className="text-stone-600">{label}</span><strong className="text-stone-900">{count}</strong></div>)}</div></div>
    <div className="flex items-center gap-2 text-xs text-stone-500"><HardDrive className="h-4 w-4" /> Local persistence uses the device browser store; connected AI results are not presented as offline resources.</div>
  </section>;
};
