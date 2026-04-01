import { useEffect, useState } from "react";

export default function OriginalResumeView({
  resumeFile,
}: {
  resumeFile: File | null;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeFile) return;

    const fileUrl = URL.createObjectURL(resumeFile);
    setUrl(fileUrl);

    return () => URL.revokeObjectURL(fileUrl);
  }, [resumeFile]);

  if (!resumeFile) return <p>No file uploaded</p>;

  return (
    <iframe
      src={url || ""}
      className="w-full h-[400px] rounded-lg"
    />
  );
}