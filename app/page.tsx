"use client";

import { useState } from "react";
import UploadCard from "@/components/UploadCard";
import ResumeTabs from "@/components/resume-box/ResumeTabs";
import JobsTable from "@/components/JobsTable";
import { toast } from "react-hot-toast";

type FullJob = {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements?: string[];
  nice_to_have?: string[];
  url?: string;
};

type Job = {
  id: number;
  title: string;
  company: string;
  status: "pending" | "processing" | "completed" | "failed";
  full?: FullJob;
  generated?: string;
};

type ResumeTab = "original" | "parsed" | "generated";

type BulkAction = "all" | "remaining" | null;

type GenerateJobOptions = {
  openPreview?: boolean;
  toastId?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeFullJob = (value: unknown): FullJob | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "number" ? value.id : Number(value.id);
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const company = typeof value.company === "string" ? value.company.trim() : "";
  const description =
    typeof value.description === "string" ? value.description.trim() : "";

  if (!Number.isFinite(id) || !title || !description) {
    return null;
  }

  return {
    id,
    title,
    company,
    description,
    requirements: Array.isArray(value.requirements)
      ? value.requirements.filter(
          (item): item is string => typeof item === "string"
        )
      : undefined,
    nice_to_have: Array.isArray(value.nice_to_have)
      ? value.nice_to_have.filter(
          (item): item is string => typeof item === "string"
        )
      : undefined,
    url: typeof value.url === "string" ? value.url : undefined,
  };
};

const normalizeStoredJob = (value: unknown): Job | null => {
  if (!isRecord(value)) {
    return null;
  }

  const full = normalizeFullJob(value.full) ?? normalizeFullJob(value);
  if (!full) {
    return null;
  }

  const status =
    value.status === "processing" ||
    value.status === "completed" ||
    value.status === "failed"
      ? value.status
      : "pending";

  return {
    id: full.id,
    title: full.title,
    company: full.company,
    status,
    full,
    generated: typeof value.generated === "string" ? value.generated : "",
  };
};

const persistJobs = (jobs: Job[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }
};

const readStoredJobs = (): Job[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const savedJobs = localStorage.getItem("jobs");
  if (!savedJobs) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedJobs);
    const cleaned = Array.isArray(parsed)
      ? parsed
          .map((savedJob: unknown) => normalizeStoredJob(savedJob))
          .filter((savedJob): savedJob is Job => savedJob !== null)
          .map((savedJob) =>
            savedJob.status === "processing"
              ? { ...savedJob, status: "pending" as const }
              : savedJob
          )
      : [];

    persistJobs(cleaned);
    return cleaned;
  } catch (error) {
    console.error("Failed to restore saved jobs:", error);
    localStorage.removeItem("jobs");
    return [];
  }
};

const readStoredResumeText = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("resumeText") || "";
};

