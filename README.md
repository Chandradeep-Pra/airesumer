# AI Resumer

Small Next.js app to parse jobs and a base resume, rewrite the resume per job using Gemini, preview the result, download it as PDF, and send it by email.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required keys:

```env
GEMINI_API_KEY=your_gemini_api_key

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

( From Google Developer Account)
```

## Run

Development:

```bash
npm run dev
```

Production build check:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## How To Use

1. Upload three files:
	Excel file with job ids and URLs
	JSON file with job details
	DOCX resume file

2. Click `Parse Jobs`.

3. Use the job table to:
	`Rewrite` one resume
	`Generate For All`
	`Generate Remaining`
	`View Resume`
	`Download PDF`
	`Send Email`

4. For email sending, enter the recipient email when prompted. The app sends one email per job with:
	the tailored resume as a PDF attachment
	job title, company, and job URL in the email body

## What It Uses

- Next.js App Router for UI and API routes
- React + TypeScript for the frontend
- Gemini API for resume rewriting
- `xlsx` for Excel parsing
- `mammoth` for DOCX to text extraction
- `react-hot-toast` for live operation feedback
- `nodemailer` for email sending
- `puppeteer` for server-side PDF generation

## Main Flow

1. `/api/process` parses uploaded files and merges job data.
2. `/api/generate` sends the base resume and job details to Gemini.
3. Generated resumes are previewed as styled HTML and can be downloaded as PDF.
4. `/api/send-email` converts the resume to PDF and sends it as an attachment.
