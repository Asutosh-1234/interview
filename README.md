# AI Interview Simulator

A production-ready web application that helps job seekers practice interview questions in real time, receive instant AI feedback, and track their performance across multiple adaptive sessions. 

The application utilizes the **Google Gemini API** to generate questions tailored to the candidate's experience and resume, evaluate candidate responses with structured feedback, and adapt the interview questions dynamically based on prior answers.

---

## 🚀 Key Features

### 1. Setup & Configuration Screen
- **Manual Setup**: Customize the job role, company name, experience level (Fresher, Junior, Mid-Level, Senior), interview type (Technical, Behavioral, System Design, UI/UX, Mixed), question count (3 to 10), and optional timer.
- **✨ Tailored Profile Interview (Quick Start)**: Skip manual configuration! Let Gemini analyze your profile bio, skills, and parsed resume text to recommend parameters and generate an interview session instantly.

### 2. Profile Setup & AI Resume Parser
- **Drag & Drop Upload**: Upload your resume (PDF, DOCX, or TXT).
- **Gemini Parsing**: Gemini automatically parses your resume to extract your full name, phone, bio, key skills, and years of experience, auto-filling your profile.
- **Persistent Profile**: Stored in the database and used automatically to customize future simulations.

### 3. Interactive Interview Terminal
- **Adaptive Stream**: Questions are streamed chunk-by-chunk in real time. The AI adapts dynamically—asking deeper questions on topics you answer well, clarifying points, or pivoting.
- **Integrated Code Editor**: Detects coding questions (algorithms, system problems) and automatically triggers an embedded Monaco Code Editor in the UI so you can write and format code.
- **Tip Chips**: Dynamically generates 3 brief, helpful hint chips to help you structure your approach.
- **Timer**: Optional countdown timer (1 to 5 minutes) per question with automatic submission on expiration.
- **Word Counter**: Real-time counter to help candidates target optimal response length (50-150 words).

### 4. Summary & Feedback Dashboard
- **Average Performance Score**: Out of 10, with category sub-scores (Clarity, Depth, Relevance).
- **Session Analysis**: Verdict labels (Strong / Good / Fair / Needs Work) based on average performance.
- **Strengths & Improvements**: Inline review highlights for what went well, what to improve, and a model answer hint for each question.
- **Metrics Dashboard**: Track your overall practice history, session completion rate, primary focus role, and progress over time.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: PostgreSQL (containerized with Docker)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) via `@google/genai` SDK
- **Rich Text Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Authentication**: JWT Cookie Session
- **Runtime**: [Bun](https://bun.sh/) (or Node.js)

---

## 🏃 Getting Started

### 1. Prerequisites
Make sure you have [Docker](https://www.docker.com/), [Node.js](https://nodejs.org/), and [Bun](https://bun.sh/) (optional but recommended) installed.

### 2. Environment Setup
Create a `.env.local` or `.env` file in the root directory:

```env
# Database connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview?schema=public"

# JWT configuration
JWT_SECRET="your-jwt-super-secret-key"

# Gemini AI Credentials
GEMINI_API_KEY="your-gemini-api-key"
QUESTION_MODEL="gemini-2.5-flash"
```

### 3. Spin Up Database
Use Docker Compose to run the PostgreSQL database:
```bash
docker compose up -d
```

### 4. Initialize Database & Client
Generate the Prisma Client and push the schema to PostgreSQL:
```bash
bun run db:generate
bun run db:push
```

### 5. Install Dependencies & Start Dev Server
Install the node modules and start the Next.js local development server:
```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.
