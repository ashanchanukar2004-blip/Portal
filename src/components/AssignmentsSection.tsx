import { useMemo, useState } from 'react';
import { Upload, Trash2, Clock, CalendarClock, CheckCircle2, XCircle, FileText, Users, Download, Inbox } from 'lucide-react';
import type { Assignment, Submission } from '../types';
import { MediumBadge, EmptyState, SectionHeader, AddButton } from './ui';

interface AssignmentsSectionProps {
  assignments: Assignment[];
  submissions: Submission[];
  teacherMode: boolean;
  currentUserId: string;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSubmit: (assignment: Assignment) => void;
  onDeleteSubmission: (id: string) => void;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTimeRemaining(iso: string): { label: string; isPast: boolean; isUrgent: boolean } {
  const deadline = new Date(iso);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  if (diff < 0) return { label: 'Deadline passed', isPast: true, isUrgent: false };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { label: `${days} day${days > 1 ? 's' : ''} left`, isPast: false, isUrgent: days <= 2 };
  if (hours > 0) return { label: `${hours} hour${hours > 1 ? 's' : ''} left`, isPast: false, isUrgent: true };
  return { label: 'Less than 1 hour', isPast: false, isUrgent: true };
}

export default function AssignmentsSection({
  assignments,
  submissions,
  teacherMode,
  currentUserId,
  onAdd,
  onDelete,
  onSubmit,
  onDeleteSubmission,
}: AssignmentsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...assignments].sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [assignments]);

  const submissionsForAssignment = (assignmentId: string) =>
    submissions.filter((s) => s.assignmentId === assignmentId);

  const mySubmission = (assignmentId: string) =>
    submissions.find((s) => s.assignmentId === assignmentId && s.studentId === currentUserId);

  return (
    <div>
      <SectionHeader
        title="Submissions"
        subtitle={teacherMode ? 'Create assignments with deadlines and review submissions' : 'View assignments and submit your work'}
        action={teacherMode && <AddButton onClick={onAdd} label="Add Assignment" />}
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={28} />}
          title="No assignments yet"
          description={teacherMode ? "Click 'Add Assignment' to create your first assignment." : 'No assignments available yet. Check back soon!'}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((assignment) => {
            const timeRem = getTimeRemaining(assignment.deadline);
            const mySub = mySubmission(assignment.id);
            const subsForThis = submissionsForAssignment(assignment.id);
            const isExpanded = expandedId === assignment.id;

            return (
              <div
                key={assignment.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        timeRem.isPast
                          ? 'bg-slate-100 text-slate-400'
                          : timeRem.isUrgent
                          ? 'bg-amber-50 text-amber-500'
                          : 'bg-brand-50 text-brand-500'
                      }`}>
                        <CalendarClock size={22} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{assignment.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                          <MediumBadge medium={assignment.medium} />
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            timeRem.isPast
                              ? 'bg-slate-100 text-slate-500'
                              : timeRem.isUrgent
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            <Clock size={11} />
                            {timeRem.label}
                          </span>
                          {!teacherMode && mySub && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
                              <CheckCircle2 size={11} />
                              Submitted
                            </span>
                          )}
                          {teacherMode && subsForThis.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[11px] font-semibold">
                              <Users size={11} />
                              {subsForThis.length} submission{subsForThis.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {teacherMode && (
                      <button
                        onClick={() => onDelete(assignment.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label="Delete assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{assignment.description}</p>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <Clock size={13} />
                    <span>Due: {formatDeadline(assignment.deadline)}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!teacherMode && (
                      <button
                        onClick={() => onSubmit(assignment)}
                        disabled={timeRem.isPast && !mySub}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                          timeRem.isPast && !mySub
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : mySub
                            ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                            : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                        }`}
                      >
                        <Upload size={16} />
                        {mySub ? 'Resubmit' : 'Submit'}
                      </button>
                    )}

                    {mySub && (
                      <a
                        href={mySub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                      >
                        <Download size={14} />
                        View My Submission
                      </a>
                    )}

                    {teacherMode && subsForThis.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-50 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors"
                      >
                        <Users size={14} />
                        {isExpanded ? 'Hide Submissions' : `View ${subsForThis.length} Submission${subsForThis.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                </div>

                {teacherMode && isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                    <div className="space-y-2.5">
                      {subsForThis.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                              <FileText size={16} className="text-brand-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{sub.studentEmail}</p>
                              <p className="text-xs text-slate-400 truncate">{sub.fileName}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            >
                              <Download size={13} />
                              View
                            </a>
                            <button
                              onClick={() => onDeleteSubmission(sub.id)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              aria-label="Delete submission"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {teacherMode && isExpanded && subsForThis.length === 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-6">
                    <div className="flex flex-col items-center text-center">
                      <Inbox size={24} className="text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">No submissions yet</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
