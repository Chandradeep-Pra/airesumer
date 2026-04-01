type Props = {
  status: "pending" | "processing" | "completed" | "failed";
};

export default function StatusBadge({ status }: Props) {
  const styles = {
    pending: "border border-amber-200 bg-amber-50 text-amber-700",
    processing: "border border-cyan-200 bg-cyan-50 text-cyan-700",
    completed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    failed: "border border-orange-200 bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}