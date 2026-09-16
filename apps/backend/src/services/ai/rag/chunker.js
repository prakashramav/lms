/**
 * Text chunker for RAG ingestion
 */

/**
 * Splits text into overlapping chunks
 * @param {string} text - Raw content
 * @param {number} [chunkSize=250] - Approx words per chunk
 * @param {number} [chunkOverlap=50] - Approx overlapping words
 * @returns {string[]} Array of chunked text
 */
function chunkText(text, chunkSize = 250, chunkOverlap = 50) {
  if (!text || typeof text !== 'string') return [];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= chunkSize) {
    return [text.trim()];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < words.length) {
    const chunkWords = words.slice(startIndex, startIndex + chunkSize);
    chunks.push(chunkWords.join(' '));
    startIndex += chunkSize - chunkOverlap;
  }

  return chunks;
}

/**
 * Sanitizes text to prevent leaking credentials or private variables
 * @param {string} text
 * @returns {string}
 */
function sanitizeContent(text) {
  if (!text) return '';
  return text
    .replace(/(?:password|secret|jwt|token|api[_-]?key)\s*[:=]\s*['"][^'"]+['"]/gi, '[REDACTED]')
    .trim();
}

module.exports = {
  chunkText,
  sanitizeContent,
};
