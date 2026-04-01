import { NextRequest, NextResponse } from "next/server";
import { generateResumeHTML } from "@/src/lib/generateHTML";
import { generateResumePdf } from "@/src/lib/generatePDF";

export const runtime = "nodejs";

type PdfJobPayload = {
  title: string;
  company: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeJobPayload = (value: unknown): PdfJobPayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const company = typeof value.company === "string" ? value.company.trim() : "";

  if (!title || !company) {
    return null;
  }

  return {
    title,
    company,
  };
};

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "resume";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = isRecord(body) ? body : {};
    const resume = typeof payload.resume === "string" ? payload.resume.trim() : "";
    const job = normalizeJobPayload(payload.job);

    if (!resume) {
      return NextResponse.json(
        { error: "Generated resume content is required." },
        { status: 400 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: "Valid job data is required." },
        { status: 400 }
      );
    }

    const html = generateResumeHTML(resume, job);
    const pdf = await generateResumePdf(html);
    const fileName = `${sanitizeFileName(job.company)}-${sanitizeFileName(job.title)}-resume.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("PDF download failed:", error);

    return NextResponse.json(
      { error: "Unable to generate PDF." },
      { status: 500 }
    );
  }
}