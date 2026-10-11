import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ScheduleSection from './components/ScheduleSection';
import NotesSection from './components/NotesSection';
import PapersSection from './components/PapersSection';
import AssignmentsSection from './components/AssignmentsSection';
import AddScheduleModal from './components/AddScheduleModal';
import AddNoteModal from './components/AddNoteModal';
import AddPaperModal from './components/AddPaperModal';
import AddAssignmentModal from './components/AddAssignmentModal';
import AddQuizModal from './components/AddQuizModal';
import SubmitAssignmentModal from './components/SubmitAssignmentModal';
import QuizSection from './components/QuizSection';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './lib/auth';
import { usePortalData } from './lib/usePortalData';
import type { SectionId, Assignment } from './types';
import { Loader as Loader2, FlaskConical } from 'lucide-react';

const sectionTitles: Record<SectionId, string> = {
  schedule: 'Live Schedule & Links',
  notes: 'Lesson Notes',
  papers: 'Papers',
  assignments: 'Submissions',
  quizzes: 'Online Quizzes',
};

function PortalApp() {
  const { session, profile, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    schedule,
    notes,
    papers,
    assignments,
    submissions,
    loading: dataLoading,
    addSchedule,
    deleteSchedule,
    addNote,
    deleteNote,
    addPaper,
    deletePaper,
    addAssignment,
    deleteAssignment,
    submitAssignment,
    deleteSubmission,
    quizzes,
    quizAttempts,
    quizQuestionCounts,
    addQuiz,
    deleteQuiz,
    refreshQuizQuestionCounts,
  } = usePortalData(profile?.id);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);

  if (authLoading || (session && dataLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
          <FlaskConical size={24} className="text-white" />
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

  const mySubmissionForTarget = submitTarget
    ? submissions.find((s) => s.assignmentId === submitTarget.id && s.studentId === profile.id) ?? null
    : null;

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
          {activeSection === 'assignments' && (
            <AssignmentsSection
              assignments={assignments}
              submissions={submissions}
              teacherMode={isTeacher}
              currentUserId={profile.id}
              onAdd={() => setShowAssignmentModal(true)}
              onDelete={deleteAssignment}
              onSubmit={(a) => setSubmitTarget(a)}
              onDeleteSubmission={deleteSubmission}
            />
          )}
          {activeSection === 'quizzes' && (
            <QuizSection
              quizzes={quizzes}
              quizAttempts={quizAttempts}
              quizQuestionCounts={quizQuestionCounts}
              teacherMode={isTeacher}
              currentUserId={profile.id}
              currentEmail={profile.email}
              onAdd={() => setShowQuizModal(true)}
              onDelete={deleteQuiz}
              refreshQuestionCounts={refreshQuizQuestionCounts}
            />
          )}
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
      <AddAssignmentModal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onAdd={addAssignment}
      />
      <AddQuizModal
        open={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onAdd={addQuiz}
      />
      <SubmitAssignmentModal
        open={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        assignment={submitTarget}
        existingSubmission={mySubmissionForTarget}
        studentEmail={profile.email}
        onSubmit={submitAssignment}
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
