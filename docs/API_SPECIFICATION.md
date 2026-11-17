# CodeSync AI - REST API Specification

Base URL: `/api/v1`  
Authentication: Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. System & Health

### `GET /api/v1/health`
Returns system status, active database dialect, and connected external services.
- **Access**: Public
- **Response**:
```json
{
  "status": "healthy",
  "app": "CodeSync AI",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-11-17T11:55:58.308902Z",
  "database": {
    "connected": true,
    "dialect": "sqlite",
    "error": null
  },
  "services": {
    "api": "operational",
    "collaboration_ws": "ws://localhost:1234",
    "ai_provider": "gemini"
  }
}
```

---

## 2. Authentication (Phase 2)

### `POST /api/v1/auth/register`
Create a new user account.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "username": "developer",
  "password": "SecurePassword123!",
  "full_name": "Senior Engineer"
}
```
- **Response (201)**: User profile object + initial JWT token.

### `POST /api/v1/auth/login`
Authenticate credentials and issue a signed JWT.
- **Request Body**: `application/x-www-form-urlencoded` or JSON credentials.
- **Response (200)**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": { "id": "...", "username": "..." }
}
```

### `GET /api/v1/users/me`
Retrieve currently authenticated user identity.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200)**: User details.

---

## 3. Workspaces & Projects (Phase 2)

### `GET /api/v1/workspaces`
List workspaces accessible to the user (owned + collaborated).

### `POST /api/v1/workspaces`
Create a new collaborative workspace.
- **Request Body**:
```json
{
  "name": "Algorithm Study Group",
  "description": "Collaborative dynamic programming practice",
  "default_language": "python"
}
```

### `GET /api/v1/workspaces/{id}`
Fetch workspace metadata, member list, and permissions.

### `DELETE /api/v1/workspaces/{id}`
Archive or delete a workspace (owner only).

---

## 4. File Management (Phase 2 & 3)

### `GET /api/v1/workspaces/{id}/files`
Get recursive file and folder tree.

### `POST /api/v1/workspaces/{id}/files`
Create a file or directory.
- **Request Body**:
```json
{
  "name": "main.py",
  "path": "/src/main.py",
  "is_directory": false,
  "language": "python",
  "content": "print('hello world')"
}
```

### `PATCH /api/v1/files/{id}`
Rename or move a file.

### `DELETE /api/v1/files/{id}`
Delete a file or folder.

---

## 5. Code Execution (Phase 5)

### `POST /api/v1/executions`
Enqueue a code execution job inside an isolated Docker sandbox.
- **Request Body**:
```json
{
  "workspace_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "language": "python",
  "entrypoint": "main.py",
  "files": [
    { "name": "main.py", "content": "print(sum(range(10)))" }
  ],
  "stdin": ""
}
```
- **Response (200)**:
```json
{
  "execution_id": "3c847...",
  "exit_code": 0,
  "stdout": "45\n",
  "stderr": "",
  "execution_time_ms": 112,
  "memory_used_mb": 14.5,
  "status": "success"
}
```

---

## 6. AI Development Assistant (Phase 6)

### `POST /api/v1/ai/explain`
### `POST /api/v1/ai/debug`
### `POST /api/v1/ai/generate`
### `POST /api/v1/ai/optimize`
### `POST /api/v1/ai/review`
- **Request Body**:
```json
{
  "code": "def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)",
  "language": "python",
  "instruction": "Optimize for O(N) time and O(1) space"
}
```
- **Response (200)**:
```json
{
  "explanation": "Current solution has O(2^N) exponential time complexity due to redundant recursion branches.",
  "suggested_code": "def fib(n):\n    if n < 2: return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b",
  "reasoning": "Iterative bottom-up accumulation reduces time complexity to O(N) and uses constant O(1) auxiliary space.",
  "risks": "None for standard integer inputs; large n will return arbitrary precision integers."
}
```

---

## 7. Version History & Snapshots (Phase 7)

### `GET /api/v1/workspaces/{id}/snapshots`
List all recorded snapshots.

### `POST /api/v1/workspaces/{id}/snapshots`
Create a manual or milestone snapshot of the current workspace file tree.

### `POST /api/v1/snapshots/{id}/restore`
Restore workspace to the designated snapshot version.
