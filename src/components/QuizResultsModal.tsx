import { useEffect, useState } from 'react';
import { X, Trophy, Loader as Loader2 } from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';
import type { QuizAttempt } from '../types';

interface QuizResultsModalProps {
  open: boolean;
  onClose: () => void;
  quizId: string | null;
  quizTitle: string;
}

interface DbAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_email: string;
  score: number;
  total: number;
  submitted_at: string;
}

export default function QuizResultsModal({ open, onClose, quizId, quizTitle }: QuizResultsModalProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !quizId) return;
    setLoading(true);
    supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAttempts((data as DbAttempt[]).map((a) => ({
            id: a.id,
            quizId: a.quiz_id,
            studentId: a.student_id,
            studentEmail: a.student_email,
            score: a.score,
            total: a.total,
            answers: [],
            submittedAt: a.submitted_at,
          })));
        }
        setLoading(false);
      });
  }, [open, quizId]);

  return (
    <Modal open={open} onClose={onClose} title={`Results: ${quizTitle}`}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-8">
          <Trophy size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No students have taken this quiz yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
            <span className="text-xs font-bold text-slate-500">
              {attempts.length} student{attempts.length > 1 ? 's' : ''} completed
            </span>
            <span className="text-xs font-bold text-slate-500">
              Avg: {Math.round(attempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / attempts.length)}%
            </span>
          </div>
          {attempts.map((a, i) => {
            const pct = Math.round((a.score / a.total) * 100);
            return (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.studentEmail}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(a.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-700">{a.score}/{a.total}</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                    pct >= 75 ? 'bg-emerald-50 text-emerald-600' :
                    pct >= 50 ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
