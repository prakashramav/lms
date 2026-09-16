# Sandbox Security & Threat Containment

## Security Principles

In strict adherence to Phase 6 requirements, student code is **NEVER executed directly within the main Express API server process**, nor via dangerous functions like `eval()`, `new Function()`, or unconstrained `child_process.exec()` on the host.

## Hardened Sandbox Isolation

### 1. Zero Access to Sensitive Resources
The execution sandbox strips all dangerous host globals:
- `process`: Undefined. Student code cannot read environment variables (`process.env.JWT_SECRET`, `process.env.MONGODB_URI`).
- `require`: Undefined. Student code cannot load Node modules (`fs`, `net`, `http`, `child_process`, `os`).
- `global` / `globalThis`: Nullified or pointing only to the isolated context.
- `Buffer`: Undefined.
- `fetch`, `XMLHttpRequest`, `WebSocket`: Undefined. Code has zero network egress.
- Timers (`setTimeout`, `setInterval`, `setImmediate`): Undefined or strictly intercepted by execution watchdog.

### 2. Prototype Pollution Resistance
The sandbox initializes a fresh, isolated V8 realm without binding host prototypes (`Object.prototype`, `Array.prototype`). Any prototype modifications inside the guest context are discarded when the script finishes execution and never leak to the host process.

### 3. Resource Caps
| Resource | Limit | Policy |
|---|---|---|
| **CPU Execution Time** | 2.5 seconds | Script terminated with `ERR_SCRIPT_EXECUTION_TIMEOUT` (`TIME_LIMIT_EXCEEDED`) |
| **Output Buffer** | 10 KB | Console logs truncated beyond buffer cap |
| **Code Length** | 100 KB | Rejected upfront by API controller with `400 Bad Request` |
| **Memory Limit** | 256 MB | Monitored per execution |
| **Rate Limit (/run)** | 30 requests / min | Enforced per user / IP |
| **Rate Limit (/submit)** | 15 requests / min | Enforced per user / IP |

### 4. Client-Side Iframe Isolation
For live previews (HTML/CSS and React):
- Rendered exclusively inside `<iframe sandbox="allow-scripts">`.
- `allow-same-origin` is omitted, assigning the iframe an opaque unique origin.
- The iframe cannot access parent cookies, `localStorage`, `sessionStorage`, or parent DOM.
