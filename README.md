# 🚀 Autonomous AI Job Hunter for Freshers

A production-grade, AI-powered job hunting platform built specifically for freshers, new graduates, and entry-level candidates. Automatically discovers, filters, ranks, and notifies you about the best opportunities.

---

## 🌟 Features

| Feature | Description |
|---|---|
| **Multi-Site Scraping** | LinkedIn, Wellfound, Naukri, Instahyre, YC Jobs, RemoteOK, Greenhouse, Lever |
| **Smart Filtering** | 0–1 yr experience, ≥ ₹8 LPA, remote / India-based |
| **AI Resume Matching** | Upload PDF → semantic similarity → ranked matches |
| **Salary Estimation** | LLM + heuristics for missing salary data |
| **Autonomous Agents** | CrewAI multi-agent system for continuous search |
| **Telegram Alerts** | Real-time notifications with apply links |
| **Email Notifications** | Daily digest + instant alerts |
| **Modern Dashboard** | Linear-inspired dark UI with animations |
| **Semantic Search** | Natural language job search |
| **Cover Letter Gen** | AI-generated, personalised cover letters |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                │
│         Dashboard │ Job Feed │ Resume Upload │ Analytics    │
└────────────────────────┬────────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                     BACKEND (FastAPI)                       │
│   Auth │ Jobs API │ Resume API │ Notifications │ Search     │
└──────────┬──────────────────┬──────────────────────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼──────────────────────────────┐
│   MongoDB       │  │          Redis + Celery                │
│  (Primary DB)   │  │  (Cache + Background Task Queue)       │
└─────────────────┘  └────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    AI AGENT LAYER (CrewAI)                  │
│  JobSearch │ SalaryEstimation │ ResumeMatch │ Notification  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   SCRAPING ENGINE                           │
│         Playwright (dynamic) + BeautifulSoup (static)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone & Configure

```bash
git clone https://github.com/yourname/ai-job-hunter.git
cd ai-job-hunter
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start with Docker

```bash
docker-compose up --build
```

### 3. Access the App

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Redis | localhost:6379 |
| MongoDB | localhost:27017 |

---

## 📁 Project Structure

```
ai-job-hunter/
├── backend/
│   ├── api/
│   │   ├── routes/          # FastAPI route handlers
│   │   └── middleware/      # Auth, rate limiting, logging
│   ├── models/              # MongoDB models (Motor async)
│   ├── services/            # Business logic layer
│   ├── agents/              # CrewAI autonomous agents
│   ├── scrapers/            # Playwright + BS4 scrapers
│   ├── workers/             # Celery background workers
│   ├── utils/               # Helpers, salary estimator, etc.
│   └── database/            # DB connection & migrations
├── frontend/
│   ├── app/                 # Next.js 15 App Router
│   ├── components/          # React components
│   ├── lib/                 # Utilities, API client
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript definitions
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── scripts/
│   └── setup.sh
├── docker-compose.yml
└── .env.example
```

---

## 🔑 Environment Variables

See `.env.example` for all required variables.

Key variables:
- `OPENAI_API_KEY` – GPT-4 for agents
- `TELEGRAM_BOT_TOKEN` – Telegram notifications
- `GOOGLE_CLIENT_ID/SECRET` – OAuth
- `MONGODB_URI` – MongoDB connection
- `REDIS_URL` – Redis connection
- `JWT_SECRET` – Auth secret

---

## 🤖 AI Agents

| Agent | Role |
|---|---|
| **Job Search Agent** | Continuously searches 8+ platforms |
| **Salary Estimation Agent** | Predicts missing salary data |
| **Resume Match Agent** | Ranks jobs by resume compatibility |
| **Notification Agent** | Sends Telegram + email alerts |
| **Skill Recommendation Agent** | Suggests what to learn next |

---

## 📊 API Endpoints

See `http://localhost:8000/docs` for full Swagger documentation.

Key endpoints:
- `POST /auth/register` – User registration
- `POST /auth/login` – JWT login
- `GET /auth/google` – Google OAuth
- `POST /resume/upload` – Upload + parse resume
- `GET /jobs` – Paginated job feed
- `GET /jobs/search` – Semantic search
- `POST /jobs/{id}/save` – Save a job
- `POST /jobs/{id}/apply` – Track application
- `GET /analytics/dashboard` – User analytics
- `POST /agents/trigger` – Manual agent run

---

## 🧪 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI, Python 3.11, Pydantic v2
- **Database**: MongoDB (Motor async driver), Redis
- **Queue**: Celery + Redis broker
- **AI**: OpenAI GPT-4, LangChain, CrewAI, text-embedding-3-small
- **Scraping**: Playwright, BeautifulSoup4, httpx
- **Auth**: JWT, Google OAuth (authlib)
- **Notifications**: python-telegram-bot, fastapi-mail
- **Deploy**: Docker, docker-compose, Nginx

---

## 📄 License

MIT 
Nandish
