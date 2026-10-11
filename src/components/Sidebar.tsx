import { Calendar, FileText, ClipboardList, FlaskConical, X, LogOut, GraduationCap, ShieldCheck, CalendarClock, ListChecks } from 'lucide-react';
import type { SectionId } from '../types';
import type { UserRole } from '../lib/supabase';

interface SidebarProps {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  open: boolean;
  onClose: () => void;
  userEmail: string;
  userRole: UserRole;
  onSignOut: () => void;
}

const items: { id: SectionId; label: string; icon: typeof Calendar; desc: string }[] = [
  { id: 'schedule', label: 'Live Schedule', icon: Calendar, desc: 'Upcoming classes' },
  { id: 'notes', label: 'Lesson Notes', icon: FileText, desc: 'Study resources' },
  { id: 'papers', label: 'Papers', icon: ClipboardList, desc: 'Exam practice' },
  { id: 'assignments', label: 'Assignments', icon: CalendarClock, desc: 'Submit & track' },
  { id: 'quizzes', label: 'Quizzes', icon: ListChecks, desc: 'Online MCQ tests' },
];

export default function Sidebar({ active, onNavigate, open, onClose, userEmail, userRole, onSignOut }: SidebarProps) {
  const isTeacher = userRole === 'teacher';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 z-40 transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/30">
              <FlaskConical size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Molekul</h1>
              <p className="text-xs text-slate-400">Chemistry Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isActive ? 'text-brand-700' : 'text-slate-700'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isTeacher ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {isTeacher ? <ShieldCheck size={18} /> : <GraduationCap size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{userEmail}</p>
              <p className={`text-[11px] font-medium ${isTeacher ? 'text-brand-600' : 'text-slate-400'}`}>
                {isTeacher ? 'Teacher' : 'Student'}
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
