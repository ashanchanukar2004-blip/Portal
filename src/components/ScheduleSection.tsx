import { Video, Clock, Calendar, Trash2, Info } from 'lucide-react';
import type { ScheduleSlot } from '../types';
import { formatDate, formatTime, getDaysUntil } from '../utils';
import { MediumBadge, EmptyState, SectionHeader, AddButton } from './ui';

interface ScheduleSectionProps {
  slots: ScheduleSlot[];
  teacherMode: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function ScheduleSection({ slots, teacherMode, onAdd, onDelete }: ScheduleSectionProps) {
  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Live Schedule & Links"
        subtitle="Join your upcoming live classes on time"
        action={teacherMode && <AddButton onClick={onAdd} label="Add Class Slot" />}
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="No classes scheduled"
          description={teacherMode ? "Click 'Add Class Slot' to create your first live class." : 'No upcoming classes yet. Check back soon!'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((slot, index) => {
            const daysUntil = getDaysUntil(slot.date);
            const isToday = daysUntil === 0;
            const isPast = daysUntil < 0;
            return (
              <div
                key={slot.id}
                className={`relative rounded-2xl border p-5 transition-all duration-300 ease-in-out animate-stagger-in ${
                  isToday
                    ? 'border-brand-300 bg-brand-50/50 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 hover:scale-[1.02]'
                    : isPast
                    ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    : 'border-slate-200 bg-white card-shadow hover:card-shadow-hover hover:border-brand-200 hover:scale-[1.02]'
                } stagger-${Math.min(index + 1, 6)}`}
              >
                {isToday && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-md shadow-brand-500/30">
                    Today
                  </span>
                )}
                {isPast && !isToday && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                    Completed
                  </span>
                )}

                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug flex-1">{slot.title}</h4>
                  <MediumBadge medium={slot.medium} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                    <span>{formatDate(slot.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={15} className="text-slate-400 flex-shrink-0" />
                    <span>{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isPast ? (
                    <a
                      href={slot.joinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all duration-200 ease-in-out shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.03]"
                    >
                      <Video size={16} />
                      Join Class
                    </a>
                  ) : (
                    <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
                      <Info size={16} />
                      Class Ended
                    </div>
                  )}
                  {teacherMode && (
                    <button
                      onClick={() => onDelete(slot.id)}
                      className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
                      aria-label="Delete slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
