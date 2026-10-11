import { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowUp, ArrowDown, X, Loader as Loader2 } from 'lucide-react';
import Modal from './Modal';
import ImageUpload from './ImageUpload';
import { supabase } from '../lib/supabase';
import type { QuizQuestion } from '../types';

interface QuestionEditorModalProps {
  open: boolean;
  onClose: () => void;
  quizId: string | null;
}

interface EditQuestion {
  id?: string;
  questionText: string;
  imageUrl: string | null;
  options: string[];
  correctIndex: number;
  sortOrder: number;
}

export default function QuestionEditorModal({ open, onClose, quizId }: QuestionEditorModalProps) {
  const [questions, setQuestions] = useState<EditQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !quizId) return;
    setLoading(true);
    setError('');
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setQuestions(data.map((q) => ({
            id: q.id,
            questionText: q.question_text,
            imageUrl: q.image_url,
            options: q.options as string[],
            correctIndex: q.correct_index,
            sortOrder: q.sort_order,
          })));
        }
        setLoading(false);
      });
  }, [open, quizId]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, {
      questionText: '',
      imageUrl: null,
      options: ['', '', '', ''],
      correctIndex: 0,
      sortOrder: prev.length,
    }]);
  };

  const updateQuestion = (index: number, updates: Partial<EditQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((q, i) => ({ ...q, sortOrder: i }));
    });
  };

  const handleSave = async () => {
    if (!quizId) return;
    const valid = questions.filter((q) => q.questionText.trim() && q.options.every((o) => o.trim()));
    if (valid.length === 0) {
      setError('Add at least one question with all options filled.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);

      const rows = valid.map((q, i) => ({
        quiz_id: quizId,
        question_text: q.questionText.trim(),
        image_url: q.imageUrl,
        options: q.options.map((o) => o.trim()),
        correct_index: q.correctIndex,
        sort_order: i,
      }));

      const { error: insertError } = await supabase.from('quiz_questions').insert(rows);
      if (insertError) {
        setError(insertError.message);
      } else {
        onClose();
      }
    } catch {
      setError('Failed to save questions.');
    }
    setSaving(false);
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => prev.map((q, i) =>
      i === qIndex ? { ...q, options: [...q.options, ''] } : q
    ));
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const newOptions = q.options.filter((_, oi) => oi !== oIndex);
      const newCorrect = q.correctIndex >= newOptions.length ? 0 : q.correctIndex > oIndex ? q.correctIndex - 1 : q.correctIndex;
      return { ...q, options: newOptions, correctIndex: newCorrect };
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Quiz Questions">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            {questions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">No questions yet. Add your first MCQ question.</p>
              </div>
            )}

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Question {qIndex + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveQuestion(qIndex, -1)} disabled={qIndex === 0} className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" onClick={() => moveQuestion(qIndex, 1)} disabled={qIndex === questions.length - 1} className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                  placeholder="Enter your question..."
                  className={inputCls}
                />

                <ImageUpload
                  onUploaded={(url) => updateQuestion(qIndex, { imageUrl: url })}
                  onClear={() => updateQuestion(qIndex, { imageUrl: null })}
                  currentUrl={q.imageUrl ?? undefined}
                />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Options (select the correct answer)</p>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { correctIndex: oIndex })}
                        className={`w-6 h-6 rounded-full flex-shrink-0 border-2 transition-all ${
                          q.correctIndex === oIndex
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 hover:border-emerald-400'
                        }`}
                        aria-label="Mark as correct"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...q.options];
                          newOptions[oIndex] = e.target.value;
                          updateQuestion(qIndex, { options: newOptions });
                        }}
                        placeholder={`Option ${oIndex + 1}`}
                        className={inputCls}
                      />
                      {q.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-red-400 transition-colors flex-shrink-0">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => addOption(qIndex)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                      <Plus size={13} /> Add option
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-all">
              <Plus size={18} /> Add Question
            </button>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save Questions'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all';
