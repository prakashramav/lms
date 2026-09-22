const { spawn } = require('child_process');
const path = require('path');
const { storageManager } = require('./storageManager');

const MAX_BUFFER_SIZE = 64 * 1024; // 64 KB stdout/stderr buffer
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds

class ProcessManager {
  constructor() {
    this.activeProcesses = new Map(); // workspaceId -> childProcess
  }

  /**
   * Filter and sanitize environment variables to prevent secret leakage
   */
  getSanitizedEnv(customEnv = {}) {
    const baseSafeKeys = [
      'PATH',
      'NODE_ENV',
      'LANG',
      'HOME',
      'USER',
      'SHELL',
      'TMPDIR',
      'TEMP',
    ];

    const sanitized = {};
    for (const key of baseSafeKeys) {
      if (process.env[key]) {
        sanitized[key] = process.env[key];
      }
    }

    // Set isolated safe environment variables
    sanitized.NODE_ENV = 'development';
    sanitized.CI = 'true';

    // Merge explicitly provided safe custom environment variables
    for (const [k, v] of Object.entries(customEnv || {})) {
      if (!/secret|password|token|key|mongo|redis/i.test(k)) {
        sanitized[k] = String(v);
      }
    }

    return sanitized;
  }

  /**
   * Execute a command safely inside the workspace directory
   */
  async executeCommand({
    userId,
    workspaceId,
    command,
    args = [],
    timeoutMs = DEFAULT_TIMEOUT_MS,
    customEnv = {},
  }) {
    const wsDir = storageManager.getWorkspaceDir(userId, workspaceId);

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let killed = false;

      // Shell parsing if single command string passed
      let bin = command;
      let cmdArgs = args;

      if (!args || args.length === 0) {
        const parts = command.trim().split(/\s+/);
        bin = parts[0];
        cmdArgs = parts.slice(1);
      }

      // Windows compatibility: use cmd /c if shell utility is executed
      const isWindows = process.platform === 'win32';
      const shellCmd = isWindows ? 'cmd.exe' : '/bin/sh';
      const shellArgs = isWindows ? ['/c', `${bin} ${cmdArgs.join(' ')}`] : ['-c', `${bin} ${cmdArgs.join(' ')}`];

      let child;
      try {
        child = spawn(shellCmd, shellArgs, {
          cwd: wsDir,
          env: this.getSanitizedEnv(customEnv),
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
        });
      } catch (err) {
        return resolve({
          exitCode: 1,
          stdout: '',
          stderr: `Failed to spawn process: ${err.message}`,
          executionTimeMs: Date.now() - startTime,
          timedOut: false,
        });
      }

      this.activeProcesses.set(workspaceId, child);

      const timer = setTimeout(() => {
        killed = true;
        try {
          if (isWindows) {
            spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t']);
          } else {
            child.kill('SIGKILL');
          }
        } catch {}
      }, timeoutMs);

      child.stdout.on('data', (data) => {
        if (stdout.length < MAX_BUFFER_SIZE) {
          stdout += data.toString();
        }
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < MAX_BUFFER_SIZE) {
          stderr += data.toString();
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        this.activeProcesses.delete(workspaceId);
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + `\nProcess error: ${err.message}`,
          executionTimeMs: Date.now() - startTime,
          timedOut: false,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        this.activeProcesses.delete(workspaceId);

        if (killed) {
          stderr += `\nCommand timed out after ${timeoutMs}ms and was terminated.`;
        }

        resolve({
          exitCode: killed ? 124 : (code ?? 0),
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          executionTimeMs: Date.now() - startTime,
          timedOut: killed,
        });
      });
    });
  }

  /**
   * Terminate any active process running for a workspace
   */
  terminateWorkspaceProcess(workspaceId) {
    const child = this.activeProcesses.get(workspaceId);
    if (child) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t']);
        } else {
          child.kill('SIGKILL');
        }
      } catch {}
      this.activeProcesses.delete(workspaceId);
      return true;
    }
    return false;
  }
}

const processManager = new ProcessManager();

module.exports = {
  processManager,
  ProcessManager,
};
