//@ts-nocheck
"use client";

function splitIntoSections(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const sectionTitles = [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
  ];

  const sections: any[] = [];
  let current = { title: "", lines: [] as string[] };

  for (let line of lines) {
    const lower = line.toLowerCase();

    const isSection = sectionTitles.some((t) =>
      lower.includes(t)
    );

    if (isSection) {
      if (current.lines.length > 0) {
        sections.push(current);
      }

      current = {
        title: line,
        lines: [],
      };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length > 0) {
    sections.push(current);
  }

  return sections;
}

export default function ParsedResumeView({ text }: { text: string }) {
  const sections = splitIntoSections(text);

  return (
    <div className="space-y-6 text-sm text-gray-800 max-h-[400px] overflow-y-auto">
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.title && (
            <h3 className="text-md font-semibold text-[#1F2937] mb-2">
              {section.title}
            </h3>
          )}

          <div className="space-y-1 leading-relaxed">
            {section.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}