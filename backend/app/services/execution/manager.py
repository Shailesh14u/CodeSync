import shutil
import asyncio
import logging
from app.services.execution.base import BaseRunner, ExecutionJob, ExecutionResult
from app.services.execution.docker_runner import DockerRunner
from app.services.execution.local_sandbox_runner import LocalSandboxRunner

logger = logging.getLogger("codesync.execution.manager")

class ExecutionManager:
    """Orchestrates code execution by selecting Docker or Local Sandbox based on environment capability."""

    def __init__(self):
        self._docker_runner = DockerRunner()
        self._local_runner = LocalSandboxRunner()
        self._has_docker = None

    async def _check_docker_available(self) -> bool:
        if self._has_docker is not None:
            return self._has_docker

        docker_path = shutil.which("docker")
        if not docker_path:
            self._has_docker = False
            return False

        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=3)
            self._has_docker = (proc.returncode == 0)
        except Exception:
            self._has_docker = False

        return self._has_docker

    async def run(self, job: ExecutionJob) -> ExecutionResult:
        use_docker = await self._check_docker_available()
        runner: BaseRunner = self._docker_runner if use_docker else self._local_runner

        mode_name = "Docker Container Isolation" if use_docker else "Hardened Process Sandbox"
        logger.info(f"Dispatching execution job ({job.language}, {job.entrypoint}) via {mode_name}")

        result = await runner.execute(job)
        return result

execution_manager = ExecutionManager()
