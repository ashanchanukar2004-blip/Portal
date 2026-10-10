import { useState } from 'react';
import Modal from './Modal';
import { todayISO } from '../utils';
import type { Assignment } from '../types';

type AssignmentInput = Omit<Assignment, 'id' | 'createdAt'>;

interface AddAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (a: AssignmentInput) => Promise<{ error: string | null }>;
}

const mediums = ['English', 'Sinhala', 'Tamil', 'Bi-lingual'] as const;

export default function AddAssignmentModal({ open, onClose, onAdd }: AddAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(todayISO());
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [medium, setMedium] = useState<typeof mediums[number]>('English');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setDeadlineDate(todayISO());
    setDeadlineTime('23:59');
    setMedium('English');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError('');
    const deadlineISO = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
    const { error: addError } = await onAdd({
      title: title.trim(),
      description: description.trim(),
      deadline: deadlineISO,
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
    <Modal open={open} onClose={onClose} title="Add New Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Assignment Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Electrochemistry — Assignment 1"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Description / Instructions" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students need to do..."
            rows={3}
            className={inputCls + ' resize-none'}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline Date" required>
            <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Deadline Time" required>
            <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className={inputCls} required />
          </Field>
        </div>
        <Field label="Medium">
          <select value={medium} onChange={(e) => setMedium(e.target.value as typeof mediums[number])} className={inputCls}>
            {mediums.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Adding...' : 'Add Assignment'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}
      </form>
    </Modal>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}
