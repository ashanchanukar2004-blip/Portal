import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Clock, Loader as Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Quiz, QuizQuestion, QuizAttempt } from '../types';

interface TakeQuizViewProps {
  quiz: Quiz;
  studentId: string;
  studentEmail: string;
  existingAttempt?: QuizAttempt | null;
  onBack: () => void;
  onSubmitted: () => void;
}

interface DbQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  image_url: string | null;
  options: string[];
  correct_index: number;
  sort_order: number;
}

export default function TakeQuizView({ quiz, studentId, studentEmail, existingAttempt, onBack, onSubmitted }: TakeQuizViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; answers: number[]; correctAnswers: number[] } | null>(null);

  useEffect(() => {
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const mapped = (data as DbQuestion[]).map((q) => ({
            id: q.id,
            quizId: q.quiz_id,
            questionText: q.question_text,
            imageUrl: q.image_url,
            options: q.options,
            correctIndex: q.correct_index,
            sortOrder: q.sort_order,
          }));
          setQuestions(mapped);
          setAnswers(new Array(mapped.length).fill(null));
        }
        setLoading(false);
      });
  }, [quiz.id]);

  const handleAnswer = (qIndex: number, optIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    const answered = answers.filter((a) => a !== null).length;
    if (answered < questions.length) {
      if (!confirm(`You've answered ${answered} of ${questions.length} questions. Submit anyway?`)) return;
    }

    setSubmitting(true);
    let score = 0;
    const correctAnswers = questions.map((q) => q.correctIndex);
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });
    const total = questions.length;
    const answerArr = answers.map((a) => a ?? -1);

    try {
      const { data: existing } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quiz.id)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        await supabase.from('quiz_attempts').update({
          score,
          total,
          answers: answerArr,
          submitted_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('quiz_attempts').insert({
          quiz_id: quiz.id,
          student_email: studentEmail,
          score,
          total,
          answers: answerArr,
        });
      }

      setResult({ score, total, answers: answerArr, correctAnswers });
      onSubmitted();
    } catch {
      alert('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-400 mb-4">This quiz has no questions yet.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors">
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className={`inline-flex w-20 h-20 rounded-full items-center justify-center mb-3 ${
            pct >= 75 ? 'bg-emerald-50' : pct >= 50 ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <Trophy size={36} className={pct >= 75 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Quiz Complete!</h3>
          <p className="text-sm text-slate-400 mt-1">{quiz.title}</p>
          <div className="mt-4 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-3xl font-bold text-slate-900">{result.score}</span>
            <span className="text-lg text-slate-400">/ {result.total}</span>
            <span className={`text-lg font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {pct}%
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {questions.map((q, i) => {
            const userAnswer = result.answers[i];
            const correct = result.correctAnswers[i];
            const isCorrect = userAnswer === correct;
            return (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-semibold text-slate-800 flex-1">
                    {i + 1}. {q.questionText}
                  </p>
                </div>
                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Question" className="w-full max-h-40 object-contain rounded-lg bg-slate-50 mb-3" />
                )}
                <div className="space-y-1.5 ml-7">
                  {q.options.map((opt, oi) => {
                    const isUserAnswer = userAnswer === oi;
                    const isCorrectAnswer = correct === oi;
                    const bgClass = isCorrectAnswer
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : isUserAnswer
                        ? 'bg-red-50 text-red-600'
                        : 'text-slate-500';
                    const badgeClass = isCorrectAnswer
                      ? 'border-emerald-400 bg-emerald-400 text-white'
                      : isUserAnswer
                        ? 'border-red-400 bg-red-400 text-white'
                        : 'border-slate-300';
                    return (
                      <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${bgClass}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${badgeClass}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                        {isCorrectAnswer && <CheckCircle2 size={14} className="ml-auto" />}
                        {isUserAnswer && !isCorrectAnswer && <XCircle size={14} className="ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onBack} className="w-full px-4 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm">
          Back to Quizzes
        </button>
      </div>
    );
  }

  const q = questions[currentQ];
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLast = currentQ === questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={16} /> Exit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">
            Question {currentQ + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-400">
            ({answeredCount} answered)
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`h-2 flex-1 rounded-full transition-all ${
              i === currentQ ? 'bg-brand-500' :
              answers[i] !== null ? 'bg-brand-300' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-5">
        <h4 className="text-base font-bold text-slate-900 mb-4">{q.questionText}</h4>
        {q.imageUrl && (
          <img src={q.imageUrl} alt="Question" className="w-full max-h-64 object-contain rounded-xl bg-slate-50 mb-4" />
        )}
        <div className="space-y-2.5">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => handleAnswer(currentQ, oi)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                answers[currentQ] === oi
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50/30'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                answers[currentQ] === oi ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="text-sm font-medium">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} /> Previous
        </button>
        <div className="flex-1" />
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm"
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
