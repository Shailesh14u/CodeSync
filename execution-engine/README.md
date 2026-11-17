# CodeSync AI - Isolated Execution Engine

The execution engine provides secure, resource-constrained isolated execution sandboxes for running multi-language code snippets (Python, Java, C++, JavaScript/Node.js).

## Architecture & Security Model

- **Process Isolation**: Untrusted code is never executed inside the main FastAPI application.
- **Resource Constraints**:
  - Memory limit (e.g., 256MB)
  - CPU limit (e.g., 1.0 vCPU)
  - Execution timeout (default 10s wall-clock)
- **Network Isolation**: Execution containers run with network disabled (`--network none`).
- **Filesystem Security**: Non-root execution with read-only root mount and temporary in-memory scratch space (`/tmp`).
- **Lifecycle**: Containers are ephemeral and cleaned up immediately after output and exit code capture.

## Phase Roadmap

- **Phase 1**: Architecture design and runner specification.
- **Phase 5**: Docker execution workers, multi-language compilers, streaming terminal output.
