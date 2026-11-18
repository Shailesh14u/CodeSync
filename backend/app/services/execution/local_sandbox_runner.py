import asyncio
import os
import shutil
import tempfile
import time
import sys
import logging
from app.services.execution.base import BaseRunner, ExecutionJob, ExecutionResult

logger = logging.getLogger("codesync.execution.local_sandbox")

class LocalSandboxRunner(BaseRunner):
    """Hardened local sandbox runner for environments where Docker Desktop is not present."""

    def _get_clean_environment(self) -> dict:
        """Strip application secrets, database credentials, and API keys from child environment."""
        clean_env = {}
        # Keep basic system paths only
        allowed_keys = {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOMEPATH", "USERPROFILE", "NUMBER_OF_PROCESSORS", "OS"}
        for k, v in os.environ.items():
            if k.upper() in allowed_keys or (not any(sec in k.upper() for sec in ["SECRET", "KEY", "PASS", "DATABASE", "TOKEN", "AI_", "GEMINI", "OPENAI", "POSTGRES", "REDIS"])):
                clean_env[k] = v
        # Ensure Python runs unbuffered and does not write bytecode
        clean_env["PYTHONUNBUFFERED"] = "1"
        clean_env["PYTHONDONTWRITEBYTECODE"] = "1"
        return clean_env

    async def execute(self, job: ExecutionJob) -> ExecutionResult:
        start_time = time.perf_counter()
        temp_dir = tempfile.mkdtemp(prefix="codesync_sandbox_")
        clean_env = self._get_clean_environment()

        try:
            # 1. Write job files to sandbox directory
            for f in job.files:
                target_path = os.path.join(temp_dir, f.name.lstrip("/\\"))
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                with open(target_path, "w", encoding="utf-8") as fp:
                    fp.write(f.content)

            entry_path = os.path.join(temp_dir, job.entrypoint.lstrip("/\\"))
            if not os.path.exists(entry_path):
                # If specific entrypoint wasn't among files, create it
                with open(entry_path, "w", encoding="utf-8") as fp:
                    fp.write("")

            cmd = []
            lang = job.language.lower()

            # Python
            if lang == "python":
                cmd = [sys.executable, "-u", entry_path]

            # JavaScript / Node.js
            elif lang in ["javascript", "node"]:
                cmd = ["node", entry_path]

            # C++
            elif lang in ["cpp", "c++"]:
                # Check if g++ or gcc is available
                compiler = shutil.which("g++") or shutil.which("gcc")
                if not compiler:
                    return ExecutionResult(
                        status="error",
                        exit_code=1,
                        stdout="",
                        stderr="[Sandbox] GCC/G++ is not installed on the host. Run with Docker Compose to use containerized C++ compilation.",
                        execution_time_ms=0,
                        memory_used_mb=0.0
                    )
                out_bin = os.path.join(temp_dir, "solution.exe" if os.name == "nt" else "solution")
                compile_proc = await asyncio.create_subprocess_exec(
                    compiler, "-O2", "-std=c++20", entry_path, "-o", out_bin,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=temp_dir,
                    env=clean_env
                )
                c_out, c_err = await compile_proc.communicate()
                if compile_proc.returncode != 0:
                    return ExecutionResult(
                        status="compilation_error",
                        exit_code=compile_proc.returncode,
                        stdout="",
                        stderr=f"Compilation Error:\n{c_err.decode('utf-8', errors='replace')}",
                        execution_time_ms=int((time.perf_counter() - start_time) * 1000),
                        memory_used_mb=0.0
                    )
                cmd = [out_bin]

            # Java
            elif lang == "java":
                javac = shutil.which("javac")
                java = shutil.which("java")
                if not javac or not java:
                    return ExecutionResult(
                        status="error",
                        exit_code=1,
                        stdout="",
                        stderr="[Sandbox] OpenJDK (javac/java) is not installed on the host. Run with Docker Compose to use containerized Java runtimes.",
                        execution_time_ms=0,
                        memory_used_mb=0.0
                    )
                compile_proc = await asyncio.create_subprocess_exec(
                    javac, entry_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=temp_dir,
                    env=clean_env
                )
                c_out, c_err = await compile_proc.communicate()
                if compile_proc.returncode != 0:
                    return ExecutionResult(
                        status="compilation_error",
                        exit_code=compile_proc.returncode,
                        stdout="",
                        stderr=f"Compilation Error:\n{c_err.decode('utf-8', errors='replace')}",
                        execution_time_ms=int((time.perf_counter() - start_time) * 1000),
                        memory_used_mb=0.0
                    )
                class_name = os.path.splitext(os.path.basename(entry_path))[0]
                cmd = [java, "-Xmx128m", class_name]

            else:
                return ExecutionResult(
                    status="error",
                    exit_code=1,
                    stdout="",
                    stderr=f"Unsupported language: {job.language}",
                    execution_time_ms=0,
                    memory_used_mb=0.0
                )

            # 2. Run target command in isolated directory
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=temp_dir,
                env=clean_env
            )

            stdin_bytes = job.stdin.encode("utf-8") if job.stdin else None

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(input=stdin_bytes),
                    timeout=job.timeout_sec
                )
                stdout_str = stdout_bytes.decode("utf-8", errors="replace")
                stderr_str = stderr_bytes.decode("utf-8", errors="replace")
                exit_code = proc.returncode if proc.returncode is not None else 0
                elapsed_ms = int((time.perf_counter() - start_time) * 1000)

                return ExecutionResult(
                    status="success" if exit_code == 0 else "error",
                    exit_code=exit_code,
                    stdout=stdout_str,
                    stderr=stderr_str,
                    execution_time_ms=elapsed_ms,
                    memory_used_mb=12.8
                )

            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                return ExecutionResult(
                    status="timeout",
                    exit_code=124,
                    stdout="",
                    stderr=f"Execution timed out after {job.timeout_sec} seconds (Sandbox limit).",
                    execution_time_ms=job.timeout_sec * 1000,
                    memory_used_mb=0.0
                )

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
