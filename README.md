# CodeSync AI ⚡
### AI-Powered Real-Time Collaborative Cloud Development Environment

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.13+](https://img.shields.io/badge/Python-3.13%2B-brightgreen.svg)](https://www.python.org/)
[![FastAPI: 0.115+](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React: 18.3](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript: 5.6](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind: 3.4](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code_Core-007ACC.svg)](https://microsoft.github.io/monaco-editor/)
[![Yjs CRDT](https://img.shields.io/badge/Yjs-CRDT_Realtime-orange.svg)](https://yjs.dev/)
[![Tests: 100% Passing](https://img.shields.io/badge/Tests-Pytest%20%2B%20Vitest%20Passed-brightgreen.svg)]()

---

## 🌟 Executive Summary

**CodeSync AI** is a browser-based collaborative software development environment engineered for developers, engineering teams, technical interviewers, and students.

It unifies four major software engineering workflows into a seamless cloud IDE:
1. **Google Docs-Grade Collaboration**: Conflict-free concurrent editing using **Yjs CRDTs**, `y-monaco`, and a dedicated **Hocuspocus WebSocket Server** with remote live cursor rendering, user presence awareness, and automatic reconnection.
2. **VS Code-Grade Web IDE**: Powered by Microsoft's **Monaco Editor**, offering multi-tab management, tree-structured file explorer, syntax highlighting across languages, search, and debounced auto-saving.
3. **Replit-Grade Isolated Execution**: Multi-language compilation and execution (**Python, Java, C++, JavaScript**) running inside ephemeral, resource-constrained **Docker sandboxes** with automated fallback to hardened local process isolation.
4. **Context-Aware AI Pair Programmer**: Provider-independent LLM architecture (**Google Gemini, OpenAI, and Heuristic Offline Engine**) providing code explanation, error trace debugging, algorithmic optimization, unit test generation, Big-O complexity analysis, and **non-destructive Monaco Diff reviews** with explicit Accept/Reject controls.
5. **Version History & Milestones**: Snapshot persistence engine with timeline browsing, code inspection, and atomic rollbacks.
6. **Technical Interview Mode**: Live coding challenges with automated test case evaluation, countdown timer, candidate scoring, and AI interview scorecard feedback.
7. **Workspace Team Chat**: Real-time team messaging directly embedded within the IDE.

---

## 🏗️ Architecture & Component Topology

```
+-------------------------------------------------------------------------+
|                           CLIENT (Browser)                              |
|   React 18 + TypeScript + Vite + Tailwind CSS + Monaco Editor + Zustand |
+--------------------+--------------------------------+-------------------+
                     | HTTP / REST (8000)             | WebSockets (1234)
                     v                                v
+------------------------------------+  +---------------------------------+
|       FASTAPI BACKEND SERVICE      |  |   HOCUSPOCUS COLLAB SERVER      |
|  - JWT Authentication & RBAC       |  |  - Yjs CRDT Synchronization     |
|  - Workspaces & File Management    |  |  - Awareness & Remote Cursors   |
|  - AI Assistant Service Manager    |  |  - Debounced DB Persistence     |
|  - Snapshots & Version History     |  +----------------+----------------+
|  - Technical Interview Evaluator   |                   |
|  - Integrated Team Chat            |                   |
+--------------------+---------------+                   |
                     |                                   |
         +-----------+-----------+                       |
         |                       |                       |
         v                       v                       v
+-----------------+     +-----------------+     +-------------------------+
| PostgreSQL /    |     |  Redis Cache    |     |  ISOLATED RUNNER        |
| Async SQLite    |     |  & State Mesh   |     |  - Docker Container     |
| (AsyncPG / DB)  |     |  (Optional)     |     |  - Hardened Local       |
+-----------------+     +-----------------+     |    Process Sandbox      |
                                                +-------------------------+
```

---

## 🎨 Design Philosophy & Color Palette

CodeSync AI features a custom dark-first theme built with precision contrast and typography:

| Color Token | Value | Interface Application |
| :--- | :--- | :--- |
| **Main Background** | `#0B0F19` | Editor background, terminal console canvas |
| **Secondary Background** | `#111827` | Toolbars, headers, cards, file tabs |
| **Panel Background** | `#161D2B` | Sidebars, modals, drawer panes |
| **Primary Accent** | `#6366F1` | Primary CTA buttons, focused file tabs |
| **Secondary Accent** | `#8B5CF6` | AI indicators, badges, highlights |
| **Main Text** | `#F8FAFC` | Editor code, primary headings |
| **Secondary Text** | `#94A3B8` | Subtitles, path names, metadata |
| **Success** | `#22C55E` | Online presence, passed tests, exit code 0 |
| **Error** | `#EF4444` | Exceptions, runtime errors, failed test cases |

---

## ⚡ Key Capabilities Across Phases

### 1. Real-Time Collaboration (Phase 4)
- Powered by `Y.Doc` CRDT data structures.
- Synchronized via Hocuspocus WebSocket server on port `1234`.
- Live remote cursors, selection highlights, and presence tags showing collaborator usernames and assigned color palettes.
- Document state updates persisted to the backend on change.

### 2. Multi-Language Isolated Execution Engine (Phase 5)
- Supports **Python 3**, **Java 21**, **C++ (g++)**, and **JavaScript (Node.js)**.
- Dual-Mode Runner:
  - **Docker Isolation**: Ephemeral containers with memory limits (`256MB`), CPU limits (`1.0`), execution timeouts (`10s`), non-root execution, and read-only root filesystems.
  - **Hardened Process Sandbox**: Automatic fallback when Docker is unavailable; scrubs all environment secrets, executes inside isolated temporary directories, and applies strict process timeouts.
- Live stdout, stderr streaming, execution timing in milliseconds, and run history tracking.

### 3. AI Pair Programmer & Non-Destructive Diff Review (Phase 6)
- Provider-independent service layer supporting:
  - **Google Gemini** (`gemini-1.5-pro` or configured)
  - **OpenAI** (`gpt-4o`, `gpt-4o-mini`)
  - **Contextual Offline Heuristic Engine**: Zero-external-dependency fallback that guarantees immediate offline debugging, optimization, and complexity analysis.
- One-click actions: **Explain Code**, **Debug Errors**, **Optimize Code**, **Code Review**, **Big-O Complexity Analysis**, and **Generate Unit Tests**.
- **Non-Destructive Diff Review**: AI modifications are previewed in a side-by-side Monaco Diff Viewer (`DiffViewerModal.tsx`). Shared code is never overwritten without clicking **Accept & Apply Diff**.

### 4. Version History & Snapshots (Phase 7)
- Instant immutable snapshots capturing all workspace files.
- Timeline milestones browser showing creation dates, author, and descriptions.
- Read-only file previewer and one-click atomic restore.

### 5. Technical Interview Mode (Phase 7)
- Built-in technical coding challenges with visible and hidden test cases.
- Automated evaluation runner computing test case score percentages (0–100%).
- Active countdown timer with pause/resume and reset.
- AI Interviewer Assessment generating candidate critique, complexity evaluation, and recommendations.

### 6. Workspace Team Chat (Phase 7)
- Integrated real-time team chat channel inside the IDE sidebar.
- Persisted message history with author usernames and timestamps.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **Python**: 3.11+ (tested on Python 3.13)
- **Docker & Docker Compose** (optional for production container deployment)

---

### Method A: Local Development (Zero-Config)

#### 1. Configure Environment
```bash
copy .env.example .env
```
*(By default, `.env` uses SQLite `codesync.db` and the offline heuristic AI engine, enabling instant setup without external credentials).*

#### 2. Start Backend API (FastAPI)
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
API Documentation will be live at `http://localhost:8000/docs`.

#### 3. Start Real-Time Collaboration Server
```bash
cd collaboration-server
npm install
node src/index.js
```
WebSocket Server will listen on `ws://localhost:1234`.

#### 4. Start Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Method B: Production Docker Compose

Run the entire multi-service stack (PostgreSQL 16, Redis 7, Backend, Collaboration Server, Frontend) with a single command:

```bash
cd infrastructure
docker compose up -d --build
```

Access points:
- **Web IDE**: `http://localhost:5173`
- **FastAPI Backend**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Collaboration WebSocket**: `ws://localhost:1234`
- **PostgreSQL**: `localhost:5432`

---

## 🧪 Test Suites

### Backend Unit & Integration Tests (Pytest)
```bash
cd backend
python -m pytest tests/ -v
```
**9/9 test suites passing**:
- `test_health.py`: Root and `/health` probes.
- `test_auth.py`: User registration, password hashing, and JWT tokens.
- `test_workspaces_and_files.py`: Workspace CRUD, file hierarchy, and invite tokens.
- `test_collaboration.py`: Yjs document sync and persistence.
- `test_execution.py`: Multi-language code execution and isolation.
- `test_ai.py`: Multi-action AI queries and review feedback logging.
- `test_snapshots_and_interviews.py`: Snapshots, rollback, chat, and interview test case evaluation.

### Frontend Unit Tests (Vitest)
```bash
cd frontend
npm run test
```
**14/14 tests passing**:
- `authStore.test.ts`: Authentication state, safe storage, and logout.
- `editorStore.test.ts`: Tab state, active file, dirty tracking, layout panels.
- `apiContracts.test.ts`: Schema contract verification.

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```
Type checks via `tsc -b` and bundles production assets via Vite with 0 errors.

---

## 🔒 Security & Sandbox Isolation Architecture

See [SANDBOX_SECURITY.md](file:///d:/PROJECT/CodeSync/docs/SANDBOX_SECURITY.md) for full security controls:
1. **Container Sandboxing**: CPU caps, memory constraints (`256MB`), execution timeouts (`10s`), and non-root execution.
2. **Environment Secret Scrubbing**: All host secrets (`SECRET_KEY`, `AI_API_KEY`, `DATABASE_URL`) are scrubbed before launching child execution processes.
3. **Multi-Tenant Access Enforcement**: Every API route validates that the authenticated JWT user is a member of the target workspace before granting file, execution, AI, or snapshot access.
4. **Non-Destructive AI Diffing**: Suggested code changes must be explicitly reviewed and accepted by the user before editor buffers are updated.

---

## 📄 License
This project is licensed under the MIT License.
