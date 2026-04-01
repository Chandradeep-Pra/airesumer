type Props = {
  status: "pending" | "processing" | "completed" | "failed";
};

export default function StatusBadge({ status }: Props) {
  const styles = {
    pending: "bg-orange-100 text-orange-600",
    processing: "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
    failed: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}