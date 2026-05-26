# VedaAI Assessment Creator

AI-powered assessment creation platform that lets teachers create assignments, generate structured question papers with Groq, and view/download exam-ready outputs.

## Features
- Assignment creation with validation, file upload (PDF/TXT), and question-type configuration
- Groq-backed AI generation with strict JSON parsing (no raw LLM rendering)
- MongoDB persistence for assignments and results
- Redis + BullMQ job queue for background generation + PDF export
- WebSocket updates for real-time status
- Exam-style output layout with difficulty badges and student info fields
- PDF export with proper formatting

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + Zustand + Socket.io
- **Backend:** Node.js + Express (TypeScript) + MongoDB + Redis + BullMQ
- **LLM:** Groq (OpenAI-compatible SDK)

## Architecture Overview
1. Teacher submits assignment configuration
2. API validates input + stores assignment
3. Job queued in BullMQ
4. Worker generates structured JSON using Groq
5. Results stored in MongoDB + cached in Redis
6. WebSocket events notify frontend
7. PDF worker builds exam-ready PDF

## Getting Started
### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` and fill in values:
```bash
cp .env.example .env
```

### 3. Start MongoDB + Redis
```bash
docker-compose up -d
```

### 4. Run dev servers
```bash
npm run dev
```

### 5. Run background worker
```bash
npm run dev:worker --workspace @vedaai/api
```

Frontend runs on `http://localhost:3000`, API on `http://localhost:4000`.

## API Endpoints
- `POST /api/assignments` (multipart form data)
- `GET /api/assignments`
- `GET /api/assignments/:id`
- `POST /api/assignments/:id/regenerate`
- `GET /api/assignments/:id/pdf`

## Security Practices
- Helmet + CORS allowlist
- Rate limiting and input validation with Zod
- MongoDB injection sanitization
- File upload type + size validation
- Environment-based config with strict validation

## Notes
Figma assets were referenced from provided screenshots due to limited design file access in the current environment.
