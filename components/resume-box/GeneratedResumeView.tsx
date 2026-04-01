"use client";

import { useRef, useState } from "react";
import { generateResumeHTML } from "@/src/lib/generateHTML";
import { toast } from "react-hot-toast";

type GeneratedJob = {
  title: string;
  company: string;
  generated?: string;
};

type Props = {
  job?: GeneratedJob;
};

export default function GeneratedResumeView({ job }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!job?.generated) {
    return (
      <div className="text-gray-400 text-sm">
        Generated resume will appear here after AI processing.
      </div>
    );
  }

  const html = generateResumeHTML(job.generated, job);

  const handleDownloadPdf = async () => {
    const downloadToastId = toast.loading(`Generating PDF for ${job.title}...`);
    setIsDownloadingPdf(true);

    try {
      const res = await fetch("/api/download-resume-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job: {
            title: job.title,
            company: job.company,
          },
          resume: job.generated,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          typeof data.error === "string" ? data.error : "PDF generation failed"
        );
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="?([^\"]+)"?/i);

      link.href = url;
      link.download = fileNameMatch?.[1] || `${job.company}-${job.title}-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded PDF for ${job.title}.`, {
        id: downloadToastId,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "PDF download failed",
        { id: downloadToastId }
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#d9e3ef] bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#64748b]">
            Generated Resume Preview
          </p>
          <h3 className="text-lg font-semibold text-[#10233a]">
            {job.title}
          </h3>
          <p className="text-sm text-[#64748b]">{job.company}</p>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex items-center justify-center rounded-xl bg-[#1F2937] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={html}
        title={`Generated resume for ${job.title}`}
        className="h-180 w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
      />
    </div>
  );
}