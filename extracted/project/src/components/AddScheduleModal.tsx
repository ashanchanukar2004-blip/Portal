import { useState } from 'react';
import Modal from './Modal';
import { todayISO } from '../utils';
import type { ScheduleSlot } from '../types';

interface AddScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (slot: ScheduleSlot) => void;
}

const mediums = ['English', 'Sinhala', 'Tamil', 'Bi-lingual'] as const;

export default function AddScheduleModal({ open, onClose, onAdd }: AddScheduleModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('18:00');
  const [joinLink, setJoinLink] = useState('');
  const [medium, setMedium] = useState<typeof mediums[number]>('Bi-lingual');

  const reset = () => {
    setTitle('');
    setDate(todayISO());
    setStartTime('16:00');
    setEndTime('18:00');
    setJoinLink('');
    setMedium('Bi-lingual');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !joinLink.trim()) return;
    onAdd({
      id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      date,
      startTime,
      endTime,
      joinLink: joinLink.trim(),
      medium,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Class Slot">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Class Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chemical Bonding — Part 2"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Date" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Time" required>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="End Time" required>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} required />
          </Field>
        </div>
        <Field label="Medium">
          <select value={medium} onChange={(e) => setMedium(e.target.value as typeof mediums[number])} className={inputCls}>
            {mediums.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Meeting Link (Zoom / Meet)" required>
          <input
            type="url"
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className={inputCls}
            required
          />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm">
            Add Slot
          </button>
        </div>
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
