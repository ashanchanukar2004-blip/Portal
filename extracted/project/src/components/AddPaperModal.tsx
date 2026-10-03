import { useState } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import { todayISO } from '../utils';
import type { ExamPaper, PaperType } from '../types';

interface AddPaperModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (paper: ExamPaper) => void;
}

const paperTypes: PaperType[] = ['Model Papers', 'Past Papers', 'Tutorials', 'Revision Papers'];
const mediums = ['English', 'Sinhala', 'Tamil', 'Bi-lingual'] as const;

export default function AddPaperModal({ open, onClose, onAdd }: AddPaperModalProps) {
  const [paperType, setPaperType] = useState<PaperType>('Model Papers');
  const [title, setTitle] = useState('');
  const [paperUrl, setPaperUrl] = useState('');
  const [paperFileName, setPaperFileName] = useState('');
  const [markingSchemeUrl, setMarkingSchemeUrl] = useState('');
  const [markingFileName, setMarkingFileName] = useState('');
  const [medium, setMedium] = useState<typeof mediums[number]>('English');

  const reset = () => {
    setPaperType('Model Papers');
    setTitle('');
    setPaperUrl('');
    setPaperFileName('');
    setMarkingSchemeUrl('');
    setMarkingFileName('');
    setMedium('English');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !paperUrl.trim()) return;
    onAdd({
      id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      paperType,
      title: title.trim(),
      paperUrl: paperUrl.trim(),
      markingSchemeUrl: markingSchemeUrl.trim() || paperUrl.trim(),
      medium,
      publishedAt: todayISO(),
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Exam Paper">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Paper Section" required>
          <select value={paperType} onChange={(e) => setPaperType(e.target.value as PaperType)} className={inputCls}>
            {paperTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Paper Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Organic Chemistry — Model Paper"
            className={inputCls}
            required
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
          label="Question Paper PDF"
          folder="papers"
          required
          currentUrl={paperUrl}
          currentFileName={paperFileName}
          onUploaded={(url, name) => {
            setPaperUrl(url);
            setPaperFileName(name);
          }}
          onClear={() => {
            setPaperUrl('');
            setPaperFileName('');
          }}
        />
        <FileUpload
          label="Marking Scheme PDF (optional)"
          folder="papers"
          currentUrl={markingSchemeUrl}
          currentFileName={markingFileName}
          onUploaded={(url, name) => {
            setMarkingSchemeUrl(url);
            setMarkingFileName(name);
          }}
          onClear={() => {
            setMarkingSchemeUrl('');
            setMarkingFileName('');
          }}
        />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!paperUrl.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Add Paper
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
