/**
 * Embedding provider with support for vector similarity and deterministic fallback
 */
class EmbeddingProvider {
  constructor() {
    this.vectorDim = 64; // Standard compact deterministic vector dimension
  }

  /**
   * Computes cosine similarity between two numeric vectors
   * @param {number[]} vecA
   * @param {number[]} vecB
   * @returns {number} Value between -1.0 and 1.0 (1.0 = identical)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generates a normalized vector embedding for text
   * Uses deterministic hashing and character n-gram distribution for reliable local similarity
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async getEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.vectorDim).fill(0);
    }

    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const vector = new Array(this.vectorDim).fill(0);

    for (const token of tokens) {
      // Deterministic hash into vector dimension
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = (hash << 5) - hash + token.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % this.vectorDim;
      vector[index] += 1;
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.vectorDim; i++) {
      norm += vector[i] * vector[i];
    }
    const mag = Math.sqrt(norm);
    if (mag > 0) {
      for (let i = 0; i < this.vectorDim; i++) {
        vector[i] = Number((vector[i] / mag).toFixed(6));
      }
    }

    return vector;
  }
}

module.exports = new EmbeddingProvider();
