import { Menu, ShieldCheck, GraduationCap, LogOut } from 'lucide-react';
import type { UserRole } from '../lib/supabase';

interface TopBarProps {
  isTeacher: boolean;
  onOpenSidebar: () => void;
  title: string;
  onSignOut: () => void;
}

export default function TopBar({ isTeacher, onOpenSidebar, title, onSignOut }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
            <p className="hidden sm:block text-xs text-slate-400">
              {isTeacher ? 'Teacher Admin Mode — you can add and manage content' : 'Student View — browse and download resources'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            isTeacher
              ? 'bg-brand-50 border-brand-200 text-brand-600'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            {isTeacher ? <ShieldCheck size={16} className="text-brand-500" /> : <GraduationCap size={16} className="text-slate-400" />}
            <span className="text-xs font-semibold">
              {isTeacher ? 'Teacher Account' : 'Student Account'}
            </span>
          </div>

          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
