# CodeSync AI - System Architecture Blueprint

CodeSync AI is a browser-based, real-time collaborative development environment that integrates conflict-free document replication, isolated multi-language code compilation, and an intelligent AI pair programmer.

---

## 1. High-Level Architecture Overview

```mermaid
graph TD
    subgraph Client ["Client Browser (React 18 + Monaco)"]
        UI["UI Layer (Tailwind CSS, Zustand)"]
        Monaco["Monaco Code Editor"]
        YMonaco["y-monaco Binding"]
        YDoc["Yjs CRDT Document"]
        HPProvider["Hocuspocus Provider (WebSocket)"]
        AxiosClient["REST API Client (Axios)"]
    end

    subgraph Gateway ["Networking & Gateway"]
        Nginx["Reverse Proxy / Port Mappings"]
    end

    subgraph CollabServer ["Real-Time Collaboration Service"]
        Hocuspocus["Hocuspocus Server (Node.js)"]
        YjsMesh["Yjs Memory Document Mesh"]
        CollabAuth["JWT Token Validator"]
    end

    subgraph BackendAPI ["Application Backend (FastAPI)"]
        FastAPIApp["FastAPI Service (Python 3.12+)"]
        AuthService["Auth & Membership Engine"]
        WorkspaceService["Workspace & File Manager"]
        JobScheduler["Execution Job Coordinator"]
        AIService["AI Provider Layer (Gemini/OpenAI)"]
    end

    subgraph ExecutionPlane ["Execution Sandboxes"]
        DockerDaemon["Docker Execution Worker"]
        PyBox["Python 3.12 Sandbox Container"]
        CppBox["GCC 13 C++20 Sandbox Container"]
        JavaBox["OpenJDK 21 Sandbox Container"]
        NodeBox["Node.js 20 Sandbox Container"]
    end

    subgraph DataPlane ["Persistence Layer"]
        Postgres[(PostgreSQL 16 Database)]
        RedisCache[(Redis 7 Cache / Queues)]
    end

    %% Connections
    Monaco --> YMonaco
    YMonaco --> YDoc
    YDoc --> HPProvider
    HPProvider -->|WebSocket (CRDT Updates)| Hocuspocus
    Hocuspocus --> CollabAuth
    CollabAuth -.->|Validate JWT & Access| FastAPIApp
    Hocuspocus -->|Doc Persistence Hook| Postgres

    UI --> AxiosClient
    AxiosClient -->|HTTP REST APIs| FastAPIApp

    FastAPIApp --> Postgres
    FastAPIApp --> RedisCache
    JobScheduler --> DockerDaemon
    DockerDaemon --> PyBox
    DockerDaemon --> CppBox
    DockerDaemon --> JavaBox
    DockerDaemon --> NodeBox

    AIService -->|LLM API Prompts| ExternalAI["Configurable LLM (Gemini 1.5 Pro)"]
```

---

## 2. Real-Time Collaboration Mechanics (Yjs + Hocuspocus)

- **CRDT (Conflict-Free Replicated Data Type)**: CodeSync AI does not use naive text locks or full-document broadcasting. Instead, it uses **Yjs** text structures (`Y.Text`).
- **y-monaco**: Binds the Monaco Editor model to the local `Y.Text` instance. Keystrokes are converted to atomic delta operations (insert, delete, format) with Lamport vector clocks.
- **Hocuspocus Server**: Serves as the authoritative WebSocket coordinator. It validates the user's JWT token, verifies workspace editing permissions, and broadcasts binary CRDT updates (`Uint8Array`) to active peers.
- **Awareness Protocol**: Propagates collaborator cursor positions, active file selections, and user profile colors with sub-15ms latency.
- **Persistence**: Document states are periodically debounced and persisted into the PostgreSQL `collaboration_documents` table as binary Yjs state vectors.

---

## 3. Sandboxed Execution Engine Security Model

Executing untrusted code submitted by web clients requires layered security defense:

1. **Process Isolation**: Untrusted code is **never** executed inside the FastAPI main process.
2. **Containerized Boundaries**: Every execution executes in a single-purpose, ephemeral Docker container.
3. **Resource Quotas**:
   - `--memory=256m` (cgroup memory ceiling to prevent OOM attacks)
   - `--cpus=1.0` (CPU quota to prevent thread starvation)
   - `--pids-limit=64` (Process limits to prevent fork bombs)
4. **Network Quarantine**: Containers run with `--network none`, eliminating external socket access, port scanning, and SSRF attacks.
5. **Filesystem Hardening**:
   - Container root filesystem is mounted read-only (`--read-only`).
   - Temporary code files are mounted into a memory-backed tmpfs (`--tmpfs /tmp:rw,noexec,nosuid,size=32m`).
6. **Execution Limits**: Strict wall-clock timeouts (default 10s). If execution exceeds the limit, the runner process issues `SIGKILL` and destroys the container.

---

## 4. AI Development Assistant Architecture

- **Provider-Agnostic Interface**: The backend exposes an abstract `AIService` interface with swappable adapters (`GeminiService`, `OpenAIService`, `AnthropicService`, `MockService`).
- **Context Construction**: Sends only user-permitted workspace context, selected code slices, active language runtime, and error stack traces.
- **Structured Output**: AI responses are returned as structured Pydantic schemas:
  - `explanation`: Detailed explanation of the logic or issue.
  - `suggested_code`: Recommended replacement code.
  - `reasoning`: Technical justification.
  - `risks`: Edge cases, breaking changes, or complexity trade-offs.
- **Non-Destructive Diff**: Frontend displays modifications as side-by-side or inline unified diffs with explicit **Accept** and **Reject** buttons. Code is never automatically overwritten without human confirmation.

---

## 5. Database Schema & Persistence Strategy

The persistence layer uses normalized PostgreSQL tables with UUID primary keys:

- `users`: User identity, hashed credentials, profile data.
- `workspaces`: Project container metadata, owner ID, visibility settings.
- `workspace_members`: Role-based access control (`owner`, `editor`, `viewer`, `candidate`).
- `files`: File tree hierarchy, language mode, workspace references.
- `collaboration_documents`: Yjs binary state vector blobs for real-time document persistence.
- `invitations`: Workspace invite tokens, expiration timestamps, email constraints.
- `messages`: Integrated workspace chat history.
- `executions` & `execution_results`: Audit logs of runs, exit codes, resource metrics, stdout/stderr.
- `snapshots`: Version control milestones with point-in-time file trees.
- `ai_requests`: Log of AI queries, tokens consumed, and diff acceptance status.
- `activity_logs`: Audit trail for workspace actions.
