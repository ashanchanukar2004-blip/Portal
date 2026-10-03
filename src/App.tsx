import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ScheduleSection from './components/ScheduleSection';
import NotesSection from './components/NotesSection';
import PapersSection from './components/PapersSection';
import AddScheduleModal from './components/AddScheduleModal';
import AddNoteModal from './components/AddNoteModal';
import AddPaperModal from './components/AddPaperModal';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './lib/auth';
import { usePortalData } from './lib/usePortalData';
import type { SectionId } from './types';
import { Loader as Loader2, FlaskConical } from 'lucide-react';

const sectionTitles: Record<SectionId, string> = {
  schedule: 'Live Schedule & Links',
  notes: 'Lesson Notes',
  papers: 'Papers',
};

function PortalApp() {
  const { session, profile, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    schedule,
    notes,
    papers,
    loading: dataLoading,
    addSchedule,
    deleteSchedule,
    addNote,
    deleteNote,
    addPaper,
    deletePaper,
  } = usePortalData();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);

  if (authLoading || (session && dataLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 animate-scale-in">
          <FlaskConical size={26} className="text-white" />
        </div>
        <Loader2 size={22} className="animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading Molekul...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthScreen />;
  }

  const isTeacher = profile.role === 'teacher';

  const handleNavigate = (id: SectionId) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        active={activeSection}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={profile.email}
        userRole={profile.role}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          isTeacher={isTeacher}
          onOpenSidebar={() => setSidebarOpen(true)}
          title={sectionTitles[activeSection]}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
          <div key={activeSection} className="animate-fade-in-up">
            {activeSection === 'schedule' && (
              <ScheduleSection
                slots={schedule}
                teacherMode={isTeacher}
                onAdd={() => setShowScheduleModal(true)}
                onDelete={deleteSchedule}
              />
            )}
            {activeSection === 'notes' && (
              <NotesSection
                notes={notes}
                teacherMode={isTeacher}
                onAdd={() => setShowNoteModal(true)}
                onDelete={deleteNote}
              />
            )}
            {activeSection === 'papers' && (
              <PapersSection
                papers={papers}
                teacherMode={isTeacher}
                onAdd={() => setShowPaperModal(true)}
                onDelete={deletePaper}
              />
            )}
          </div>
        </main>

        <footer className="px-4 sm:px-6 py-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Molekul &middot; For educational use &middot; {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      <AddScheduleModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onAdd={addSchedule}
      />
      <AddNoteModal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onAdd={addNote}
      />
      <AddPaperModal
        open={showPaperModal}
        onClose={() => setShowPaperModal(false)}
        onAdd={addPaper}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalApp />
    </AuthProvider>
  );
}
