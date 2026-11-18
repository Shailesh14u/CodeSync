#!/usr/bin/env python3
import sys
import os
import subprocess
import time
import json
import argparse

def run_execution(language: str, entrypoint: str, stdin_data: str = "", timeout_sec: int = 10):
    start_time = time.perf_counter()
    stdout = ""
    stderr = ""
    exit_code = 0
    status = "success"

    try:
        if language == "python":
            cmd = ["python3", "-u", entrypoint]
            proc = subprocess.run(
                cmd,
                input=stdin_data.encode("utf-8") if stdin_data else None,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_sec,
                cwd="/sandbox"
            )
            stdout = proc.stdout.decode("utf-8", errors="replace")
            stderr = proc.stderr.decode("utf-8", errors="replace")
            exit_code = proc.returncode

        elif language in ["javascript", "node"]:
            cmd = ["node", entrypoint]
            proc = subprocess.run(
                cmd,
                input=stdin_data.encode("utf-8") if stdin_data else None,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_sec,
                cwd="/sandbox"
            )
            stdout = proc.stdout.decode("utf-8", errors="replace")
            stderr = proc.stderr.decode("utf-8", errors="replace")
            exit_code = proc.returncode

        elif language in ["cpp", "c++"]:
            # 1. Compilation
            bin_name = "/sandbox/a.out"
            compile_cmd = ["g++", "-O2", "-std=c++20", entrypoint, "-o", bin_name]
            compile_proc = subprocess.run(
                compile_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_sec,
                cwd="/sandbox"
            )
            if compile_proc.returncode != 0:
                stderr = f"Compilation Error:\n{compile_proc.stderr.decode('utf-8', errors='replace')}"
                exit_code = compile_proc.returncode
                status = "compilation_error"
            else:
                # 2. Execution
                proc = subprocess.run(
                    [bin_name],
                    input=stdin_data.encode("utf-8") if stdin_data else None,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=timeout_sec,
                    cwd="/sandbox"
                )
                stdout = proc.stdout.decode("utf-8", errors="replace")
                stderr = proc.stderr.decode("utf-8", errors="replace")
                exit_code = proc.returncode

        elif language == "java":
            # 1. Compilation
            compile_cmd = ["javac", entrypoint]
            compile_proc = subprocess.run(
                compile_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_sec,
                cwd="/sandbox"
            )
            if compile_proc.returncode != 0:
                stderr = f"Compilation Error:\n{compile_proc.stderr.decode('utf-8', errors='replace')}"
                exit_code = compile_proc.returncode
                status = "compilation_error"
            else:
                # 2. Execution
                class_name = os.path.splitext(os.path.basename(entrypoint))[0]
                proc = subprocess.run(
                    ["java", "-Xmx128m", class_name],
                    input=stdin_data.encode("utf-8") if stdin_data else None,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=timeout_sec,
                    cwd="/sandbox"
                )
                stdout = proc.stdout.decode("utf-8", errors="replace")
                stderr = proc.stderr.decode("utf-8", errors="replace")
                exit_code = proc.returncode

        else:
            stderr = f"Unsupported language: {language}"
            exit_code = 1
            status = "error"

    except subprocess.TimeoutExpired:
        status = "timeout"
        exit_code = 124
        stderr = f"Execution timed out after {timeout_sec} seconds."
    except Exception as e:
        status = "error"
        exit_code = 1
        stderr = str(e)

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    result = {
        "status": status if exit_code == 0 else ("error" if status == "success" else status),
        "exit_code": exit_code,
        "stdout": stdout,
        "stderr": stderr,
        "execution_time_ms": elapsed_ms,
        "memory_used_mb": 12.5
    }

    print(json.dumps(result))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", required=True)
    parser.add_argument("--entry", required=True)
    parser.add_argument("--timeout", type=int, default=10)
    args = parser.parse_args()

    stdin_input = sys.stdin.read() if not sys.stdin.isatty() else ""
    run_execution(args.lang, args.entry, stdin_input, args.timeout)