export default function Home() {
  // ---------------- STATE ----------------
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [jobs, setJobs] = useState<Job[]>(() => readStoredJobs());
  const [resumeText, setResumeText] = useState<string>(() => readStoredResumeText());
  const [activeResumeTab, setActiveResumeTab] = useState<ResumeTab>("parsed");
  const [selectedGeneratedJobId, setSelectedGeneratedJobId] = useState<number | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [emailingJobId, setEmailingJobId] = useState<number | null>(null);

  // ---------------- HELPERS ----------------

  const isReady = () => excelFile && jsonFile && resumeFile;

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("excel", excelFile!);
    formData.append("json", jsonFile!);
    formData.append("resume", resumeFile!);
    return formData;
  };

  const updateJobStatus = (id: number, status: Job["status"]) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === id ? { ...j, status } : j
      );

      persistJobs(updated);
      return updated;
    });
  };

  const updateGeneratedResume = (id: number, resume: string) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === id ? { ...j, generated: resume } : j
      );

      persistJobs(updated);
      return updated;
    });
  };

  const selectedGeneratedJob = jobs.find(
    (job) => job.id === selectedGeneratedJobId
  );

  const remainingJobsCount = jobs.filter(
    (job) => !job.generated?.trim()
  ).length;

  const openGeneratedResume = (jobId: number) => {
    setSelectedGeneratedJobId(jobId);
    setActiveResumeTab("generated");
  };

  const generateJob = async (
    job: Job,
    options?: GenerateJobOptions
  ) => {
    const updateGenerateToast = (message: string) => {
      if (!options?.toastId) {
        return;
      }

      toast.loading(message, { id: options.toastId });
    };

    if (job.status === "processing") {
      return false;
    }

    updateGenerateToast(`Preparing rewrite for ${job.title}...`);

    const fullJob = normalizeFullJob(job.full) ?? normalizeFullJob(job);
    if (!fullJob) {
      console.error("Missing full job payload for generation:", job);
      updateJobStatus(job.id, "failed");
      if (options?.toastId) {
        toast.error(`Missing job details for ${job.title}.`, {
          id: options.toastId,
        });
      }
      return false;
    }

    updateJobStatus(job.id, "processing");
    updateGenerateToast(`Sending ${job.title} to Gemini for rewriting...`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          job: fullJob,
        }),
      });

      updateGenerateToast(`Waiting for Gemini response for ${job.title}...`);

      const data = await res.json();

      if (!res.ok || typeof data.resume !== "string") {
        throw new Error(data.error || "Resume generation failed");
      }

      updateGenerateToast(`Formatting generated resume for ${job.title}...`);
      updateGeneratedResume(job.id, data.resume);

      if (options?.openPreview !== false) {
        openGeneratedResume(job.id);
      }

      updateGenerateToast(`Finalizing rewritten resume for ${job.title}...`);
      updateJobStatus(job.id, "completed");
      if (options?.toastId) {
        toast.success(`Generated resume for ${job.title}.`, {
          id: options.toastId,
        });
      }
      return true;
    } catch (error) {
      console.error(error);
      updateJobStatus(job.id, "failed");
      if (options?.toastId) {
        toast.error(`Failed to generate resume for ${job.title}.`, {
          id: options.toastId,
        });
      }
      return false;
    }
  };

  const processJobsInBulk = async (mode: Exclude<BulkAction, null>) => {
    if (bulkAction) {
      return;
    }

    const targetJobs = jobs.filter((job) =>
      mode === "all" ? true : !job.generated?.trim()
    );

    if (!targetJobs.length) {
      toast(
        mode === "all"
          ? "No jobs available to generate."
          : "No remaining jobs left to generate.",
        { icon: "ℹ" }
      );
      return;
    }

    setBulkAction(mode);
    const bulkToastId = toast.loading(
      mode === "all"
        ? `Generating ${targetJobs.length} resumes.`
        : `Generating ${targetJobs.length} remaining resumes.`
    );

    let successCount = 0;
    let failedCount = 0;
    let lastGeneratedJobId: number | null = null;
    const totalJobs = targetJobs.length;

    for (const [index, job] of targetJobs.entries()) {
      const jobToastId = `generate-${mode}-${job.id}`;

      toast.loading(
        `Generating ${job.title} (${index + 1}/${totalJobs})...`,
        { id: jobToastId }
      );

      const wasGenerated = await generateJob(job, {
        openPreview: false,
        toastId: jobToastId,
      });

      if (wasGenerated) {
        successCount += 1;
        lastGeneratedJobId = job.id;
      } else {
        failedCount += 1;
      }

      if (index < totalJobs - 1) {
        toast.loading(
          `Processed ${index + 1}/${totalJobs}. ${successCount} succeeded, ${failedCount} failed.`,
          { id: bulkToastId }
        );
      }
    }

    if (lastGeneratedJobId !== null) {
      openGeneratedResume(lastGeneratedJobId);
    }

    setBulkAction(null);

    if (failedCount > 0) {
      toast.error(
        `Finished with ${successCount} success and ${failedCount} failed.`,
        { id: bulkToastId }
      );
      return;
    }

    toast.success(`Finished generating ${successCount} resumes.`, {
      id: bulkToastId,
    });
  };

  // ---------------- PIPELINE ----------------

  // Step 1: Parse input files
  const runPipeline = async () => {
    const parseToastId = toast.loading("Parsing jobs and resume files...");

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: buildFormData(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Parsing failed"
        );
      }

      const parsedJobs = Array.isArray(data.jobs)
        ? data.jobs
            .map((job: unknown) => {
              const full = normalizeFullJob(job);
              if (!full) {
                return null;
              }

              return {
                id: full.id,
                title: full.title,
                company: full.company,
                status: "pending" as const,
                full,
                generated: "",
              };
            })
            .filter((job: Job | null): job is Job => job !== null)
        : [];

      setJobs(parsedJobs);
      setResumeText(data.resumeText);

      persistJobs(parsedJobs);
      localStorage.setItem("resumeText", data.resumeText);
      toast.success(`Parsed ${parsedJobs.length} jobs successfully.`, {
        id: parseToastId,
      });

    } catch (error) {
      console.error("Parsing failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Parsing failed",
        { id: parseToastId }
      );
    }
  };

  // Step 2: Process ONE job (AI)
  const processJob = async (job: Job) => {
    const generateToastId = toast.loading(`Generating resume for ${job.title}...`);
    const wasGenerated = await generateJob(job, { toastId: generateToastId });

    if (wasGenerated) {
      return;
    }
  };

  const sendResumeEmail = async (job: Job) => {
    if (!job.generated?.trim()) {
      toast(`Generate a resume for ${job.title} before emailing it.`, {
        icon: "ℹ",
      });
      return;
    }

    const fullJob = normalizeFullJob(job.full) ?? normalizeFullJob(job);
    if (!fullJob) {
      toast.error(`Missing job details for ${job.title}.`);
      return;
    }

    const recipient = window.prompt(
      `Send ${job.title} at ${job.company} to which email address?`
    )?.trim();

    if (!recipient) {
      return;
    }

    setEmailingJobId(job.id);
    const emailToastId = toast.loading(`Sending ${job.title} to ${recipient}...`);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient,
          job: fullJob,
          resume: job.generated,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Email sending failed"
        );
      }

      if (data.attachmentType === "html") {
        toast(`Resume sent to ${recipient} with HTML fallback attachment.`, {
          id: emailToastId,
          icon: "⚠",
        });
        return;
      }

      toast.success(`Resume sent to ${recipient} as PDF.`, {
        id: emailToastId,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Email sending failed",
        { id: emailToastId }
      );
    } finally {
      setEmailingJobId(null);
    }
  };

  // ---------------- UI ----------------

  return (
    <main className="app-shell min-h-screen px-4 py-6 text-[#122033] md:px-6 lg:px-8">
      <section className="glass-panel product-grid overflow-hidden rounded-[32px] px-6 py-8 md:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border-2 border-[#ff6b57] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#ff6b57] shadow-sm">
              Resume Ops Studio
            </span>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[#10233a] md:text-6xl">
              Tailor, preview, export, and send polished resumes at scale.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#42546b] md:text-lg">
              Upload your source files once, let Gemini rewrite each resume for the role,
              then review, download PDF, or email the result.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
            <div className="rounded-3xl bg-[#16324f] p-4 text-white shadow-[0_20px_60px_rgba(22,50,79,0.2)]">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Jobs Loaded</p>
              <p className="mt-2 text-3xl font-semibold">{jobs.length}</p>
            </div>
            <div className="rounded-3xl border-2 border-[#16324f] bg-[#ffffff] p-4 shadow-[0_20px_44px_rgba(16,35,58,0.08)]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#65758b]">Remaining</p>
              <p className="mt-2 text-3xl font-semibold text-[#ff6b57]">{remainingJobsCount}</p>
            </div>
            <div className="rounded-3xl bg-[#6d5efc] p-4 text-white shadow-[0_20px_52px_rgba(109,94,252,0.24)]">
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">Ready To Run</p>
              <p className="mt-2 text-lg font-semibold">
                {isReady() ? "Files attached" : "Waiting for inputs"}
              </p>
            </div>
            <div className="rounded-3xl bg-[#f7b32b] p-4 text-[#10233a] shadow-[0_20px_52px_rgba(247,179,43,0.24)]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#6d4700]">Generated</p>
              <p className="mt-2 text-3xl font-semibold text-[#10233a]">
                {jobs.filter((job) => job.generated?.trim()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-6 md:p-7">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#10233a] md:text-xl">Input Files</h2>
              <p className="text-sm text-[#64748b]">
                Add your Excel, JSON, and source resume once to unlock the full pipeline.
              </p>
            </div>

            <button
              disabled={!isReady()}
              onClick={runPipeline}
              className="inline-flex items-center justify-center rounded-2xl bg-[#ff6b57] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,107,87,0.24)] transition hover:scale-[1.01] hover:bg-[#ef5a46] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Parse Jobs
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <UploadCard title="Excel" accept=".xlsx" onFileSelect={setExcelFile} />
            <UploadCard title="JSON" accept=".json" onFileSelect={setJsonFile} />
            <UploadCard title="Resume" accept=".docx" onFileSelect={setResumeFile} />
          </div>
        </div>
      </section>

      {/* Resume */}
      {resumeText && (
        <ResumeTabs
          activeTab={activeResumeTab}
          generatedJob={selectedGeneratedJob}
          onTabChange={setActiveResumeTab}
          resumeText={resumeText}
          resumeFile={resumeFile}
        />
      )}

      <div className="mt-6">
        <JobsTable
          bulkAction={bulkAction}
          emailingJobId={emailingJobId}
          jobs={jobs}
          onGenerateAll={() => processJobsInBulk("all")}
          onGenerateRemaining={() => processJobsInBulk("remaining")}
          onProcess={processJob}
          onSendEmail={sendResumeEmail}
          onViewResume={openGeneratedResume}
          remainingJobsCount={remainingJobsCount}
        />
      </div>
    </main>
  );
}

//
// ---------------- TABLE ----------------
//

