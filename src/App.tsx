import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { LiveClassroomView } from './components/classroom/LiveClassroomView';
import { TeacherSurvivalKitView } from './components/classroom/TeacherSurvivalKitView';
import { TranslatorView } from './components/translator/TranslatorView';
import { LessonsView } from './components/lessons/LessonsView';
import { WorksheetsView } from './components/worksheets/WorksheetsView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { LanguageLabView } from './components/languagelab/LanguageLabView';
import { LearningInsightsView } from './components/insights/LearningInsightsView';
import { ResourceLibraryView } from './components/resources/ResourceLibraryView';
import { SyncOfflineView } from './components/sync/SyncOfflineView';
import { SettingsView } from './components/settings/SettingsView';
import { TeacherOnboardingView } from './components/onboarding/TeacherOnboardingView';

const MainAppLayout: React.FC = () => {
  const { activeTab, settings } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!settings.onboardingCompleted) {
    return <TeacherOnboardingView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'live-classroom':
        return <LiveClassroomView />;
      case 'teacher-survival-kit':
        return <TeacherSurvivalKitView />;
      case 'translator':
        return <TranslatorView />;
      case 'lessons':
        return <LessonsView />;
      case 'worksheets':
        return <WorksheetsView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'language-lab':
        return <LanguageLabView />;
      case 'resource-library':
        return <ResourceLibraryView />;
      case 'learning-insights':
        return <LearningInsightsView />;
      case 'sync-offline':
        return <SyncOfflineView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div id="neuropathshala-root" className="min-h-screen text-slate-900 flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72 transition-all duration-200">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main id="main-content-scroll-container" className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}
