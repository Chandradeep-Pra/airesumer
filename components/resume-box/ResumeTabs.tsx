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
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key as "original" | "parsed" | "generated")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.key
                ? "bg-[#6C63FF] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="border rounded-xl p-4 min-h-62.5">
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