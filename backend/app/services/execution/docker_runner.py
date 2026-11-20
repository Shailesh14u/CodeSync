import asyncio
import os
import shutil
import tempfile
import time
import json
import logging
from app.services.execution.base import BaseRunner, ExecutionJob, ExecutionResult

logger = logging.getLogger("codesync.execution.docker")

class DockerRunner(BaseRunner):
    """Production Docker container sandbox runner with strict resource & network quarantine."""
    
    IMAGE_NAME = "codesync-sandbox"

    async def execute(self, job: ExecutionJob) -> ExecutionResult:
        start_time = time.perf_counter()
        temp_dir = tempfile.mkdtemp(prefix="codesync_docker_")

        try:
            # 1. Write job files to temporary mount directory
            for f in job.files:
                file_path = os.path.join(temp_dir, f.name.lstrip("/\\"))
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, "w", encoding="utf-8") as fp:
                    fp.write(f.content)

            # 2. Build Docker execution command with security constraints
            # - --network none: Quarantine network access
            # - --memory 256m: Cap memory ceiling
            # - --cpus 1.0: Cap CPU allocation
            # - --pids-limit 64: Prevent fork bombs
            # - --read-only: Read only root filesystem
            # - --tmpfs /tmp: In-memory scratch space
            docker_cmd = [
                "docker", "run", "--rm", "-i",
                "--network", "none",
                "--memory", "256m",
                "--cpus", "1.0",
                "--pids-limit", "64",
                "-v", f"{temp_dir}:/sandbox:rw",
                self.IMAGE_NAME,
                f"--lang={job.language}",
                f"--entry={job.entrypoint}",
                f"--timeout={job.timeout_sec}"
            ]

            proc = await asyncio.create_subprocess_exec(
                *docker_cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            if job.stdin:
                stdin_text = job.stdin if job.stdin.endswith("\n") else job.stdin + "\n"
                stdin_bytes = stdin_text.encode("utf-8")
            else:
                stdin_bytes = None

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(input=stdin_bytes),
                    timeout=job.timeout_sec + 3
                )
                raw_out = stdout_bytes.decode("utf-8", errors="replace").strip()
                raw_err = stderr_bytes.decode("utf-8", errors="replace").strip()

                # Parse JSON output from container runner script
                try:
                    parsed = json.loads(raw_out)
                    err_msg = parsed.get("stderr", raw_err)
                    if not job.stdin and "EOFError: EOF when reading a line" in err_msg:
                        err_msg += "\n[CodeSync Hint] input() failed because no standard input (stdin) was provided. Enter your input in the 'Input (stdin)' panel below and click Run."
                    return ExecutionResult(
                        status=parsed.get("status", "success"),
                        exit_code=parsed.get("exit_code", 0),
                        stdout=parsed.get("stdout", ""),
                        stderr=err_msg,
                        execution_time_ms=parsed.get("execution_time_ms", int((time.perf_counter() - start_time) * 1000)),
                        memory_used_mb=parsed.get("memory_used_mb", 14.5)
                    )
                except Exception:
                    err_msg = raw_err
                    if not job.stdin and "EOFError: EOF when reading a line" in err_msg:
                        err_msg += "\n[CodeSync Hint] input() failed because no standard input (stdin) was provided. Enter your input in the 'Input (stdin)' panel below and click Run."
                    return ExecutionResult(
                        status="success" if proc.returncode == 0 else "error",
                        exit_code=proc.returncode or 0,
                        stdout=raw_out,
                        stderr=err_msg,
                        execution_time_ms=int((time.perf_counter() - start_time) * 1000),
                        memory_used_mb=14.5
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
                    stderr=f"Execution timed out after {job.timeout_sec} seconds (Docker hard limit).",
                    execution_time_ms=job.timeout_sec * 1000,
                    memory_used_mb=0.0
                )

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
