import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface AddButtonProps {
  onClick: () => void;
  label: string;
}

export function AddButton({ onClick, label }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-md shadow-brand-500/25"
    >
      <Plus size={18} />
      {label}
    </button>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

interface MediumBadgeProps {
  medium: string;
}

export function MediumBadge({ medium }: MediumBadgeProps) {
  const styles: Record<string, string> = {
    English: 'bg-blue-50 text-blue-600',
    Sinhala: 'bg-emerald-50 text-emerald-600',
    Tamil: 'bg-amber-50 text-amber-600',
    'Bi-lingual': 'bg-violet-50 text-violet-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${styles[medium] ?? 'bg-slate-100 text-slate-500'}`}>
      {medium}
    </span>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
