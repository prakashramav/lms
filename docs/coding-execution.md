# Coding Execution & Sandbox Architecture

## Overview
The platform provides a secured code execution sandbox supporting JavaScript, Node.js, Python, HTML/CSS, and React. Student code is executed within isolated execution boundaries with strict resource limits and network restrictions.

---

## 1. Execution Security Boundaries
- **Process Isolation**: User code never runs inside the main API process. Execution is delegated to a child worker sandbox process or remote Judge0 sandbox.
- **Resource Limits**:
  - Maximum Execution Time: 5000ms (5 seconds)
  - Maximum Memory: 128 MB
  - Output Truncation: 10,000 characters
  - Process Limit: 1 sub-process (preventing fork bombs)
- **Network Access**: Completely disabled (`ALLOW_NETWORK: false`) by default.
- **Filesystem Isolation**: Ephemeral temporary directory created per execution and wiped upon completion. Access to host files (`.env`, source code, credentials) is strictly blocked.

---

## 2. Supported Languages & Evaluation Modes
1. **Algorithmic Coding Problems**: Automated test cases comparing stdout / returned values against expected output.
2. **Web / Frontend Playgrounds**: Sandboxed iframe preview rendering with CSP restrictions.
