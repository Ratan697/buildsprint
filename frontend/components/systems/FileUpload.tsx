'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelected?: (file: File | null) => void;
  selectedFile?: File | null;
  acceptedFormats?: string;
  acceptedExtensions?: string[];
  disabled?: boolean;
}

export function FileUpload({
  onFileSelected,
  selectedFile: externalSelectedFile,
  acceptedFormats = '.sql,.json,.yaml,.yml',
  acceptedExtensions,
  disabled = false,
}: FileUploadProps) {
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = externalSelectedFile !== undefined ? externalSelectedFile : internalFile;

  const handleFile = (file: File) => {
    setError(null);
    const validExtensions = acceptedExtensions || ['.sql', '.json', '.yaml', '.yml'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file extension ${ext}. Supported formats: ${validExtensions.join(', ')}`);
      return;
    }

    if (externalSelectedFile === undefined) {
      setInternalFile(file);
    }
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    if (disabled) return;
    if (externalSelectedFile === undefined) {
      setInternalFile(null);
    }
    setError(null);
    if (onFileSelected) {
      onFileSelected(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={acceptedFormats}
        disabled={disabled}
        className="hidden"
      />

      {!activeFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed border-gray-200' : 'cursor-pointer'
          } ${
            isDragging
              ? 'border-blue-500 bg-blue-50/5'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-slate-100 rounded-full">
              <Upload className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag & drop file
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports SQL (.sql), OpenAPI/Swagger (.json, .yaml, .yml), or Topology JSON
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center space-x-3 overflow-hidden">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium text-slate-800 truncate">
                {activeFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(activeFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-xs text-rose-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
