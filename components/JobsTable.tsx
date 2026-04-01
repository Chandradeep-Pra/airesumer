import StatusBadge from "./StatusBadge";

type JobRow = {
  id: number;
  title: string;
  company: string;
  status: "pending" | "processing" | "completed" | "failed";
  generated?: string;
  full?: {
    id: number;
    title: string;
    company: string;
    description: string;
    url?: string;
  };
};

type BulkAction = "all" | "remaining" | null;

function JobsTable({
  bulkAction,
  emailingJobId,
  jobs,
  onGenerateAll,
  onGenerateRemaining,
  onProcess,
  onSendEmail,
  onViewResume,
  remainingJobsCount,
}: {
  bulkAction: BulkAction;
  emailingJobId: number | null;
  jobs: JobRow[];
  onGenerateAll: () => void;
  onGenerateRemaining: () => void;
  onProcess: (job: JobRow) => void;
  onSendEmail: (job: JobRow) => void;
  onViewResume: (jobId: number) => void;
  remainingJobsCount: number;
}) {
  const getActionButtonClassName = (status: JobRow["status"]) => {
    if (status === "failed") {
      return "rounded-xl bg-[#f97316] px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)]";
    }

    return "rounded-xl bg-[#6d5efc] px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,94,252,0.22)]";
  };

  const getActionLabel = (status: JobRow["status"]) => {
    if (status === "processing") {
      return "Processing...";
    }

    if (status === "completed" || status === "failed") {
      return "Regenerate";
    }

    return "Rewrite";
  };

  return (
    <div className="glass-panel overflow-hidden rounded-[30px] p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#10233a]">Jobs</h2>
          <p className="text-sm text-[#64748b]">
            {jobs.length} total jobs, {remainingJobsCount} remaining to generate.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onGenerateAll}
            disabled={!jobs.length || bulkAction !== null}
            className="rounded-2xl bg-[#16324f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(22,50,79,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkAction === "all" ? "Generating All..." : "Generate For All"}
          </button>

          <button
            onClick={onGenerateRemaining}
            disabled={!remainingJobsCount || bulkAction !== null}
            className="rounded-2xl border-2 border-[#6d5efc] bg-white px-4 py-2.5 text-sm font-semibold text-[#6d5efc] shadow-[0_10px_30px_rgba(18,32,51,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkAction === "remaining"
              ? "Generating Remaining..."
              : `Generate Remaining (${remainingJobsCount})`}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border-2 border-[#d9e3ef] bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#edf2f8] text-xs uppercase tracking-[0.18em] text-[#607087]">
            <th className="px-5 py-4">Job</th>
            <th className="px-5 py-4">Company</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Action</th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-slate-100/90 align-top transition hover:bg-[#f7faff]">
              <td className="px-5 py-4">
                <div className="font-semibold text-[#10233a]">{job.title}</div>
                {job.full?.url && (
                  <a
                    href={job.full.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-[#14b8d4] hover:underline"
                  >
                    Open job link
                  </a>
                )}
              </td>
              <td className="px-5 py-4 text-[#42546b]">{job.company}</td>
              <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => onProcess(job)}
                    disabled={job.status === "processing"}
                    className={`${getActionButtonClassName(job.status)} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {getActionLabel(job.status)}
                  </button>

                  {job.generated && (
                    <button
                      onClick={() => onViewResume(job.id)}
                      className="rounded-xl border-2 border-[#6d5efc] bg-white px-3 py-2 text-sm font-semibold text-[#6d5efc] shadow-[0_8px_24px_rgba(18,32,51,0.06)]"
                    >
                      View Resume
                    </button>
                  )}

                  {job.generated && (
                    <button
                      onClick={() => onSendEmail(job)}
                      disabled={emailingJobId === job.id}
                      className="rounded-xl border-2 border-[#16324f] bg-[#f3f7fb] px-3 py-2 text-sm font-semibold text-[#16324f] shadow-[0_8px_24px_rgba(18,32,51,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {emailingJobId === job.id ? "Sending..." : "Send Email"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
export default JobsTable;