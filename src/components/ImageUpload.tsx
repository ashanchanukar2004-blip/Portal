import { useRef, useState } from 'react';
import { ImagePlus, X, Loader as Loader2, CircleCheck as CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onUploaded: (url: string) => void;
  onClear: () => void;
  currentUrl?: string;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function ImageUpload({ onUploaded, onClear, currentUrl }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl ?? '');

  const hasImage = !!previewUrl;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WebP).');
      setState('error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image is too large. Maximum size is 5 MB.');
      setState('error');
      return;
    }

    setState('uploading');
    setErrorMsg('');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `questions/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('quiz-images')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setErrorMsg(uploadError.message || 'Upload failed.');
      setState('error');
      return;
    }

    const { data: urlData } = supabase.storage.from('quiz-images').getPublicUrl(path);
    setPreviewUrl(urlData.publicUrl);
    setState('done');
    onUploaded(urlData.publicUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setState('idle');
    setPreviewUrl('');
    setErrorMsg('');
    onClear();
    if (inputRef.current) inputRef.current.value = '';
  };

  if (hasImage && state !== 'uploading') {
    return (
      <div className="relative rounded-xl border border-slate-200 overflow-hidden group">
        <img src={previewUrl} alt="Question" className="w-full max-h-48 object-contain bg-slate-50" />
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
            <CheckCircle2 size={11} /> Uploaded
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg bg-white/90 text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (state === 'uploading') {
    return (
      <div className="flex items-center gap-3 px-3.5 py-4 rounded-xl border border-brand-200 bg-brand-50">
        <Loader2 size={18} className="text-brand-500 animate-spin flex-shrink-0" />
        <p className="text-sm font-medium text-brand-700">Uploading image...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed transition-all ${
          state === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50'
        }`}
      >
        <ImagePlus size={22} className={state === 'error' ? 'text-red-400' : 'text-slate-400'} />
        <p className={`text-sm font-semibold ${state === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
          {state === 'error' ? 'Upload failed — tap to retry' : 'Add image (optional)'}
        </p>
        <p className="text-[11px] text-slate-400">PNG, JPG, WebP — max 5 MB</p>
      </button>
      {state === 'error' && errorMsg && (
        <p className="text-[11px] text-red-500 mt-1.5">{errorMsg}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
