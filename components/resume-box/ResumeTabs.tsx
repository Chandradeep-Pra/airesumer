"use client";

import OriginalResumeView from "./OriginalResumeView";
import ParsedResumeView from "./ParsedResumeView";
import GeneratedResumeView from "./GeneratedResumeView";

type GeneratedJob = {
  id: number;
  title: string;
  company: string;
  generated?: string;
};

type Props = {
  activeTab: "original" | "parsed" | "generated";
  generatedJob?: GeneratedJob;
  onTabChange: (tab: "original" | "parsed" | "generated") => void;
  resumeText: string;
  resumeFile: File | null;
};

export default function ResumeTabs({
  activeTab,
  generatedJob,
  onTabChange,
  resumeText,
  resumeFile,
}: Props) {
  const tabs = [
    { key: "original", label: "Original" },
    { key: "parsed", label: "Parsed Text" },
    { key: "generated", label: "Generated" },
  ];

  return (
    <div className="glass-panel mt-6 rounded-[30px] p-6 md:p-7">
      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key as "original" | "parsed" | "generated")}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === t.key
                ? "bg-[#16324f] text-white shadow-[0_14px_34px_rgba(22,50,79,0.18)]"
                : "border-2 border-[#d9e3ef] bg-white text-[#64748b] hover:border-[#16324f]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-62.5 rounded-3xl border-2 border-[#d9e3ef] bg-white p-4 md:p-5">
        {activeTab === "original" && (
          <OriginalResumeView resumeFile={resumeFile} />
        )}

        {activeTab === "parsed" && (
          <ParsedResumeView text={resumeText} />
        )}

        {activeTab === "generated" && (
          <GeneratedResumeView job={generatedJob} />
        )}
      </div>
    </div>
  );
}