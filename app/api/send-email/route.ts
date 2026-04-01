import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateResumeHTML } from "@/src/lib/generateHTML";
import { generateResumePdf } from "@/src/lib/generatePDF";

export const runtime = "nodejs";

type EmailJobPayload = {
  title: string;
  company: string;
  url?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeJobPayload = (value: unknown): EmailJobPayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const company = typeof value.company === "string" ? value.company.trim() : "";
  const url = typeof value.url === "string" ? value.url.trim() : "";

  if (!title || !company) {
    return null;
  }

  return {
    title,
    company,
    url: url || undefined,
  };
};

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "resume";

type MailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = isRecord(body) ? body : {};
    const recipient =
      typeof payload.recipient === "string" ? payload.recipient.trim() : "";
    const resume = typeof payload.resume === "string" ? payload.resume.trim() : "";
    const job = normalizeJobPayload(payload.job);

    if (!recipient || !isValidEmail(recipient)) {
      return NextResponse.json(
        { error: "A valid recipient email is required." },
        { status: 400 }
      );
    }

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

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const service = process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || "gmail";
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || user;

    if (!user || !pass || !from) {
      return NextResponse.json(
        {
          error:
            "Email configuration is missing. Set EMAIL_USER and EMAIL_PASS. Optionally set EMAIL_FROM or SMTP_* variables for a custom transport.",
        },
        { status: 500 }
      );
    }

    const transporter = host
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        })
      : nodemailer.createTransport({
          service,
          auth: {
            user,
            pass,
          },
        });

    const attachmentHtml = generateResumeHTML(resume, {
      title: job.title,
      company: job.company,
    });
    let attachment: MailAttachment;

    try {
      const attachmentPdf = await generateResumePdf(attachmentHtml);
      attachment = {
        filename: `${sanitizeFileName(job.company)}-${sanitizeFileName(job.title)}-resume.pdf`,
        content: attachmentPdf,
        contentType: "application/pdf",
      };
    } catch (error) {
      console.error("PDF generation failed, falling back to HTML attachment:", error);
      attachment = {
        filename: `${sanitizeFileName(job.company)}-${sanitizeFileName(job.title)}-resume.html`,
        content: attachmentHtml,
        contentType: "text/html; charset=utf-8",
      };
    }

    const jobUrlMarkup = job.url
      ? `<p><strong>Job URL:</strong> <a href="${job.url}">${job.url}</a></p>`
      : "<p><strong>Job URL:</strong> Not provided</p>";

    await transporter.sendMail({
      from,
      to: recipient,
      subject: `Tailored Resume - ${job.title} at ${job.company}`,
      text: [
        `Job Title: ${job.title}`,
        `Company: ${job.company}`,
        `Job URL: ${job.url || "Not provided"}`,
        "",
        `The tailored resume is attached as a ${attachment.contentType === "application/pdf" ? "PDF" : "HTML"} file.`,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <p>Please find the tailored resume attached.</p>
          <p><strong>Job Title:</strong> ${job.title}</p>
          <p><strong>Company:</strong> ${job.company}</p>
          <p><strong>Attachment Type:</strong> ${attachment.contentType === "application/pdf" ? "PDF" : "HTML fallback"}</p>
          ${jobUrlMarkup}
        </div>
      `,
      attachments: [attachment],
    });

    return NextResponse.json({
      success: true,
      attachmentType:
        attachment.contentType === "application/pdf" ? "pdf" : "html",
    });
  } catch (error) {
    console.error("Email send failed:", error);

    return NextResponse.json(
      { error: "Unable to send email." },
      { status: 500 }
    );
  }
}