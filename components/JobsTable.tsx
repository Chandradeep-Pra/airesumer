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
      return "px-3 py-1 rounded bg-orange-500 text-white text-sm";
    }

    return "px-3 py-1 rounded bg-[#6C63FF] text-white text-sm";
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
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Jobs</h2>
          <p className="text-sm text-gray-500">
            {jobs.length} total jobs, {remainingJobsCount} remaining to generate.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onGenerateAll}
            disabled={!jobs.length || bulkAction !== null}
            className="rounded-xl bg-[#1F2937] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkAction === "all" ? "Generating All..." : "Generate For All"}
          </button>

          <button
            onClick={onGenerateRemaining}
            disabled={!remainingJobsCount || bulkAction !== null}
            className="rounded-xl border border-[#6C63FF] px-4 py-2 text-sm font-medium text-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkAction === "remaining"
              ? "Generating Remaining..."
              : `Generate Remaining (${remainingJobsCount})`}
          </button>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-600">
            <th>Job</th>
            <th>Company</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t">
              <td className="py-3 font-medium">{job.title}</td>
              <td>{job.company}</td>
              <td><StatusBadge status={job.status} /></td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onProcess(job)}
                    disabled={job.status === "processing"}
                    className={getActionButtonClassName(job.status)}
                  >
                    {getActionLabel(job.status)}
                  </button>

                  {job.generated && (
                    <button
                      onClick={() => onViewResume(job.id)}
                      className="px-3 py-1 rounded border border-[#6C63FF] text-[#6C63FF] text-sm"
                    >
                      View Resume
                    </button>
                  )}

                  {job.generated && (
                    <button
                      onClick={() => onSendEmail(job)}
                      disabled={emailingJobId === job.id}
                      className="px-3 py-1 rounded border border-[#1F2937] text-[#1F2937] text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
export default JobsTable;