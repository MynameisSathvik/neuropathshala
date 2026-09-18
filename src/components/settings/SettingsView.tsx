import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_RESOURCES } from '../../data/languageResources';
import {
  Save,
  User,
  MapPin,
  Languages,
  HardDrive,
  RefreshCw
} from 'lucide-react';

const JHARKHAND_DISTRICTS = [
  'Dumka (ᱫᱩᱢᱠᱟᱹ)',
  'East Singhbhum (Jamshedpur)',
  'West Singhbhum (Chaibasa)',
  'Ranchi (ᱨᱟᱺᱪᱤ)',
  'Pakur (ᱯᱟᱠᱩᱲ)',
  'Jamtara (ᱡᱟᱢᱛᱟᱲᱟ)',
  'Sahibganj',
  'Godda',
  'Deoghar',
  'Saraikela Kharsawan'
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    syncNow,
    syncQueue,
    lessons,
    worksheets,
    classroomSessions,
    
  } = useApp();

  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [district, setDistrict] = useState(settings.district);
  const [offlineMode, setOfflineMode] = useState(settings.offlineMode);
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveSettings = () => {
    updateSettings({
      teacherName,
      district,
      offlineMode
    });
  };

  const resourceDiagnostics = Object.values(LANGUAGE_RESOURCES).map((resource) => ({
    ...resource,
    verifiedCount: resource.classroomPhrases.filter((item) => item.verificationStatus === 'verified').length,
    audioCount: resource.classroomPhrases.filter((item) => item.audio?.verified).length
  }));

  return (
    <div id="settings-view" className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          Teacher & App Settings
        </h2>
        <p className="text-xs sm:text-sm text-stone-500">
          Configure teacher profile, language preferences, and offline classroom storage.
        </p>
      </div>

      {/* Teacher Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-stone-900 text-base">Teacher Profile</h3>
          </div>
          <span className="text-xs text-stone-400">Jharkhand PALASH Context</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              Teacher Name
            </label>
            <input
              id="settings-teacher-name-input"
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              District (Jharkhand)
            </label>
            <select
              id="settings-district-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-indigo-500"
            >
              {JHARKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-stone-400" />
              Primary Medium of Instruction
            </label>
            <input
              type="text"
              disabled
              value="Hindi (PALASH MTB-MLE)"
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            id="save-settings-btn"
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Offline Storage & Sync Panel */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-base">Offline Storage & Synchronization</h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-stone-500">Saved Lesson Plans</div>
            <div className="text-xl font-bold text-stone-900 mt-1">{lessons.length}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Persisted locally</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-stone-500">Worksheet Sets</div>
            <div className="text-xl font-bold text-stone-900 mt-1">{worksheets.length}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Ready for print</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-stone-500">Classroom Sessions</div>
            <div className="text-xl font-bold text-stone-900 mt-1">{classroomSessions.length}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Telemetry stored</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setOfflineMode(!offlineMode);
                updateSettings({ offlineMode: !offlineMode });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                offlineMode ? 'bg-emerald-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  offlineMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-stone-800">
              Offline Core Available (verified phrases and saved resources stay on this device)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500">
              {syncQueue.length === 0 ? 'All changes synchronized' : `${syncQueue.length} pending domain${syncQueue.length === 1 ? '' : 's'}`} 
              {syncQueue.length > 0 && `(${syncQueue.reduce((total, item) => total + item.attempts, 0)} retries)`}
            </span>
            <button
            id="settings-sync-now-btn"
            onClick={syncNow}
            disabled={!isOnline || settings.syncState === 'syncing'}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${settings.syncState === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>{settings.syncState === 'syncing' ? 'Syncing...' : 'Sync now'}</span>
          </button>
          </div>
        </div>
      </div>

      <details className="bg-white rounded-2xl border border-stone-200 shadow-2xs">
        <summary className="cursor-pointer px-6 py-5 text-sm font-bold text-stone-900">Language resource diagnostics</summary>
        <div className="border-t border-stone-100 p-6 space-y-3">
          <p className="text-xs text-stone-500">Bundled resource state for demo review. Connected AI results and unbundled languages are not counted as local resources.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {resourceDiagnostics.map((resource) => (
              <div key={resource.language} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                <p className="font-bold text-stone-900">{resource.language}</p>
                <p className="mt-1 text-stone-600">Verified resources: {resource.verifiedCount}</p>
                <p className="text-stone-600">Scripts: {resource.scripts.length ? resource.scripts.join(', ') : 'None bundled'}</p>
                <p className="text-stone-600">Audio: {resource.audioCount}</p>
                <p className="text-stone-600">Offline: {resource.offlineAvailable ? 'Available' : 'Unavailable'}</p>
              </div>
            ))}
          </div>
        </div>
      </details>

    </div>
  );
};
