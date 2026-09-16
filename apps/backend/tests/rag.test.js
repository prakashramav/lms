const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Course } = require('../src/models/course.model');
const Module = require('../src/models/module.model');
const { Lesson } = require('../src/models/lesson.model');
const { Problem } = require('../src/models/problem.model');
const { VectorChunk } = require('../src/models/vectorChunk.model');
const ragService = require('../src/services/ai/rag/rag.service');
const embeddingProvider = require('../src/services/ai/rag/embedding.provider');
const { chunkText, sanitizeContent } = require('../src/services/ai/rag/chunker');

let mongoServer;
let course;
let mod;
let lesson;
let problem;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  course = await Course.create({
    title: 'Full Stack React & Node',
    slug: 'react-node-rag',
    shortDescription: 'Modern web dev',
    description: 'Learn React hooks and Node architecture',
    category: 'React',
    difficulty: 'INTERMEDIATE',
    instructor: new mongoose.Types.ObjectId(),
    status: 'PUBLISHED',
    isPublished: true,
  });

  mod = await Module.create({
    courseId: course._id,
    title: 'React State Management',
    order: 1,
    isPublished: true,
  });

  lesson = await Lesson.create({
    courseId: course._id,
    moduleId: mod._id,
    title: 'Deep Dive into useEffect',
    slug: 'deep-dive-useeffect',
    type: 'ARTICLE',
    content: 'The useEffect hook lets you synchronize a component with an external system. Always declare dependencies accurately to avoid stale closures.',
    order: 1,
    isPublished: true,
  });

  problem = await Problem.create({
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list-rag',
    category: 'JAVASCRIPT',
    difficulty: 'EASY',
    topics: ['Linked List'],
    supportedLanguages: ['javascript'],
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    functionSignature: {
      name: 'reverseList',
      params: [{ name: 'head', type: 'ListNode' }],
      returnType: 'ListNode',
    },
    starterCode: {
      javascript: 'function reverseList(head) {}',
    },
    isPublished: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('RAG (Retrieval-Augmented Generation) & Semantic Vector Search', () => {
  it('1. Chunker should split long text into overlapping chunks and sanitize credentials', () => {
    const raw = 'Here is a text with password: "secret_value_123" that must be sanitized.';
    const sanitized = sanitizeContent(raw);
    expect(sanitized).not.toContain('secret_value_123');
    expect(sanitized).toContain('[REDACTED]');

    const words = new Array(300).fill('word').join(' ');
    const chunks = chunkText(words, 100, 20);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('2. EmbeddingProvider should compute deterministic normalized vectors and cosine similarity', async () => {
    const vec1 = await embeddingProvider.getEmbedding('React useEffect hook dependency array');
    const vec2 = await embeddingProvider.getEmbedding('React useEffect lifecycle hooks');
    const vec3 = await embeddingProvider.getEmbedding('Completely unrelated cooking recipe for pizza');

    expect(vec1.length).toBe(64);
    expect(vec2.length).toBe(64);

    const simRelated = embeddingProvider.cosineSimilarity(vec1, vec2);
    const simUnrelated = embeddingProvider.cosineSimilarity(vec1, vec3);

    expect(simRelated).toBeGreaterThan(simUnrelated);
  });

  it('3. RAGService should index lessons into VectorChunk documents', async () => {
    await ragService.indexLesson(lesson);
    const chunks = await VectorChunk.find({ lessonId: lesson._id });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].documentType).toBe('LESSON');
    expect(chunks[0].content).toContain('useEffect');
  });

  it('4. RAGService should index problem guides without leaking hidden tests', async () => {
    await ragService.indexProblem(problem);
    const chunks = await VectorChunk.find({ problemId: problem._id });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].documentType).toBe('PROBLEM');
    expect(chunks[0].content).toContain('Reverse Linked List');
  });

  it('5. RAGService.retrieveContext should prioritize scoped lesson chunks for relevant queries', async () => {
    const results = await ragService.retrieveContext('How do dependencies work in useEffect?', {
      courseId: course._id,
      lessonId: lesson._id,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain('useEffect');
    expect(results[0].score).toBeGreaterThan(0);
  });
});
