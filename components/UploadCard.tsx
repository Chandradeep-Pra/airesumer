"use client";

import { useRef, useState } from "react";

type Props = {
  title: string;
  accept: string;
  onFileSelect?: (file: File) => void;
};

export default function UploadCard({ title, accept, onFileSelect }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    onFileSelect?.(file);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#6C63FF] transition">
      
      <p className="font-medium text-gray-700 mb-2">{title}</p>

      {fileName ? (
        <p className="text-sm text-green-600 mb-3 truncate max-w-[200px]">
          {fileName}
        </p>
      ) : (
        <p className="text-sm text-gray-400 mb-3">
          No file selected
        </p>
      )}

      <button
        onClick={handleClick}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white text-sm hover:scale-105 transition"
      >
        Choose File
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}