# CodeSync AI ⚡
### AI-Powered Real-Time Collaborative Cloud Development Environment

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.12+](https://img.shields.io/badge/Python-3.12%2B-brightgreen.svg)](https://www.python.org/)
[![FastAPI: 0.115+](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React: 18.3](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript: 5.6](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind: 3.4](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code_Core-007ACC.svg)](https://microsoft.github.io/monaco-editor/)
[![Yjs CRDT](https://img.shields.io/badge/Yjs-CRDT_Realtime-orange.svg)](https://yjs.dev/)

---

## 🌟 Executive Summary

**CodeSync AI** is a browser-based collaborative software development environment engineered for developers, technical interviewers, engineering teams, and students.

It harmonizes four core pillars into a unified developer experience:
1. **Google Docs-grade Concurrency**: Sub-millisecond real-time collaborative editing using **Yjs CRDTs** and **Hocuspocus WebSockets**, complete with live cursor presence and non-blocking state synchronization.
2. **VS Code-grade IDE Interface**: Powered by Microsoft's **Monaco Editor**, offering multi-tab management, syntax highlighting, formatting, and file exploration.
3. **Replit-grade Isolated Execution**: Secure multi-language compilation and execution (Python, Java, C++, JavaScript) executed in ephemeral, resource-constrained **Docker sandboxes**.
4. **Context-Aware AI Pair Programmer**: Provider-independent AI service layer providing conversational debugging, code generation, Big-O complexity analysis, and non-destructive reviewable diffs with explicit Accept/Reject controls.

---

## 🏗️ Monorepo Architecture

```
codesync-ai/
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS + Monaco
│   ├── src/
│   │   ├── components/       # Reusable UI primitives (Button, Badge, Card) & Layout (Navbar, Footer)
│   │   ├── pages/            # LandingPage, Auth, Dashboard, Editor, Interview
│   │   ├── services/         # Axios API client & WebSocket connections
│   │   ├── types/            # TypeScript data contracts & schemas
│   │   ├── App.tsx           # Route orchestration
│   │   └── main.tsx          # Application entrypoint
│   ├── package.json
│   ├── tailwind.config.js    # Strict dark-first color tokens (#0B0F19, #111827, #6366F1)
│   └── vite.config.ts        # Vite config with API proxy
├── backend/                  # FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Uvicorn
│   ├── app/
│   │   ├── api/v1/           # Modular route controllers (Health, Auth, Workspaces, AI)
│   │   ├── core/             # Settings (BaseSettings), DB engine, Security (JWT + bcrypt)
│   │   ├── models/           # Declarative database entities
│   │   ├── schemas/          # Pydantic request / response contracts
│   │   └── main.py           # Application lifecycle, CORS, OpenAPI specification
│   ├── tests/                # Pytest async test suite
│   ├── requirements.txt      # Production & development dependencies
│   └── Dockerfile
├── collaboration-server/     # Hocuspocus + Yjs WebSocket Mesh
├── execution-engine/         # Ephemeral Docker sandbox runners
├── infrastructure/           # Docker Compose (PostgreSQL 16, Redis 7, Backend, Frontend)
├── docs/                     # Architecture, REST API specifications & setup guides
│   ├── ARCHITECTURE.md
│   ├── API_SPECIFICATION.md
│   └── SETUP.md
├── .env.example              # Universal environment template
├── .gitignore
└── README.md
```

---

## 🎨 Design Philosophy & Color System

Designed with a **dark-first**, minimalist aesthetic inspired by VS Code, Linear, and Codespaces:

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Main Background** | `#0B0F19` | Application backdrop & shell |
| **Secondary Background** | `#111827` | Header, footer, active card containers |
| **Panel Background** | `#161D2B` | Editor panes, sidebar, floating modals |
| **Primary Accent** | `#6366F1` | Primary actions, focused tabs, active cursors |
| **Secondary Accent** | `#8B5CF6` | AI indicators, badges, highlights |
| **Main Text** | `#F8FAFC` | Headings, active code, primary labels |
| **Secondary Text** | `#94A3B8` | Subtitles, comments, metadata |
| **Success** | `#22C55E` | Online indicators, passing tests, execution exit 0 |
| **Error** | `#EF4444` | Compilation errors, syntax faults, failed runs |

---

## 🚀 Quick Start

### Option 1: Standalone Local Mode (Zero-Config)
```bash
# 1. Clone repository and set environment
copy .env.example .env

# 2. Run backend (FastAPI)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload

# 3. In another terminal, run frontend (Vite)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` for the web app, and `http://localhost:8000/docs` for the interactive Swagger API documentation.

### Option 2: Docker Compose
```bash
cd infrastructure
docker compose up -d
```

---

## 📋 Phased Roadmap Status

- [x] **PHASE 1: Foundation & Architecture** *(Current Phase)*
  - Monorepo folder hierarchy & environment scaffolding.
  - FastAPI backend configured with CORS, Pydantic settings, health endpoint, and async database engine.
  - React + TypeScript + Vite frontend configured with Tailwind CSS design tokens and reusable components.
  - Interactive Landing Page featuring live API probe, IDE teaser, and capability highlights.
  - Docker Compose configuration for PostgreSQL 16, Redis 7, and all microservices.
  - Automated Pytest suite and Vite production build verification.
- [ ] **PHASE 2: Authentication & Workspace Management** *(Next Phase)*
  - JWT user registration & authentication.
  - Workspace CRUD, invitations, and role-based permissions.
  - Recursive file explorer and tree operations.
- [ ] **PHASE 3: Monaco Editor Integration**
  - Monaco editor tabs, syntax themes, auto-save, search.
- [ ] **PHASE 4: Real-Time CRDT Collaboration**
  - Yjs + y-monaco + Hocuspocus WebSocket synchronization, live cursors & presence.
- [ ] **PHASE 5: Isolated Code Execution Engine**
  - Docker multi-language sandboxes (Python, Java, C++, JS) with CPU/RAM limits & terminal output.
- [ ] **PHASE 6: AI Development Assistant**
  - Contextual explain, debug, optimize, test generation, and reviewable diffs.
- [ ] **PHASE 7: Version History & Interview Mode**
  - Snapshots, timeline rollback, live coding challenges, candidate scoring.
- [ ] **PHASE 8: End-to-End Testing & Hardening**
  - Playwright E2E tests, security audits, and production container optimization.

---

## 📜 Documentation

- [System Architecture Blueprint](file:///d:/PROJECT/CodeSync/docs/ARCHITECTURE.md)
- [REST API Specification](file:///d:/PROJECT/CodeSync/docs/API_SPECIFICATION.md)
- [Local Setup Guide](file:///d:/PROJECT/CodeSync/docs/SETUP.md)
