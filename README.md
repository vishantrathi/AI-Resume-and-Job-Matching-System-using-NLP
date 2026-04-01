# AI Resume and Job Matching System using NLP

An intelligent web application that automatically matches candidates with suitable job opportunities using Natural Language Processing and semantic similarity algorithms. Features real-time job discovery, a Python NLP microservice, and a professional SaaS-style dashboard.

## Features

- 📄 **Resume Upload & Parsing** — Upload PDF/DOCX resumes; AI extracts skills, experience, education, and certifications
- 🧠 **NLP Skill Extraction** — Tokenisation, stop-word removal, named entity recognition (spaCy), and keyword extraction
- 🎯 **Semantic Job Matching** — Cosine similarity scoring with sentence-transformers for deep semantic understanding
- 🌐 **Real-Time Job Discovery** — When no DB jobs match, automatically scrapes RemoteOK and other sources
- 📊 **Skill Gap Analysis** — Visual breakdown of matched vs missing skills with learning suggestions
- 💼 **Job Recommendations** — Ranked job listings based on resume match score
- 🏢 **Recruiter Dashboard** — Post jobs, browse candidates, compare match scores
- 👤 **Candidate Dashboard** — Resume insights, top matches, skill cloud visualization
- 🔐 **JWT Authentication** — Secure login/register with rate limiting and input validation
- 🐳 **Docker Support** — Full stack deployable with docker-compose

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 19, Tailwind CSS v3, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| NLP / AI | Python microservice: spaCy, sentence-transformers (all-MiniLM-L6-v2), Flask |
| Matching | Node.js: Skill overlap + Jaccard similarity; Python: Cosine similarity on embeddings |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Parsing | pdf-parse, mammoth (DOCX) |
| Job Discovery | RemoteOK public API, fallback template generation |
| Deployment | Docker, docker-compose, Vercel (frontend), Render/Railway (backend) |

## Project Structure

```
├── backend/
│   ├── config/              # MongoDB connection
│   ├── controllers/         # Business logic (auth, resume, job, match, scrape)
│   ├── middleware/           # Auth, file upload, rate limiter
│   ├── models/              # Mongoose schemas (User, Resume, Job, Match, ScrapedJob)
│   ├── routes/              # Express API routes
│   ├── tests/               # Jest unit tests (28 tests)
│   ├── utils/               # NLP processor, semantic matcher, job scraper
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar (with mobile menu), PrivateRoute
│   │   ├── context/         # AuthContext (JWT state)
│   │   ├── pages/           # Home, Dashboard, ResumeUpload, JobRecommendations,
│   │   │                    # SkillAnalysis, SavedJobs, JobList, PostJob, ...
│   │   ├── api.js           # Axios instance with auth interceptor
│   │   └── App.js           # Router & layout
│   ├── tailwind.config.js
│   └── package.json
├── nlp-service/             # Python NLP microservice
│   ├── app.py               # Flask app: /parse-resume, /match, /extract-skills
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml       # Full stack deployment
└── README.md
```

## Getting Started

### Option A — Docker Compose (Recommended)

```bash
git clone <repo>
cd AI-Resume-and-Job-Matching-System-using-NLP

# Start all services
docker-compose up --build
```

Services start at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- NLP Service: http://localhost:8000
- MongoDB: localhost:27017

### Option B — Manual Setup

#### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.11+ (for NLP service, optional)

#### Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI and JWT_SECRET
npm install
npm start                 # production
npm run dev               # development (nodemon)
npm test                  # run 28 unit tests
```

#### Python NLP Service (optional)

```bash
cd nlp-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py             # starts on port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm start                 # development server (port 3000)
npm run build             # production build
```

## API Endpoints

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login — returns JWT token |
| GET | `/api/auth/profile` | Get current user profile |

### Resume

| Method | Path | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload and parse PDF/DOCX resume |
| GET | `/api/resume/me` | Get own parsed resume |

### Jobs

| Method | Path | Description |
|---|---|---|
| GET | `/api/jobs` | List all active jobs |
| POST | `/api/jobs` | Create job posting (recruiter) |
| POST | `/api/jobs/match` | Compute match scores vs all jobs |
| GET | `/api/jobs/recommendations` | Ranked recommendations (auto-discovers if empty) |
| POST | `/api/jobs/scrape` | Trigger real-time job discovery from web |
| GET | `/api/jobs/scraped` | List all discovered jobs (with search/filter) |

### Candidate

| Method | Path | Description |
|---|---|---|
| GET | `/api/candidate/profile` | Dashboard data |
| GET | `/api/candidate/skill-gap/:jobId` | Skill gap analysis for a specific job |
| GET | `/api/candidate/recruiter/candidates` | All candidates (recruiter only) |

## Job Discovery Pipeline

```
Resume Upload
     ↓
NLP Parsing (skills, experience, education)
     ↓
Search DB Jobs (MongoDB)
     ↓
IF jobs exist → semantic matching → return ranked results
     ↓
IF no jobs → trigger web scraping (RemoteOK API)
     ↓
Store scraped jobs in MongoDB (ScrapedJob collection)
     ↓
Run semantic matching
     ↓
Return ranked results
```

## NLP Architecture

### Node.js NLP Processor

1. **Tokenisation** — Lowercase, strip punctuation, split into tokens
2. **Stop-word removal** — Filter 80+ common English stop words
3. **Skill extraction** — Match against 150+ technical skills (multi-word aware)
4. **Section parsing** — Heuristic detection for Experience, Education, Certifications, Projects
5. **Semantic matching** — Skill overlap (80%) + Jaccard token similarity (20%)
6. **Alias normalisation** — "nodejs" ≡ "node.js" ≡ "node", "reactjs" ≡ "react"

### Python NLP Service

1. **spaCy NER** — Named entity recognition (ORG, GPE, DATE, PERSON)
2. **Sentence Transformers** — `all-MiniLM-L6-v2` generates dense 384-dim embeddings
3. **Semantic scoring** — Cosine similarity: 60% semantic + 40% skill overlap
4. **Graceful degradation** — Works without heavy dependencies, with reduced quality

## Environment Variables

### Backend (`.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_resume_matching
JWT_SECRET=your_long_random_secret_here
REDIS_URL=redis://localhost:6379
NLP_SERVICE_URL=http://localhost:8000
```

### NLP Service (`.env`)

```
PORT=8000
DEBUG=false
```
