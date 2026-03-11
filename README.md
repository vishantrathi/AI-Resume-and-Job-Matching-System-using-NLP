# AI Resume and Job Matching System using NLP

An intelligent web application that automatically matches candidates with suitable job opportunities using Natural Language Processing and semantic similarity algorithms.

## Features

- 📄 **Resume Upload & Parsing** — Upload PDF/DOCX resumes; AI extracts skills, experience, education, and certifications
- 🧠 **NLP Skill Extraction** — Tokenisation, stop-word removal, named entity recognition, and keyword extraction
- 🎯 **Semantic Job Matching** — TF-IDF-inspired matching with alias-aware skill normalisation
- 📊 **Skill Gap Analysis** — See exactly which skills you need to qualify for a target role
- 💼 **Job Recommendations** — Ranked job listings based on your resume's matching score
- 🏢 **Recruiter Dashboard** — Post jobs, browse candidates, compare match scores
- 👤 **Candidate Dashboard** — View resume insights, top matches, and quick stats
- 🔐 **JWT Authentication** — Secure login/register for candidates and recruiters

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 19, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| NLP / AI | Custom NLP engine (tokenisation, skill extraction, TF-IDF matching) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Parsing | pdf-parse, mammoth (DOCX) |

## Project Structure

```
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth & file upload
│   ├── models/         # Mongoose schemas (User, Resume, Job, Match)
│   ├── routes/         # Express API routes
│   ├── tests/          # Jest unit tests
│   ├── utils/          # NLP processor & semantic matcher
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, PrivateRoute
│   │   ├── context/    # AuthContext (JWT state)
│   │   ├── pages/      # All page components
│   │   ├── api.js      # Axios instance
│   │   └── App.js      # Router & layout
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI and JWT_SECRET
npm install
npm start                 # production
npm run dev               # development (nodemon)
npm test                  # run unit tests
```

### Frontend

```bash
cd frontend
cp .env.example .env      # set REACT_APP_API_URL if needed
npm install
npm start                 # development server (port 3000)
npm run build             # production build
npm test                  # run tests
```

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | — |
| POST | `/api/auth/login` | Login | — |
| GET | `/api/auth/profile` | Get profile | ✓ |
| POST | `/api/resume/upload` | Upload & parse resume | candidate |
| GET | `/api/resume/me` | Get own resume | candidate |
| GET | `/api/jobs` | List all active jobs | — |
| POST | `/api/jobs` | Create job posting | recruiter |
| POST | `/api/jobs/match` | Compute match scores | candidate |
| GET | `/api/jobs/recommendations` | Get ranked recommendations | candidate |
| GET | `/api/candidate/profile` | Dashboard data | candidate |
| GET | `/api/candidate/skill-gap/:jobId` | Skill gap analysis | candidate |
| GET | `/api/candidate/recruiter/candidates` | All candidates | recruiter |

## NLP Architecture

1. **Tokenisation** — Lowercase, strip punctuation, split into tokens
2. **Stop-word removal** — Filter common English stop words
3. **Skill extraction** — Match against a curated list of 150+ technical skills (multi-word aware)
4. **Section parsing** — Heuristic section detection for Experience, Education, Certifications, Projects
5. **Semantic matching** — Skill overlap (80% weight) + Jaccard token similarity (20% weight)
6. **Alias normalisation** — "nodejs" ≡ "node.js" ≡ "node", "reactjs" ≡ "react", etc.
