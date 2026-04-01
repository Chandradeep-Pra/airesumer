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
    <div className="group relative overflow-hidden rounded-[28px] border-2 border-[#d9e3ef] bg-white p-6 text-center shadow-[0_18px_50px_rgba(18,32,51,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#16324f] hover:shadow-[0_24px_60px_rgba(18,32,51,0.14)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#16324f]" />

      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16324f] text-lg font-semibold text-white shadow-[0_16px_32px_rgba(22,50,79,0.18)]">
        {title.slice(0, 1)}
      </div>

      <p className="mb-2 text-lg font-semibold text-[#10233a]">{title}</p>
      <p className="mb-4 text-sm text-[#64748b]">Accepted format: {accept}</p>

      {fileName ? (
        <p className="mb-4 truncate rounded-full border border-[#19a974]/20 bg-[#e9fbf4] px-3 py-2 text-sm font-medium text-[#127e57]">
          {fileName}
        </p>
      ) : (
        <p className="mb-4 rounded-full border border-[#dbe4ef] bg-[#f3f7fb] px-3 py-2 text-sm text-slate-500">
          No file selected
        </p>
      )}

      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center rounded-2xl bg-[#ff6b57] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,107,87,0.22)] transition group-hover:scale-[1.02] group-hover:bg-[#ef5a46]"
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