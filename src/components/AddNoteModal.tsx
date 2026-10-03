import { useState } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import { todayISO } from '../utils';
import type { NoteItem } from '../types';

type NoteInput = Omit<NoteItem, 'id'>;

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (note: NoteInput) => Promise<{ error: string | null }>;
}

const mediums = ['English', 'Sinhala', 'Tamil', 'Bi-lingual'] as const;

export default function AddNoteModal({ open, onClose, onAdd }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [medium, setMedium] = useState<typeof mediums[number]>('English');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setUnitNumber('');
    setDescription('');
    setFileName('');
    setFileUrl('');
    setMedium('English');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;
    setSubmitting(true);
    setError('');
    const { error: addError } = await onAdd({
      title: title.trim(),
      unitNumber: parseInt(unitNumber, 10) || 0,
      description: description.trim() || 'No description provided.',
      fileName: fileName.trim() || title.trim().toLowerCase().replace(/\s+/g, '-') + '.pdf',
      fileUrl: fileUrl.trim(),
      medium,
      uploadedAt: todayISO(),
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
    <Modal open={open} onClose={onClose} title="Add New Lesson Notes">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Note Title" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electrochemistry Complete Notes"
                className={inputCls}
                required
              />
            </Field>
          </div>
          <Field label="Unit No." required>
            <input
              type="number"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="e.g. 10"
              min="1"
              className={inputCls}
              required
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what the notes cover..."
            rows={2}
            className={inputCls + ' resize-none'}
          />
        </Field>
        <Field label="Medium">
          <select value={medium} onChange={(e) => setMedium(e.target.value as typeof mediums[number])} className={inputCls}>
            {mediums.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <FileUpload
          label="Upload PDF File"
          folder="notes"
          required
          currentUrl={fileUrl}
          currentFileName={fileName}
          onUploaded={(url, name) => {
            setFileUrl(url);
            setFileName(name);
          }}
          onClear={() => {
            setFileUrl('');
            setFileName('');
          }}
        />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!fileUrl.trim() || submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Adding...' : 'Add Notes'}
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
