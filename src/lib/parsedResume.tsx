export function parseResumeText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let name = lines[0] || "";

  let skills: string[] = [];
  let experience: string[] = [];
  let education: string[] = [];

  let currentSection: "skills" | "experience" | "education" | null = null;

  for (let line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes("skill")) {
      currentSection = "skills";
      continue;
    }

    if (lower.includes("experience")) {
      currentSection = "experience";
      continue;
    }

    if (lower.includes("education")) {
      currentSection = "education";
      continue;
    }

    if (currentSection === "skills") {
      skills.push(line);
    } else if (currentSection === "experience") {
      experience.push(line);
    } else if (currentSection === "education") {
      education.push(line);
    }
  }

  return {
    name,
    skills,
    experience,
    education,
  };
}