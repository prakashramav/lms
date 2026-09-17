const { Skill, StudentSkill } = require('../../models/skill.model');
const SkillRelationship = require('../../models/skillRelationship.model');
const Mistake = require('../../models/mistake.model');

// In-memory knowledge graph dependencies for fast traversal and fallback
const CURATED_PREREQUISITE_GRAPH = {
  'react-hooks': [
    { slug: 'javascript-closures', name: 'JavaScript Closures', reason: 'Hooks rely on closures to preserve state between renders' },
    { slug: 'javascript-functions', name: 'JavaScript Functions', reason: 'Hooks are specialized functional primitives' },
    { slug: 'javascript-scope', name: 'Variable Scope', reason: 'State scoping rules govern hook execution' },
  ],
  'react': [
    { slug: 'javascript', name: 'JavaScript ES6+', reason: 'React relies heavily on destructuring, arrow functions, and array methods' },
    { slug: 'html', name: 'HTML & Semantic Markup', reason: 'JSX maps directly to HTML elements' },
    { slug: 'css', name: 'CSS & Styling', reason: 'Component styling requires CSS fundamentals' },
  ],
  'nextjs': [
    { slug: 'react', name: 'React Fundamentals', reason: 'Next.js is a meta-framework built on top of React' },
    { slug: 'node', name: 'Node.js Basics', reason: 'SSR and Server Components run in a Node.js runtime' },
  ],
  'javascript-closures': [
    { slug: 'javascript-scope', name: 'Variable Scope & Lexical Environment', reason: 'Closures are functions that retain access to outer lexical scope' },
    { slug: 'javascript-functions', name: 'Functions & First-Class Citizens', reason: 'Functions must be passable as values' },
  ],
  'express': [
    { slug: 'node', name: 'Node.js Core (HTTP, Event Loop)', reason: 'Express abstracts Node.js native HTTP server' },
    { slug: 'javascript', name: 'Async JavaScript & Promises', reason: 'Middleware and route handlers are asynchronous' },
  ],
  'fullstack': [
    { slug: 'react', name: 'Frontend Framework (React)', reason: 'Client-side UI architecture' },
    { slug: 'express', name: 'Backend API Framework (Express)', reason: 'Server-side API architecture' },
    { slug: 'mongodb', name: 'Database Fundamentals (MongoDB)', reason: 'Persistent data layer' },
  ],
  'redux': [
    { slug: 'react', name: 'React State Management', reason: 'Redux manages centralized state for React applications' },
    { slug: 'javascript', name: 'Immutability & Pure Functions', reason: 'Redux reducers must be pure deterministic functions' },
  ],
};

/**
 * Traverse prerequisite tree recursively
 */
async function getPrerequisiteTree(skillSlug, visited = new Set()) {
  const normalizedSlug = skillSlug.toLowerCase();
  if (visited.has(normalizedSlug)) return [];
  visited.add(normalizedSlug);

  const curated = CURATED_PREREQUISITE_GRAPH[normalizedSlug] || [];
  const tree = [];

  for (const dep of curated) {
    const subPrereqs = await getPrerequisiteTree(dep.slug, new Set(visited));
    tree.push({
      ...dep,
      subPrerequisites: subPrereqs,
    });
  }

  // Also check database Skill model
  try {
    const dbSkill = await Skill.findOne({ slug: normalizedSlug }).populate('prerequisites').lean();
    if (dbSkill && dbSkill.prerequisites && dbSkill.prerequisites.length > 0) {
      for (const p of dbSkill.prerequisites) {
        if (!visited.has(p.slug)) {
          tree.push({
            slug: p.slug,
            name: p.name,
            reason: `Prerequisite defined in curriculum for ${dbSkill.name}`,
            subPrerequisites: [],
          });
        }
      }
    }
  } catch (err) {
    // Non-fatal, fallback graph used
  }

  return tree;
}

/**
 * Identify student prerequisite gaps when struggling with a topic
 */
async function analyzePrerequisiteGaps(studentId, targetSkillSlug) {
  const normalizedSlug = targetSkillSlug.toLowerCase();
  const prereqTree = await getPrerequisiteTree(normalizedSlug);

  // Flatten unique prerequisites
  const flatPrereqs = new Map();
  function flatten(items) {
    for (const item of items) {
      if (!flatPrereqs.has(item.slug)) {
        flatPrereqs.set(item.slug, item);
      }
      if (item.subPrerequisites) flatten(item.subPrerequisites);
    }
  }
  flatten(prereqTree);

  // Fetch student performance for these prerequisites
  const prereqSlugs = Array.from(flatPrereqs.keys());
  const skillsInDb = await Skill.find({ slug: { $in: prereqSlugs } }).lean();
  const skillIdMap = new Map(skillsInDb.map((s) => [s.slug, s._id]));

  const studentSkills = await StudentSkill.find({
    studentId,
    skillId: { $in: Array.from(skillIdMap.values()) },
  }).lean();

  const studentSkillMap = new Map();
  for (const ss of studentSkills) {
    const skillObj = skillsInDb.find((s) => s._id.toString() === ss.skillId.toString());
    if (skillObj) studentSkillMap.set(skillObj.slug, ss);
  }

  // Check recent mistakes for these topics
  const recentMistakes = await Mistake.find({
    studentId,
    resolved: false,
  }).limit(50).lean();

  const identifiedGaps = [];

  for (const [slug, depInfo] of flatPrereqs.entries()) {
    const ss = studentSkillMap.get(slug);
    const relatedMistakes = recentMistakes.filter(
      (m) => m.skillSlug === slug || (m.topic && m.topic.toLowerCase().includes(slug))
    );

    let isGap = false;
    let gapReason = '';

    if (!ss) {
      isGap = true;
      gapReason = `No observed learning activity or assessment for ${depInfo.name}`;
    } else if (ss.observedScore < 60) {
      isGap = true;
      gapReason = `Low demonstrated mastery (${ss.observedScore}%) in prerequisite: ${depInfo.name}`;
    } else if (ss.confidence === 'LOW' && ss.masteryLevel === 'BEGINNER') {
      isGap = true;
      gapReason = `Unconfirmed foundation in ${depInfo.name}`;
    } else if (relatedMistakes.length >= 2) {
      isGap = true;
      gapReason = `${relatedMistakes.length} unresolved mistakes in ${depInfo.name}`;
    }

    if (isGap) {
      identifiedGaps.push({
        skillSlug: slug,
        skillName: depInfo.name,
        prerequisiteReason: depInfo.reason,
        gapReason,
        currentMastery: ss ? ss.masteryLevel : 'NOT_STARTED',
        observedScore: ss ? ss.observedScore : 0,
        unresolvedMistakesCount: relatedMistakes.length,
        recommendedAction: `Complete foundational practice and active recall on ${depInfo.name} before continuing ${targetSkillSlug}`,
      });
    }
  }

  return {
    targetSkill: targetSkillSlug,
    totalPrerequisitesAnalyzed: flatPrereqs.size,
    gapsFoundCount: identifiedGaps.length,
    isRemediationRecommended: identifiedGaps.length > 0,
    identifiedGaps,
    prerequisiteTree: prereqTree,
  };
}

module.exports = {
  getPrerequisiteTree,
  analyzePrerequisiteGaps,
  CURATED_PREREQUISITE_GRAPH,
};
