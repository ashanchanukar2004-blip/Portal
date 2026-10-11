import { useState } from 'react';
import Modal from './Modal';
import type { Quiz } from '../types';

type QuizInput = Omit<Quiz, 'id' | 'createdAt'>;

interface AddQuizModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (q: QuizInput) => Promise<{ error: string | null }>;
}

const mediums = ['English', 'Sinhala', 'Tamil', 'Bi-lingual'] as const;

export default function AddQuizModal({ open, onClose, onAdd }: AddQuizModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState<typeof mediums[number]>('English');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setMedium('English');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    const { error: addError } = await onAdd({
      title: title.trim(),
      description: description.trim(),
      medium,
    });
    setSubmitting(false);
    if (addError) {
      setError(addError);
      return;
    }
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Quiz">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Quiz Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Atomic Structure — Quiz 1"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what the quiz covers..."
            rows={2}
            className={inputCls + ' resize-none'}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Medium</label>
          <select value={medium} onChange={(e) => setMedium(e.target.value as typeof mediums[number])} className={inputCls}>
            {mediums.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </form>
    </Modal>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all';
