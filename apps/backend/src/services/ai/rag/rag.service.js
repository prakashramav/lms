const { VectorChunk } = require('../../../models/vectorChunk.model');
const { Course } = require('../../../models/course.model');
const { Lesson } = require('../../../models/lesson.model');
const { Problem } = require('../../../models/problem.model');
const embeddingProvider = require('./embedding.provider');
const { chunkText, sanitizeContent } = require('./chunker');

class RAGService {
  /**
   * Indexes a lesson into vector chunks
   * @param {object} lesson
   */
  async indexLesson(lesson) {
    if (!lesson || !lesson._id) return;

    // Delete existing chunks for this lesson
    await VectorChunk.deleteMany({ lessonId: lesson._id });

    const rawText = `${lesson.title}\n\n${lesson.description || ''}\n\n${lesson.content || ''}`;
    const sanitized = sanitizeContent(rawText);
    const chunks = chunkText(sanitized, 200, 40);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embeddingProvider.getEmbedding(chunk);

      await VectorChunk.create({
        documentType: 'LESSON',
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        lessonId: lesson._id,
        title: `${lesson.title} (Part ${i + 1})`,
        content: chunk,
        tokensCount: Math.round(chunk.split(/\s+/).length * 1.3),
        embedding,
        metadata: {
          lessonType: lesson.type,
          slug: lesson.slug,
        },
      });
    }
  }

  /**
   * Indexes a coding problem into vector chunks (excluding hidden test cases!)
   * @param {object} problem
   */
  async indexProblem(problem) {
    if (!problem || !problem._id) return;

    await VectorChunk.deleteMany({ problemId: problem._id });

    // Exclude any hidden test cases or internal evaluator code
    const rawText = `Problem: ${problem.title} (${problem.difficulty})\nCategory: ${problem.category}\nTopics: ${(problem.topics || []).join(', ')}\n\n${problem.description}\n\nConstraints:\n${problem.constraints || ''}`;
    const sanitized = sanitizeContent(rawText);
    const chunks = chunkText(sanitized, 200, 40);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embeddingProvider.getEmbedding(chunk);

      await VectorChunk.create({
        documentType: 'PROBLEM',
        problemId: problem._id,
        title: `${problem.title} (Problem Guide)`,
        content: chunk,
        tokensCount: Math.round(chunk.split(/\s+/).length * 1.3),
        embedding,
        metadata: {
          difficulty: problem.difficulty,
          category: problem.category,
          slug: problem.slug,
        },
      });
    }
  }

  /**
   * Performs semantic retrieval given a user query and educational context
   * @param {string} query - Student's question
   * @param {object} [context={}] - { courseId, moduleId, lessonId, problemId }
   * @param {number} [limit=3]
   * @returns {Promise<Array<{title: string, content: string, score: number, documentType: string}>>}
   */
  async retrieveContext(query, context = {}, limit = 3) {
    if (!query || typeof query !== 'string') return [];

    const queryEmbedding = await embeddingProvider.getEmbedding(query);

    // Build filter: prioritize context if provided, else broader documents
    const filter = {};
    if (context.lessonId) {
      filter.lessonId = context.lessonId;
    } else if (context.courseId) {
      filter.courseId = context.courseId;
    } else if (context.problemId) {
      filter.problemId = context.problemId;
    }

    let chunks = await VectorChunk.find(filter).limit(50).lean();

    // If scoped search found nothing, search all published chunks
    if (chunks.length === 0 && Object.keys(filter).length > 0) {
      chunks = await VectorChunk.find({}).limit(50).lean();
    }

    if (chunks.length === 0) return [];

    // Calculate cosine similarity & apply context prioritization boosts
    const scored = chunks.map((chunk) => {
      let score = embeddingProvider.cosineSimilarity(queryEmbedding, chunk.embedding || []);

      // Priority boost for exact contextual match
      if (context.lessonId && String(chunk.lessonId) === String(context.lessonId)) {
        score += 0.25;
      } else if (context.problemId && String(chunk.problemId) === String(context.problemId)) {
        score += 0.25;
      } else if (context.courseId && String(chunk.courseId) === String(context.courseId)) {
        score += 0.15;
      }

      return {
        title: chunk.title,
        content: chunk.content,
        score,
        documentType: chunk.documentType,
        metadata: chunk.metadata,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  /**
   * Ensures essential curriculum content is indexed
   */
  async ensurePlatformIndexed() {
    const chunkCount = await VectorChunk.countDocuments();
    if (chunkCount > 0) return; // Already indexed

    const lessons = await Lesson.find({ isPublished: true }).limit(20);
    for (const l of lessons) {
      await this.indexLesson(l);
    }

    const problems = await Problem.find({ isPublished: true }).limit(20);
    for (const p of problems) {
      await this.indexProblem(p);
    }
  }
}

module.exports = new RAGService();
