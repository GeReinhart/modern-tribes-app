import json
import os
import subprocess
import sys

payload = json.load(sys.stdin)
tool_input = payload.get("tool_input", {})
file_path = tool_input.get("file_path", "")

if file_path.endswith(".py") and "/backend/" in file_path:
    subprocess.run(["black", file_path])
    subprocess.run(["isort", file_path])

if file_path.endswith((".ts", ".tsx")) and "/frontend/" in file_path:
    frontend_dir = file_path[: file_path.index("/frontend/") + len("/frontend/")]
    subprocess.run(["npx", "prettier", "--write", file_path], cwd=frontend_dir)
