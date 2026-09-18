import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Radio,
  Backpack,
  Languages,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  TrendingUp,
  Library,
  CloudCog,
  Settings,
  GraduationCap,
  Wifi,
  WifiOff,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  hindiLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    hindiLabel: 'डैशबोर्ड',
    icon: LayoutDashboard
  },
  {
    id: 'live-classroom',
    label: 'Live Classroom',
    hindiLabel: 'लाइव कक्षा',
    icon: Radio,
    badge: 'Active'
  },
  {
    id: 'teacher-survival-kit',
    label: 'Language Reference',
    hindiLabel: 'कक्षा भाषा संदर्भ',
    icon: Backpack,
    badge: 'Field'
  },
  {
    id: 'translator',
    label: 'Translator',
    hindiLabel: 'भाषा सेतु',
    icon: Languages
  },
  {
    id: 'lessons',
    label: 'Lessons',
    hindiLabel: 'पाठ योजना',
    icon: BookOpen
  },
  {
    id: 'worksheets',
    label: 'Worksheets',
    hindiLabel: 'कार्यपत्रक',
    icon: FileText
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    hindiLabel: 'फ़्लैशकार्ड्स',
    icon: Layers
  },
  {
    id: 'language-lab',
    label: 'Language Lab',
    hindiLabel: 'भाषा अभ्यास',
    icon: Sparkles
  },
  {
    id: 'resource-library',
    label: 'Resource Library',
    hindiLabel: 'संसाधन पुस्तकालय',
    icon: Library
  },
  {
    id: 'learning-insights',
    label: 'Learning Insights',
    hindiLabel: 'सीखने के रुझान',
    icon: TrendingUp
  },
  {
    id: 'sync-offline',
    label: 'Sync & Offline',
    hindiLabel: 'सिंक और ऑफलाइन',
    icon: CloudCog
  }
];

export const Sidebar: React.FC<{
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, settings, stats } = useApp();

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 md:w-72 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800/90 shadow-2xl shadow-slate-950/20 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-indigo-950/40">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                NeuroPathshala
              </div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-emerald-400">
                Offline classroom language bridge
              </p>
            </div>
          </div>
          <button
            id="close-mobile-menu"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Jharkhand PALASH MTB-MLE Subtitle pill */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px] text-emerald-300">MTB-MLE classroom support</span>
            </div>
            <span className="text-[10px] text-slate-400">Jharkhand Context</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                style={{ animationDelay: `${NAV_ITEMS.indexOf(item) * 70}ms` }}
                className={`np-nav-enter w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className="leading-none">{item.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 font-normal ${
                        isActive ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {item.hindiLabel}
                    </div>
                  </div>
                </div>
                {item.id === 'live-classroom' && (
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                )}
                {item.id === 'flashcards' && stats.flashcardsLearnedCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {stats.flashcardsLearnedCount}/{stats.flashcardsTotal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & Offline/Sync State */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            id="nav-item-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <div className="text-left">
                <div className="leading-none">Settings</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ऐप और प्रोफ़ाइल सेटिंग्स</div>
              </div>
            </div>
          </button>

          {/* Teacher Profile Card */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <p className="font-medium text-slate-200 truncate">{settings.teacherName}</p>
                <p className="text-[11px] text-slate-400 truncate">{settings.district} · Teacher profile</p>
              </div>
              <div
                title={settings.offlineMode ? 'Offline Database Ready' : 'Online Mode'}
                className="flex items-center gap-1 shrink-0 px-2 py-1 rounded bg-slate-800 text-[10px] text-emerald-400 font-medium"
              >
                {settings.offlineMode ? (
                  <>
                    <WifiOff className="w-3 h-3 text-emerald-400" />
                    <span>Offline</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3 text-sky-400" />
                    <span>Online</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
