import { useState } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import type { Assignment, Submission } from '../types';

interface SubmitAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  existingSubmission?: Submission | null;
  studentEmail: string;
  onSubmit: (assignmentId: string, studentEmail: string, fileName: string, fileUrl: string) => Promise<{ error: string | null }>;
}

export default function SubmitAssignmentModal({
  open,
  onClose,
  assignment,
  existingSubmission,
  studentEmail,
  onSubmit,
}: SubmitAssignmentModalProps) {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !fileUrl.trim()) return;
    setSubmitting(true);
    setError('');
    const { error: submitError } = await onSubmit(assignment.id, studentEmail, fileName, fileUrl);
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    setFileName('');
    setFileUrl('');
    onClose();
  };

  const handleClose = () => {
    setFileName('');
    setFileUrl('');
    setError('');
    onClose();
  };

  if (!assignment) return null;

  const deadline = new Date(assignment.deadline);
  const now = new Date();
  const isPastDeadline = now > deadline;
  const isResubmit = !!existingSubmission;

  return (
    <Modal open={open} onClose={handleClose} title={isResubmit ? 'Resubmit Assignment' : 'Submit Assignment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{assignment.description}</p>
          <p className="text-xs text-slate-400 mt-1.5">
            Deadline: {deadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {deadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
          {isPastDeadline && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">
              This deadline has passed. Late submission may be marked.
            </p>
          )}
        </div>

        {isResubmit && existingSubmission && (
          <div className="px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700">
              You already submitted: {existingSubmission.fileName}
            </p>
            <p className="text-[11px] text-amber-500 mt-0.5">
              Uploading a new file will replace your previous submission.
            </p>
          </div>
        )}

        <FileUpload
          label="Upload Your Assignment PDF"
          folder="submissions"
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
          <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!fileUrl.trim() || submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Submitting...' : isResubmit ? 'Update Submission' : 'Submit'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}
      </form>
    </Modal>
  );
}
