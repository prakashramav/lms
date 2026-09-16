/**
 * Output Normalization and Comparison Utility
 *
 * Rules:
 * 1. Convert all CRLF (\r\n) to LF (\n).
 * 2. Trim trailing whitespace from each line.
 * 3. Strip trailing newline characters at the end of the entire output string.
 * 4. For JSON outputs, attempt a parsed JSON equality check before falling back to string comparison.
 * 5. Case and internal whitespace within words or numbers are strictly preserved.
 */

function normalizeOutput(output) {
  if (output === null || output === undefined) {
    return '';
  }

  const str = String(output);

  // Normalize CRLF to LF
  let normalized = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines, trim trailing whitespace per line
  const lines = normalized.split('\n').map((line) => line.trimEnd());

  // Join back and trim leading/trailing blank lines
  normalized = lines.join('\n').trim();

  return normalized;
}

function areOutputsEqual(actual, expected) {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) {
    return true;
  }

  // Attempt JSON parsing if both look like JSON arrays or objects
  if (
    (normActual.startsWith('[') && normActual.endsWith(']')) ||
    (normActual.startsWith('{') && normActual.endsWith('}'))
  ) {
    try {
      const parsedActual = JSON.parse(normActual);
      const parsedExpected = JSON.parse(normExpected);
      return deepEqual(parsedActual, parsedExpected);
    } catch {
      // Fall through to false if JSON parsing fails
    }
  }

  // Try numeric comparison if both are valid numbers
  const numActual = Number(normActual);
  const numExpected = Number(normExpected);
  if (!isNaN(numActual) && !isNaN(numExpected) && normActual !== '' && normExpected !== '') {
    return Math.abs(numActual - numExpected) < 1e-6;
  }

  return false;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

module.exports = {
  normalizeOutput,
  areOutputsEqual,
  deepEqual,
};
