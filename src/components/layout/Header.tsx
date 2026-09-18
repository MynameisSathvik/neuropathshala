import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  WifiOff,
  Wifi,
  RefreshCw,
  Menu,
  Sparkles,
  Layers,
  FileText,
  BookOpen,
  Radio,
  Check
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    activeTab,
    settings,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    clearAllNotifications,
    syncNow
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Classroom Dashboard',
          hindiTitle: 'शिक्षक डैशबोर्ड',
          desc: 'Your mother-tongue classroom assistant for Jharkhand PALASH MTB-MLE'
        };
      case 'live-classroom':
        return {
          title: 'Live Classroom Assistant',
          hindiTitle: 'लाइव कक्षा सहायक',
          desc: 'Bidirectional Hindi ↔ selected tribal language support for foundational learning'
        };
      case 'teacher-survival-kit':
        return {
          title: 'Classroom Language Reference',
          hindiTitle: 'कक्षा भाषा संदर्भ',
          desc: 'Verified classroom phrases for a Hindi-medium teacher entering a tribal-language classroom'
        };
      case 'translator':
        return {
          title: 'Hindi ↔ Santhali Language Bridge',
          hindiTitle: 'भाषा सेतु',
          desc: 'Classroom phrase translation and local vocabulary lookup'
        };
      case 'lessons':
        return {
          title: 'Lesson Library & Generator',
          hindiTitle: 'पाठ योजना एवं निर्माण',
          desc: 'Foundational literacy & numeracy lessons enriched with local Jharkhand contexts'
        };
      case 'worksheets':
        return {
          title: 'Worksheets & Printables',
          hindiTitle: 'कार्यपत्रक एवं अभ्यास',
          desc: 'Child-friendly primary school worksheets with bilingual mother-tongue prompts'
        };
      case 'flashcards':
        return {
          title: 'Foundational Flashcards',
          hindiTitle: 'बुनियादी फ़्लैशकार्ड्स',
          desc: 'Interactive visual flashcards for numbers, letters, words, and shapes'
        };
      case 'language-lab':
        return {
          title: 'Teacher Language Lab',
          hindiTitle: 'शिक्षक भाषा अभ्यास केंद्र',
          desc: 'Teacher oral mastery in Santhali classroom commands & encouragement'
        };
      case 'resource-library':
        return {
          title: 'Resource Library',
          hindiTitle: 'संसाधन पुस्तकालय',
          desc: 'Search synchronized lessons, translations, worksheets, flashcards, and classroom phrases'
        };
      case 'learning-insights':
        return {
          title: 'Learning Insights & Adaptive Loop',
          hindiTitle: 'सीखने के रुझान एवं अनुकूलन',
          desc: 'Classroom engagement trends and data-driven teaching recommendations'
        };
      case 'sync-offline':
        return {
          title: 'Sync & Offline',
          hindiTitle: 'सिंक और ऑफलाइन',
          desc: 'Manage local classroom resources and synchronize changes when connected'
        };
      case 'settings':
        return {
          title: 'Teacher & App Settings',
          hindiTitle: 'सेटिंग्स',
          desc: 'Offline preferences, language settings, and app data controls'
        };
      default:
        return {
          title: 'NeuroPathshala',
          hindiTitle: 'न्यूरोपाठशाला',
          desc: 'Offline classroom language bridge for mother-tongue education'
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header
      id="global-header"
      className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm shadow-slate-900/[0.03]"
    >
      {/* Left: Mobile hamburger + Page title */}
      <div className="flex items-center gap-3">
        <button
          id="open-mobile-sidebar"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {meta.title}
            </h1>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              {meta.hindiTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden md:block mt-0.5 max-w-2xl truncate">
            {meta.desc}
          </p>
        </div>
      </div>

      {/* Right: Offline / Sync badge & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Status Badge */}
        <div
          id="sync-status-indicator"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${isOnline ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800 shadow-emerald-950/[0.03]' : 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-950/[0.03]'}`}
          title={isOnline ? 'Connected. Verified local teaching resources remain available.' : 'Offline. Verified local teaching resources remain available; connected AI is unavailable.'}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span className="hidden sm:inline">{isOnline ? 'Connected · Offline Core Available' : 'Offline · Local Core Available'}</span>
          <span className="sm:hidden max-[359px]:hidden">{isOnline ? 'Connected' : 'Offline'}</span>
          <button
            id="quick-demo-sync-btn"
            onClick={() => { void syncNow(); }}
            title="Synchronize saved local changes"
            className="ml-1 p-0.5 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
            aria-label="Synchronize data"
          >
            <RefreshCw
              className={`w-3 h-3 ${settings.syncState === 'syncing' ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white/70 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shadow-sm shadow-slate-900/[0.02]"
            aria-label={`Notifications, ${unreadNotificationCount} unread`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span
                id="notification-unread-count"
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              id="notifications-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 overflow-hidden"
            >
              <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-stone-900">Local Notifications</span>
                  <span className="text-xs bg-stone-200 px-1.5 py-0.5 rounded-full text-stone-700">
                    {notifications.length}
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    id="clear-all-notifications-btn"
                    onClick={clearAllNotifications}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-stone-400">
                    No notifications yet. Activity will appear here.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      id={`notif-item-${notif.id}`}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 text-xs cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        notif.read ? 'bg-white hover:bg-stone-50' : 'bg-indigo-50/40 hover:bg-indigo-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                          <p className="font-semibold text-stone-900">{notif.title}</p>
                        </div>
                        <p className="text-stone-600 mt-0.5 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-stone-400 mt-1 block">{notif.timestamp}</span>
                      </div>
                      {!notif.read && (
                        <button
                          title="Mark as read"
                          className="text-stone-400 hover:text-indigo-600 p-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-stone-50/80 border-t border-stone-200 text-center text-[11px] text-stone-500">
                Offline local notification log
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
