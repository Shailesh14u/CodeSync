# CodeSync AI - Local Development Setup Guide

Follow this guide to get the CodeSync AI full-stack monorepo running on your development machine.

---

## Prerequisites

- **Node.js**: v18+ (v20+ recommended, tested on v24)
- **Python**: 3.11+ (tested on 3.12 and 3.13)
- **Docker & Docker Compose** (Optional for local standalone mode, required for full sandbox containerization)
- **Git**

---

## Method A: Standalone Local Development (Quickest)

### 1. Clone & Configure Environment

```bash
cd CodeSync
# Copy the environment template
copy .env.example .env
```

Review `.env`. By default, `DATABASE_URL` is configured for local zero-config SQLite (`sqlite+aiosqlite:///./codesync.db`), allowing you to start immediately without installing or running a local PostgreSQL service.

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest

# Start FastAPI development server with hot-reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at:
- Root: `http://localhost:8000/`
- Health check: `http://localhost:8000/api/v1/health`
- Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

### 3. Frontend Setup (React + Vite + Tailwind)

In a new terminal:

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application will be available at:
- Web App: `http://localhost:5173/`

---

## Method B: Containerized Development (Docker Compose)

To run the entire stack including PostgreSQL 16, Redis 7, Backend, Collaboration Server, and Frontend inside Docker containers:

```bash
cd infrastructure

# Start all services with Docker Compose
docker compose up -d

# Verify running containers
docker compose ps

# View service logs
docker compose logs -f backend
```

Services exposed:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Collaboration Server**: `ws://localhost:1234`

---

## Running Verification Tests

### Backend Unit & Integration Tests
```bash
cd backend
.\.venv\Scripts\pytest.exe -v
```

### Frontend Typecheck & Build
```bash
cd frontend
npm run build
```
