# CodeSync AI - Code Execution Engine & Sandbox Security Model

Executing untrusted arbitrary code submitted by third-party web clients presents significant operational and infrastructure risks. CodeSync AI implements a layered defense-in-depth model combining containerization, cgroups resource quotas, network quarantine, and environment sanitation.

---

## 1. Security Architecture & Isolation Controls

```
               [ Untrusted Client Code Submission ]
                               │
                               ▼
            [ FastAPI Security Validation Layer ]
         (Verifies JWT & Workspace Role Permissions)
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │        Isolated Execution Sandbox            │
        │                                              │
        │  • Resource Ceilings (cgroups):              │
        │    - Memory ceiling: 256MB                   │
        │    - CPU allocation: 1.0 core                │
        │    - Process limit: 64 PIDs                  │
        │                                              │
        │  • Network Lockdown:                         │
        │    - `--network none` (Zero socket egress)   │
        │                                              │
        │  • Filesystem Hardening:                     │
        │    - Root filesystem: Read-Only              │
        │    - Memory tmpfs: /tmp (noexec, nosuid)     │
        │    - Ephemeral workspace mount               │
        │                                              │
        │  • Principle of Least Privilege:             │
        │    - Non-root user: `runner` (UID 1000)      │
        │    - Kernel capabilities dropped (CAP_DROP)  │
        │                                              │
        │  • Execution Timeout:                        │
        │    - Hard wall-clock timeout (10s)           │
        │    - Automated SIGKILL process cleanup       │
        └──────────────────────────────────────────────┘
```

### Specific Defenses:

1. **Process & Process Memory Isolation**:
   - Untrusted code is **never** executed in the main backend process.
   - Resource quotas enforce limits on memory (256MB) to defeat memory bombs and CPU (1.0 core) to defeat infinite loops.
   - Process limit (`--pids-limit 64`) prevents fork bombs from exhausting host process tables.

2. **Network Quarantine**:
   - Containers run with `--network none`.
   - Prevents SSRF attacks against internal network infrastructure, cloud metadata endpoints (`169.254.169.254`), and external port scanning.

3. **Filesystem Hardening**:
   - Root filesystem is mounted read-only.
   - Temporary write space is allocated via an in-memory `tmpfs` with `noexec` and `nosuid` flags.
   - Temporary directories on host are ephemeral and purged immediately after execution.

4. **Environment Sanitization**:
   - In both Docker and local sandbox environments, all system environment variables containing `SECRET`, `KEY`, `DATABASE`, `TOKEN`, `PASSWORD`, or `AI_` credentials are explicitly scrubbed from child process environments.

---

## 2. Documented Remaining Sandbox Risks

Docker containerization alone does **not** provide complete virtualization boundary isolation. For true multi-tenant production hardening, the following remaining risks must be acknowledged and mitigated:

1. **Shared Linux Kernel Vulnerabilities**:
   - All Docker containers share the host Linux kernel. A zero-day privilege escalation or container escape vulnerability in kernel syscalls (e.g., `dirty COW`, `fsnotify`, `io_uring`) could allow a malicious binary to break container isolation.
   - *Mitigation for Enterprise Production*: Integrate hypervisor-isolated microVMs such as **Firecracker** or **gVisor** (Google's application kernel) as the container runtime (`runsc`).

2. **Host Side-Channel Attacks (Spectre/Meltdown)**:
   - When executing on multi-tenant hardware, malicious code could attempt microarchitectural cache timing side-channel attacks against collocated processes.
   - *Mitigation*: Dedicated worker nodes isolated from core database and API gateway infrastructure.

3. **Disk I/O Flooding**:
   - While tmpfs limits file storage, rapid in-memory writes can consume CPU cycles.
   - *Mitigation*: Disk write throttling via cgroups `blkio` limits.
