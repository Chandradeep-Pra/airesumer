type ResumePreviewJob = {
  title: string;
  company: string;
};

type ResumeSection = {
  heading: string;
  lines: string[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const isSectionHeading = (line: string) => {
  const lower = line.toLowerCase().replace(/:$/, "").trim();

  return [
    "summary",
    "professional summary",
    "skills",
    "core skills",
    "technical skills",
    "experience",
    "professional experience",
    "work experience",
    "education",
    "projects",
    "certifications",
    "awards",
  ].includes(lower);
};

const isBulletLine = (line: string) => /^[\-*•]/.test(line.trim());

const stripBullet = (line: string) => line.replace(/^[\-*•]\s*/, "").trim();

const parseResumeContent = (content: string) => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const name = lines[0] ? normalizeWhitespace(lines[0]) : "Generated Resume";
  let cursor = 1;
  const headerLines: string[] = [];

  while (cursor < lines.length && !isSectionHeading(lines[cursor])) {
    headerLines.push(normalizeWhitespace(lines[cursor]));
    cursor += 1;
  }

  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];

    if (isSectionHeading(line)) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        heading: normalizeWhitespace(line.replace(/:$/, "")),
        lines: [],
      };
      continue;
    }

    if (!currentSection) {
      headerLines.push(normalizeWhitespace(line));
      continue;
    }

    currentSection.lines.push(line);
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    name,
    headerLines,
    sections,
  };
};

const renderSectionBody = (lines: string[]) => {
  const html: string[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) {
      return;
    }

    html.push(
      `<ul>${bulletBuffer
        .map((line) => `<li>${escapeHtml(stripBullet(line))}</li>`)
        .join("")}</ul>`
    );
    bulletBuffer = [];
  };

  for (const rawLine of lines) {
    const line = normalizeWhitespace(rawLine);

    if (isBulletLine(line)) {
      bulletBuffer.push(line);
      continue;
    }

    flushBullets();

    if (line.includes("|") || line.includes("•")) {
      html.push(`<p class="meta-row">${escapeHtml(line)}</p>`);
      continue;
    }

    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushBullets();
  return html.join("");
};

export function generateResumeHTML(content: string, job: ResumePreviewJob) {
  const { headerLines, name, sections } = parseResumeContent(content);

  const header = headerLines.length
    ? `<div class="contact">${headerLines
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join("")}</div>`
    : "";

  const body = sections.length
    ? sections
        .map(
          (section) => `
            <section>
              <h2>${escapeHtml(section.heading)}</h2>
              ${renderSectionBody(section.lines)}
            </section>
          `
        )
        .join("")
    : `<section><h2>Resume</h2>${renderSectionBody(content.split("\n"))}</section>`;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page {
          size: A4;
          margin: 14mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: "Georgia", "Times New Roman", serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 18mm 16mm;
          color: #1F2937;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        }

        .page {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .header {
          padding: 28px 34px 22px;
          background: linear-gradient(135deg, #111827 0%, #312e81 100%);
          color: #ffffff;
        }

        h1 {
          font-size: 34px;
          line-height: 1.05;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .role {
          margin-top: 8px;
          font-family: Arial, sans-serif;
          font-size: 13px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.76);
        }

        .contact {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 18px;
          font-family: Arial, sans-serif;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.92);
        }

        .body {
          padding: 26px 34px 34px;
        }

        h2 {
          font-size: 12px;
          margin-top: 26px;
          margin-bottom: 12px;
          color: #4338CA;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border-bottom: 2px solid #C7D2FE;
          padding-bottom: 8px;
          font-family: Arial, sans-serif;
        }

        p {
          margin: 8px 0;
          line-height: 1.55;
          font-size: 14px;
        }

        .meta {
          color: #E0E7FF;
          font-family: Arial, sans-serif;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0 0 8px;
        }

        .meta-row {
          color: #4B5563;
          font-family: Arial, sans-serif;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        ul {
          margin: 10px 0 0;
          padding-left: 20px;
        }

        li {
          margin: 7px 0;
          line-height: 1.5;
          font-size: 14px;
        }

        section:first-of-type h2 {
          margin-top: 0;
        }

        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }

          .page {
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>

    <body>
      <div class="page">
        <header class="header">
          <h1>${escapeHtml(name)}</h1>
          <p class="role">${escapeHtml(job.title)} at ${escapeHtml(
            job.company
          )}</p>
          ${header}
        </header>

        <main class="body">
          ${body}
        </main>
      </div>
    </body>
  </html>
  `;
}