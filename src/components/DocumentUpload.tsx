import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { parseDocument } from '@/lib/documentParser';

interface DocumentUploadProps {
  onUpload: (text: string, fileName: string, fileType: string) => void;
  onClose: () => void;
}

const ACCEPTED_TYPES = '.pdf,.txt,.docx';
const MAX_SIZE = 10 * 1024 * 1024;

export default function DocumentUpload({ onUpload, onClose }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError('');
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'docx'].includes(ext || '')) {
      setError('Please upload a PDF, TXT, or DOCX file.'); return;
    }
    if (f.size > MAX_SIZE) { setError('File is too large. Maximum size is 10MB.'); return; }
    setFile(f);
    setStatus('idle');
  };

  const handleParse = async () => {
    if (!file) return;
    setStatus('parsing');
    setError('');
    try {
      const { text, type } = await parseDocument(file);
      if (!text.trim()) {
        setError('No text could be extracted from this file. It may be an image-based PDF or empty document.');
        setStatus('error'); return;
      }
      setStatus('done');
      setTimeout(() => { onUpload(text, file.name, type); }, 600);
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Upload Document
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                {status === 'done' ? <CheckCircle size={32} className="text-green-500" /> : <FileText size={32} className="text-blue-600" />}
                <p className="text-sm text-slate-900 font-medium">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-slate-300" />
                <p className="text-sm text-slate-600">Click to browse or drag a file here</p>
                <p className="text-xs text-slate-400">PDF, TXT, DOCX — max 10MB</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 mt-3 text-center">{error}</p>}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >Cancel</button>
            <button onClick={handleParse}
              disabled={!file || status === 'parsing' || status === 'done'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'parsing' && <Loader2 size={16} className="animate-spin" />}
              {status === 'done' ? 'Uploaded!' : status === 'parsing' ? 'Processing...' : 'Process Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
