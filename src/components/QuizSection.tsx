import { useState } from 'react';
import { ListChecks, Trash2, Pencil, Trophy, Play, FileQuestion, BarChart3 } from 'lucide-react';
import type { Quiz, QuizAttempt } from '../types';
import { MediumBadge, EmptyState, SectionHeader, AddButton } from './ui';
import TakeQuizView from './TakeQuizView';
import QuestionEditorModal from './QuestionEditorModal';
import QuizResultsModal from './QuizResultsModal';

interface QuizSectionProps {
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  quizQuestionCounts: Record<string, number>;
  teacherMode: boolean;
  currentUserId: string;
  currentEmail: string;
  onAdd: () => void;
  onDelete: (id: string) => void;
  refreshQuestionCounts: () => Promise<void>;
}

export default function QuizSection({
  quizzes,
  quizAttempts,
  quizQuestionCounts,
  teacherMode,
  currentUserId,
  currentEmail,
  onAdd,
  onDelete,
  refreshQuestionCounts,
}: QuizSectionProps) {
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);

  if (takingQuiz) {
    const existing = quizAttempts.find((a) => a.quizId === takingQuiz.id && a.studentId === currentUserId) ?? null;
    return (
      <TakeQuizView
        quiz={takingQuiz}
        studentId={currentUserId}
        studentEmail={currentEmail}
        existingAttempt={existing}
        onBack={() => setTakingQuiz(null)}
        onSubmitted={() => {}}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Quizzes"
        subtitle="Take online MCQ quizzes and see your results instantly"
        action={teacherMode && <AddButton onClick={onAdd} label="Create Quiz" />}
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={28} />}
          title="No quizzes yet"
          description={teacherMode ? "Click 'Create Quiz' to make your first online quiz." : 'No quizzes available yet. Check back soon!'}
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const questionCount = quizQuestionCounts[quiz.id] ?? 0;
            const myAttempt = quizAttempts.find((a) => a.quizId === quiz.id && a.studentId === currentUserId);
            const attemptCount = quizAttempts.filter((a) => a.quizId === quiz.id).length;
            const pct = myAttempt ? Math.round((myAttempt.score / myAttempt.total) * 100) : null;

            return (
              <div
                key={quiz.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-brand-200 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
                      <ListChecks size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <MediumBadge medium={quiz.medium} />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold">
                          <FileQuestion size={11} />
                          {questionCount} Q
                        </span>
                        {myAttempt && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            pct !== null && pct >= 75 ? 'bg-emerald-50 text-emerald-600' :
                            pct !== null && pct >= 50 ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            <Trophy size={11} />
                            {myAttempt.score}/{myAttempt.total} ({pct}%)
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{quiz.title}</h4>
                      {quiz.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {teacherMode ? (
                      <>
                        <button
                          onClick={() => setResultsQuiz(quiz)}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-all"
                          title="View results"
                        >
                          <BarChart3 size={15} />
                          Results
                          {attemptCount > 0 && <span className="text-[10px] text-slate-400">({attemptCount})</span>}
                        </button>
                        <button
                          onClick={() => {
                            setEditingQuiz(quiz);
                            void refreshQuestionCounts();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 text-xs font-semibold hover:bg-brand-100 transition-all"
                        >
                          <Pencil size={15} />
                          Questions
                        </button>
                        <button
                          onClick={() => onDelete(quiz.id)}
                          className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          aria-label="Delete quiz"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setTakingQuiz(quiz)}
                        disabled={questionCount === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Play size={15} />
                        {myAttempt ? 'Retake' : 'Start Quiz'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuestionEditorModal
        open={!!editingQuiz}
        onClose={() => setEditingQuiz(null)}
        quizId={editingQuiz?.id ?? null}
      />

      <QuizResultsModal
        open={!!resultsQuiz}
        onClose={() => setResultsQuiz(null)}
        quizId={resultsQuiz?.id ?? null}
        quizTitle={resultsQuiz?.title ?? ''}
      />
    </div>
  );
}
