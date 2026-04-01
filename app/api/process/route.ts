import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const excelFile = formData.get("excel") as File;
    const jsonFile = formData.get("json") as File;
    const resumeFile = formData.get("resume") as File;

    if (!excelFile || !jsonFile || !resumeFile) {
      return NextResponse.json(
        { error: "Missing files" },
        { status: 400 }
      );
    }

    //  Parse Excel
    const excelBuffer = Buffer.from(await excelFile.arrayBuffer());
    const workbook = XLSX.read(excelBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet);

    //  Parse JSON
    const jsonBuffer = Buffer.from(await jsonFile.arrayBuffer());
    const jsonData = JSON.parse(jsonBuffer.toString());
    const jobs = jsonData.jobs;

    //  Parse Resume (DOCX → text)
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());

    const result = await mammoth.extractRawText({
      buffer: resumeBuffer,
    });

    const rawResumeText = result.value;

    //  Clean Resume Text (VERY IMPORTANT)
    const cleanedResume = rawResumeText
            .replace(/\r/g, "")
            .replace(/\n{2,}/g, "\n\n") // keep paragraph spacing
            .trim();

    // 🔗 Merge Jobs
    const mergedJobs = excelData.map((row: any) => {
      const job = jobs.find((j: any) => j.id === row["#"]);

      if (!job) return null;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        url: row["URL"],

        description: job.description,
        requirements: job.requirements,
        nice_to_have: job.nice_to_have,
      };
    }).filter(Boolean);

    console.log("Resume preview:", cleanedResume.slice(0, 200));

    return NextResponse.json({
      jobs: mergedJobs,
      resumeText: cleanedResume, //  important for next step
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}