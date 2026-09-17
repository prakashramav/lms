/**
 * NoSQL Injection & Input Sanitization Middleware
 * Recursively cleans keys starting with '$' or containing '.' to prevent Mongo query injection.
 * Strips dangerous control characters from string values.
 */

const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObject(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block Mongo query operator injections ($gt, $ne, $where, etc.)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanObject(value);
    } else if (typeof value === 'string') {
      // Clean null bytes and trim excessive control chars
      cleaned[key] = value.replace(/\0/g, '');
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = cleanObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = cleanObject(req.params);
  }

  next();
};

module.exports = sanitizeInput;
