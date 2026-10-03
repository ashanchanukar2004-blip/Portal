import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  label: string;
  folder: 'notes' | 'papers';
  onUploaded: (url: string, fileName: string) => void;
  onClear: () => void;
  currentUrl?: string;
  currentFileName?: string;
  required?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function FileUpload({
  label,
  folder,
  onUploaded,
  onClear,
  currentUrl,
  currentFileName,
  required,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadedName, setUploadedName] = useState(currentFileName ?? '');

  const hasFile = !!currentUrl;

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please select a PDF file.');
      setState('error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File is too large. Maximum size is 50 MB.');
      setState('error');
      return;
    }

    setState('uploading');
    setErrorMsg('');
    setProgress(0);

    const ext = file.name.split('.').pop() ?? 'pdf';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(path, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      setErrorMsg(uploadError.message || 'Upload failed. Please try again.');
      setState('error');
      return;
    }

    const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    setProgress(100);
    setUploadedName(file.name);
    setState('done');
    onUploaded(publicUrl, file.name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setState('idle');
    setUploadedName('');
    setProgress(0);
    setErrorMsg('');
    onClear();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>

      {hasFile && state !== 'uploading' ? (
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 truncate">{uploadedName || currentFileName || 'PDF uploaded'}</p>
            <p className="text-[11px] text-emerald-500">Ready to use</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-100 transition-colors"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : state === 'uploading' ? (
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-brand-200 bg-brand-50">
          <Loader2 size={18} className="text-brand-500 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-700">Uploading...</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-brand-100 overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed transition-all ${
            state === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50'
          }`}
        >
          <UploadCloud size={24} className={state === 'error' ? 'text-red-400' : 'text-slate-400'} />
          <div className="text-center">
            <p className={`text-sm font-semibold ${state === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
              {state === 'error' ? 'Upload failed — tap to retry' : 'Tap to upload a PDF'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">PDF files only, max 50 MB</p>
          </div>
        </button>
      )}

      {state === 'error' && errorMsg && (
        <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
          <FileText size={11} />
          {errorMsg}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
