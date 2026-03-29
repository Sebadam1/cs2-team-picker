'use client';

import { useCallback, useState, useRef } from 'react';

interface FileUploadProps {
  accept: string;
  label: string;
  hint?: string;
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  previewType?: 'image' | 'audio';
}

export default function FileUpload({ accept, label, hint, currentUrl, onFileSelect, previewType = 'image' }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      setPreview(null);
      setFileName(null);
      onFileSelect(null);
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

    if (previewType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, [onFileSelect, previewType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  }, [handleFile]);

  const displayUrl = preview || currentUrl;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-rajdhani font-semibold text-gray-300">{label}</label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-emerald-400/60 bg-emerald-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {previewType === 'image' && displayUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img src={displayUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
            <span className="text-gray-400 text-xs font-rajdhani">{fileName || 'Current photo'}</span>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <span className="text-emerald-400 text-xl">{previewType === 'audio' ? '🔊' : '📁'}</span>
            </div>
            <span className="text-gray-300 text-sm font-rajdhani">{fileName}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="text-gray-500 text-2xl">{previewType === 'image' ? '📷' : '🔊'}</div>
            <p className="text-gray-400 text-sm font-rajdhani">
              Drag & drop or <span className="text-emerald-400">click to browse</span>
            </p>
            {hint && <p className="text-gray-600 text-xs font-rajdhani">{hint}</p>}
          </div>
        )}
      </div>

      {(preview || fileName) && (
        <button
          onClick={(e) => { e.stopPropagation(); handleFile(null); if (inputRef.current) inputRef.current.value = ''; }}
          className="text-red-400 text-xs font-rajdhani hover:text-red-300 cursor-pointer"
        >
          Remove
        </button>
      )}
    </div>
  );
}
