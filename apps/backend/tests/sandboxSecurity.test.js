const { Sandbox } = require('../src/services/judge/sandbox');
const { executionWorker } = require('../src/services/judge/worker');

describe('Sandbox Security & Threat Containment', () => {
  const sandbox = new Sandbox({ timeout: 1500 });

  it('prevents host filesystem access (require is blocked)', async () => {
    const maliciousCode = `
      try {
        const fs = require('fs');
        fs.readFileSync('/etc/passwd');
      } catch (err) {
        throw new Error('BLOCKED: ' + err.message);
      }
    `;
    const res = await sandbox.run(maliciousCode);
    expect(res.verdict).toBe('RUNTIME_ERROR');
    expect(res.stderr).toContain('require is not a function');
  });

  it('prevents host process and environment variable access (process is blocked)', async () => {
    const maliciousCode = `
      try {
        const secret = process.env.JWT_SECRET;
        console.log(secret);
      } catch (err) {
        throw new Error('BLOCKED: ' + err.message);
      }
    `;
    const res = await sandbox.run(maliciousCode);
    expect(res.verdict).toBe('RUNTIME_ERROR');
    expect(res.stderr).toMatch(/Cannot read properties of undefined|process is not defined/);
  });

  it('stops infinite loops within timeout limit (TIME_LIMIT_EXCEEDED)', async () => {
    const loopCode = `
      let i = 0;
      while (true) {
        i++;
      }
    `;
    const res = await sandbox.run(loopCode);
    expect(res.verdict).toBe('TIME_LIMIT_EXCEEDED');
    expect(res.errorMessage).toContain('Execution exceeded the time limit');
  });

  it('contains massive stdout output flooding (capped buffer)', async () => {
    const floodCode = `
      for (let i = 0; i < 50000; i++) {
        console.log("flood-line-" + i);
      }
    `;
    const res = await sandbox.run(floodCode);
    expect(res.stdout.length).toBeLessThanOrEqual(15 * 1024);
  });

  it('prevents arbitrary network requests (fetch / XMLHttpRequest blocked)', async () => {
    const netCode = `
      try {
        fetch('https://evil.example.com');
      } catch (err) {
        throw new Error('BLOCKED: ' + err.message);
      }
    `;
    const res = await sandbox.run(netCode);
    expect(res.verdict).toBe('RUNTIME_ERROR');
    expect(res.stderr).toContain('fetch is not a function');
  });

  it('prevents child process spawning', async () => {
    const spawnCode = `
      try {
        const cp = require('child_process');
        cp.exec('dir');
      } catch (err) {
        throw new Error('BLOCKED: ' + err.message);
      }
    `;
    const res = await sandbox.run(spawnCode);
    expect(res.verdict).toBe('RUNTIME_ERROR');
    expect(res.stderr).toContain('require is not a function');
  });

  it('prevents host global / globalThis access', async () => {
    const globalCode = `
      try {
        const g = globalThis;
        g.evil = true;
      } catch (err) {
        throw new Error('BLOCKED: ' + err.message);
      }
    `;
    const res = await sandbox.run(globalCode);
    expect(res.verdict).toBe('RUNTIME_ERROR');
    expect(res.stderr).toMatch(/Cannot set properties of undefined|Cannot create property/);
  });

  it('survives prototype pollution attempt', async () => {
    const pollutionCode = `
      Object.prototype.isAdmin = true;
    `;
    await sandbox.run(pollutionCode);
    // Host Object.prototype should NOT be polluted
    expect(({}).isAdmin).toBeUndefined();
  });
});
