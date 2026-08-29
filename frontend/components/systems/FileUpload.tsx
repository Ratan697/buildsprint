'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect?: (file: File | null) => void;
  acceptedExtensions?: string[];
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedExtensions = ['.json', '.yaml', '.yml', '.sql'],
  disabled = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedExtensions.includes(ext)) {
      setErrorMessage(`Invalid file format. Please upload ${acceptedExtensions.join(', ')}`);
      setSelectedFile(null);
      if (onFileSelect) onFileSelect(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (disabled) return;
    setSelectedFile(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-3">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200' : ''
          } ${
            isDragging
              ? 'border-slate-900 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            disabled={disabled}
            accept={acceptedExtensions.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="p-3 bg-gray-100 rounded-full text-gray-600 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Click to upload or drag & drop
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Supported formats: {acceptedExtensions.join(', ')}
          </span>
        </div>
      ) : (
        <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-slate-900 truncate">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={handleRemoveFile}
            className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
