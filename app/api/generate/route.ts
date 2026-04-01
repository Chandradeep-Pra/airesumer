import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type GenerateJobPayload = {
  id: number;
  title: string;
  description: string;
  requirements?: string[];
  nice_to_have?: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseJsonBody = async (req: NextRequest) => {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return req.json();
  }

  const rawBody = await req.text();
  return rawBody ? JSON.parse(rawBody) : null;
};

const normalizeJobPayload = (value: unknown): GenerateJobPayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "number" ? value.id : Number(value.id);
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description =
    typeof value.description === "string" ? value.description.trim() : "";

  if (!Number.isFinite(id) || !title || !description) {
    return null;
  }

  return {
    id,
    title,
    description,
    requirements: Array.isArray(value.requirements)
      ? value.requirements.filter(
          (item): item is string => typeof item === "string"
        )
      : undefined,
    nice_to_have: Array.isArray(value.nice_to_have)
      ? value.nice_to_have.filter(
          (item): item is string => typeof item === "string"
        )
      : undefined,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req);
    const payload = isRecord(body) ? body : {};
    const resumeText =
      typeof payload.resumeText === "string" ? payload.resumeText : "";
    const job = normalizeJobPayload(payload.job);

    console.log("Received generation request for job:", job?.id);


    // ---------------- VALIDATION ----------------
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Invalid resume text" },
        { status: 400 }
      );
    }

    if (!job) {
      console.error("Invalid job payload:", job);

      return NextResponse.json(
        { error: "Invalid job data" },
        { status: 400 }
      );
    }

    // ---------------- SAFE EXTRACTION ----------------
    const title = job.title;
    const description = job.description;
    const requirements = Array.isArray(job.requirements)
      ? job.requirements.join(", ")
      : "";
    const niceToHave = Array.isArray(job.nice_to_have)
      ? job.nice_to_have.join(", ")
      : "";

    // ---------------- GEMINI SETUP ----------------
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY!
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // safer + stable
    });

    // ---------------- PROMPT ----------------
    const prompt = `
You are a senior recruiter and resume optimization expert.

GOAL:
Tailor the candidate's resume specifically for this job.

JOB DETAILS:
Title: ${title}
Description: ${description}
Requirements: ${requirements}
Nice to have: ${niceToHave}

CANDIDATE RESUME:
${resumeText}

RULES:
- Do NOT invent fake experience
- Prioritize relevant skills
- Rewrite experience bullets to match job
- Use strong action verbs
- Keep it concise (1–2 pages max)
- Make it ATS-friendly

OUTPUT FORMAT:
Name

Summary (3–4 lines)

Skills

Experience (bullet points)

Education

Return ONLY the resume. No explanation.
`;

    // ---------------- AI CALL ----------------
    const result = await model.generateContent(prompt);
    const response = await result.response;

    let text = response.text();

    // ---------------- CLEAN OUTPUT ----------------
    text = text
      .replace(/```/g, "")
      .replace(/\*\*/g, "") // remove markdown bold
      .trim();

    console.log("Generated Resume Preview:", text.slice(0, 200));

    return NextResponse.json({ resume: text });

  } catch (error) {
    console.error("Gemini error:", error);

    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 }
    );
  }
}