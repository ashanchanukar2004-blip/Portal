import { Calendar, FileText, ClipboardList, FlaskConical, X, LogOut, GraduationCap, ShieldCheck } from 'lucide-react';
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
];

export default function Sidebar({ active, onNavigate, open, onClose, userEmail, userRole, onSignOut }: SidebarProps) {
  const isTeacher = userRole === 'teacher';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden animate-fade-in backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`glass-sidebar fixed lg:sticky top-0 left-0 h-screen w-72 border-r border-slate-200/60 z-40 transition-transform duration-300 ease-out flex flex-col shadow-xl lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all duration-200 hover:scale-105 hover:shadow-brand-500/40">
              <FlaskConical size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Molekul</h1>
              <p className="text-xs text-slate-400">Chemistry Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100/80 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin">
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
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-50/80 hover:scale-[1.02]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 'bg-slate-100/80 text-slate-500'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-brand-700' : 'text-slate-700'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200/60 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50/80 transition-all duration-200 hover:bg-slate-50">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isTeacher ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25' : 'bg-slate-200 text-slate-500'
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
