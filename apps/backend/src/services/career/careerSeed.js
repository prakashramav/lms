const CareerPath = require('../../models/careerPath.model');
const Company = require('../../models/company.model');
const Job = require('../../models/job.model');
const InterviewQuestion = require('../../models/interviewQuestion.model');
const CareerResource = require('../../models/careerResource.model');
const FeatureFlag = require('../../models/featureFlag.model');
const { Skill } = require('../../models/skill.model');

const CAREER_FLAGS = [
  { key: 'CAREER_ENABLED', description: 'Enable Career Hub, Roadmaps, and Readiness', enabled: true },
  { key: 'JOB_BOARD_ENABLED', description: 'Enable Job Board and Filters', enabled: true },
  { key: 'APPLICATION_TRACKER_ENABLED', description: 'Enable Application Tracker & Pipeline', enabled: true },
  { key: 'RESUME_BUILDER_ENABLED', description: 'Enable Multi-Resume Builder and ATS checks', enabled: true },
  { key: 'PORTFOLIO_ENABLED', description: 'Enable Public and Private Portfolio Showcase', enabled: true },
  { key: 'INTERVIEW_PREP_ENABLED', description: 'Enable Interview Question Bank & Mock Sessions', enabled: true },
  { key: 'CAREER_AI_ENABLED', description: 'Enable AI Career Assistant and Resume Analyzer', enabled: true },
  { key: 'EMPLOYER_ENABLED', description: 'Enable Employer Recruitment and Candidate Review', enabled: true },
  { key: 'JOB_ALERTS_ENABLED', description: 'Enable Job Search Alerts and Notifications', enabled: true },
];

const INITIAL_CAREER_PATHS = [
  {
    name: 'Full Stack Developer',
    slug: 'full-stack-developer',
    description: 'Master both frontend user interfaces and robust backend microservices to ship complete web applications.',
    category: 'FULLSTACK',
    difficulty: 'INTERMEDIATE',
    status: 'PUBLISHED',
    resumeKeywords: ['React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'TypeScript', 'Git', 'CI/CD'],
    interviewTopics: ['Component State Management', 'Event Loop & Async', 'Database Indexing', 'Authentication & JWT', 'Web Security'],
    recommendedCertifications: ['AWS Certified Developer', 'Meta Front-End Developer', 'Node.js Certified Developer'],
    recommendedProjects: [
      {
        title: 'Collaborative Real-time Workspace',
        description: 'Build a document editor with real-time sync, WebSockets, and role-based permissions.',
        technologies: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
        difficulty: 'ADVANCED',
      },
      {
        title: 'E-commerce API & Storefront',
        description: 'Implement a headless store with product catalog, cart state, and stripe checkout.',
        technologies: ['Next.js', 'Express', 'Mongoose', 'Stripe'],
        difficulty: 'INTERMEDIATE',
      },
    ],
    roadmapStages: [
      { stageNumber: 1, title: 'Programming Fundamentals', description: 'Master JavaScript ES6+, data structures, and async paradigms.', skills: ['JavaScript', 'HTML5/CSS3', 'Git'] },
      { stageNumber: 2, title: 'Frontend Mastery', description: 'Build interactive UI components, state machines, and responsive layouts.', skills: ['React', 'Tailwind/CSS', 'Next.js'] },
      { stageNumber: 3, title: 'Backend Architecture', description: 'Design RESTful APIs, middleware chains, and data models.', skills: ['Node.js', 'Express', 'MongoDB'] },
      { stageNumber: 4, title: 'Production Engineering', description: 'Deploy cloud infrastructure, docker containers, and security protections.', skills: ['Docker', 'CI/CD', 'Security/Auth'] },
      { stageNumber: 5, title: 'Capstone & Placement', description: 'Deliver production project, fine-tune resume, and practice technical interviews.', skills: ['System Design', 'Behavioral Interviews'] },
    ],
  },
  {
    name: 'Frontend Developer',
    slug: 'frontend-developer',
    description: 'Specialize in delightful, accessible, high-performance web applications and design systems.',
    category: 'FRONTEND',
    difficulty: 'BEGINNER',
    status: 'PUBLISHED',
    resumeKeywords: ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'Web Performance', 'Accessibility', 'Redux'],
    interviewTopics: ['DOM Manipulation', 'Virtual DOM', 'React Reconciliation', 'CSS Grid/Flexbox', 'Core Web Vitals'],
    recommendedCertifications: ['Meta Front-End Developer Professional', 'Google Mobile Web Specialist'],
    recommendedProjects: [
      {
        title: 'High-Density Analytics Dashboard',
        description: 'Responsive telemetry charts, dark mode toggle, and filterable data tables.',
        technologies: ['React', 'Chart.js', 'TailwindCSS'],
        difficulty: 'INTERMEDIATE',
      },
    ],
    roadmapStages: [
      { stageNumber: 1, title: 'Web Foundations', description: 'Semantic HTML, modern CSS layouts, and vanilla JS manipulation.', skills: ['HTML5', 'Modern CSS', 'JavaScript ES6'] },
      { stageNumber: 2, title: 'React Ecosystem', description: 'Component lifecycles, hooks, context API, and client routing.', skills: ['React', 'React Router'] },
      { stageNumber: 3, title: 'Performance & Testing', description: 'Bundle optimization, accessibility WCAG, and component unit testing.', skills: ['Jest', 'Core Web Vitals'] },
    ],
  },
  {
    name: 'Backend Developer',
    slug: 'backend-developer',
    description: 'Architect scalable server applications, database clusters, and reliable APIs.',
    category: 'BACKEND',
    difficulty: 'INTERMEDIATE',
    status: 'PUBLISHED',
    resumeKeywords: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'Microservices'],
    interviewTopics: ['Concurrency & Threading', 'Database Normalization vs Sharding', 'Caching Strategies', 'Rate Limiting'],
    recommendedCertifications: ['MongoDB Certified Developer', 'AWS Solutions Architect Associate'],
    recommendedProjects: [
      {
        title: 'Distributed Task Queue Service',
        description: 'Scalable job queue with retry mechanisms, worker pools, and Redis persistence.',
        technologies: ['Node.js', 'Redis', 'Docker'],
        difficulty: 'ADVANCED',
      },
    ],
    roadmapStages: [
      { stageNumber: 1, title: 'Server Basics', description: 'HTTP protocols, Node runtime, and REST design.', skills: ['Node.js', 'Express'] },
      { stageNumber: 2, title: 'Databases & Query Tuning', description: 'Schema normalization, indexing, aggregations, and caching.', skills: ['MongoDB', 'Redis'] },
      { stageNumber: 3, title: 'Distributed Systems', description: 'Message brokers, microservice security, and observability.', skills: ['Docker', 'System Design'] },
    ],
  },
];

const INITIAL_COMPANIES = [
  {
    name: 'Stripe',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    description: 'Financial infrastructure for the internet. Millions of companies of all sizes use Stripe software to accept payments and manage their businesses online.',
    website: 'https://stripe.com',
    industry: 'Financial Technology',
    locations: ['Remote', 'San Francisco', 'Dublin', 'Bengaluru'],
    size: '1000+',
    status: 'VERIFIED',
  },
  {
    name: 'Vercel',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    description: 'Vercel provides the developer experience and infrastructure to build, scale, and secure a faster, more personalized web.',
    website: 'https://vercel.com',
    industry: 'Cloud & Developer Tools',
    locations: ['Remote', 'San Francisco'],
    size: '201-500',
    status: 'VERIFIED',
  },
  {
    name: 'GitHub',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    description: 'GitHub is the world’s leading AI-powered developer platform to build, scale, and deliver secure software.',
    website: 'https://github.com',
    industry: 'Software & DevOps',
    locations: ['Remote', 'Seattle'],
    size: '1000+',
    status: 'VERIFIED',
  },
];

const INITIAL_INTERVIEW_QUESTIONS = [
  {
    question: 'Explain how the JavaScript Event Loop handles asynchronous operations such as Promises versus setTimeout.',
    category: 'TECHNICAL',
    difficulty: 'INTERMEDIATE',
    role: 'Full Stack Developer',
    skills: ['JavaScript', 'Async', 'Event Loop'],
    expectedTopics: ['Call stack', 'Web APIs', 'Microtask queue', 'Macrotask queue', 'Event loop cycle'],
    explanation: 'Microtasks (Promises, process.nextTick) have higher priority and are completely drained before the next macrotask (setTimeout, setInterval) executes.',
  },
  {
    question: 'How do you design database indexes in MongoDB to optimize queries with multiple filter criteria and sorting?',
    category: 'TECHNICAL',
    difficulty: 'INTERMEDIATE',
    role: 'Backend Developer',
    skills: ['MongoDB', 'Database', 'Indexing'],
    expectedTopics: ['Compound indexes', 'ESR rule (Equality, Sort, Range)', 'Index cardinality', 'Covered queries'],
    explanation: 'Follow the ESR rule: Equality fields first, followed by Sort fields, and finally Range filter fields.',
  },
  {
    question: 'Describe a situation where you encountered a critical production bug. How did you triage and resolve it?',
    category: 'BEHAVIORAL',
    difficulty: 'INTERMEDIATE',
    role: 'Full Stack Developer',
    skills: ['Problem Solving', 'Communication', 'STAR Technique'],
    expectedTopics: ['Situation context', 'Investigation & rollback', 'Root cause analysis', 'Preventative safeguards'],
    explanation: 'Use the STAR format: Situation, Task, Action taken (immediate triage + postmortem), and Result.',
  },
  {
    question: 'Design a scalable URL shortener service like bit.ly handling 100 million requests daily.',
    category: 'SYSTEM_DESIGN',
    difficulty: 'ADVANCED',
    role: 'Backend Developer',
    skills: ['System Design', 'Caching', 'Database Sharding', 'Hashing'],
    expectedTopics: ['Functional requirements', 'Traffic estimation', 'Base62 encoding vs UUID', 'Redis caching', 'Database schema'],
    explanation: 'Clarify throughput, calculate read-to-write ratios, apply base62 counter hashing, and cache hot URLs via Redis.',
  },
  {
    question: 'Why are you interested in this role, and how do your technical projects demonstrate your passion for software craft?',
    category: 'HR',
    difficulty: 'BEGINNER',
    role: 'Full Stack Developer',
    skills: ['Communication', 'Culture Fit', 'Career Goals'],
    expectedTopics: ['Career alignment', 'Project motivation', 'Continuous learning', 'Collaboration style'],
    explanation: 'Highlight technical curiosity, specific achievements from portfolio projects, and how platform courses prepared you.',
  },
];

const INITIAL_RESOURCES = [
  {
    title: 'Mastering the ATS-Friendly Technical Resume',
    category: 'RESUME',
    content: 'Applicant Tracking Systems prioritize standard headings, readable text formatting, and clear skill keywords over multi-column graphics. Keep section headers standard (Experience, Projects, Education, Skills) and quantify bullet points using the Google XYZ formula: Accomplished [X] as measured by [Y] by doing [Z].',
    tags: ['Resume', 'Career', 'ATS'],
  },
  {
    title: 'The System Design Primer for Junior & Mid-level Engineers',
    category: 'SYSTEM_DESIGN',
    content: 'When asked a system design question, do not jump directly to drawing databases. Always step through: 1. Functional Requirements, 2. Non-functional requirements (Scale, Latency, Consistency), 3. High-level Architecture, 4. Data Layer, 5. Bottlenecks and Trade-offs.',
    tags: ['Architecture', 'System Design', 'Scale'],
  },
  {
    title: 'Behavioral Interviews: The STAR Method Blueprint',
    category: 'COMMUNICATION',
    content: 'Structure your answers using STAR: Situation (set the context in 2 sentences), Task (what you were responsible for), Action (specific tools, decisions, and leadership you took), Result (measurable impact, user feedback, or key learning).',
    tags: ['Interviews', 'STAR', 'Soft Skills'],
  },
];

async function seedCareerEcosystem() {
  try {
    // 1. Seed Feature Flags
    for (const flag of CAREER_FLAGS) {
      await FeatureFlag.findOneAndUpdate(
        { key: flag.key },
        { $setOnInsert: flag },
        { upsert: true, new: true }
      );
    }

    // 2. Fetch existing skills to associate with career paths
    const existingSkills = await Skill.find({}).lean();
    const skillMap = new Map(existingSkills.map((s) => [s.slug, s._id]));

    // 3. Seed Career Paths
    for (const path of INITIAL_CAREER_PATHS) {
      const requiredSkillIds = [];
      if (path.slug === 'full-stack-developer') {
        ['javascript-fundamentals', 'async-javascript', 'react-hooks', 'node-express-apis', 'database-modeling-mongoose'].forEach((slug) => {
          if (skillMap.has(slug)) requiredSkillIds.push(skillMap.get(slug));
        });
      } else if (path.slug === 'frontend-developer') {
        ['javascript-fundamentals', 'async-javascript', 'react-hooks'].forEach((slug) => {
          if (skillMap.has(slug)) requiredSkillIds.push(skillMap.get(slug));
        });
      } else if (path.slug === 'backend-developer') {
        ['javascript-fundamentals', 'node-express-apis', 'database-modeling-mongoose', 'data-structures-algorithms'].forEach((slug) => {
          if (skillMap.has(slug)) requiredSkillIds.push(skillMap.get(slug));
        });
      }

      await CareerPath.findOneAndUpdate(
        { slug: path.slug },
        {
          $set: {
            ...path,
            requiredSkills: requiredSkillIds.length > 0 ? requiredSkillIds : undefined,
          },
        },
        { upsert: true, new: true }
      );
    }

    // 4. Seed Companies
    const createdCompanies = [];
    for (const comp of INITIAL_COMPANIES) {
      const company = await Company.findOneAndUpdate(
        { name: comp.name },
        { $set: comp },
        { upsert: true, new: true }
      );
      createdCompanies.push(company);
    }

    // 5. Seed Jobs if companies exist
    if (createdCompanies.length > 0) {
      const stripeComp = createdCompanies.find((c) => c.name === 'Stripe') || createdCompanies[0];
      const vercelComp = createdCompanies.find((c) => c.name === 'Vercel') || createdCompanies[0];
      const githubComp = createdCompanies.find((c) => c.name === 'GitHub') || createdCompanies[0];

      const sampleJobs = [
        {
          title: 'Full Stack Engineer, Payments Platform',
          companyId: stripeComp._id,
          description: 'Join our merchant payments team building resilient APIs and sleek checkout dashboards used by millions of businesses. You will work across React frontends and Node.js microservices.',
          skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
          location: 'Remote, Global',
          remoteType: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceLevel: 'ENTRY',
          salaryRange: { min: 110000, max: 145000, currency: 'USD', period: 'YEARLY' },
          status: 'PUBLISHED',
          source: 'PLATFORM',
        },
        {
          title: 'Frontend Engineer, Web Frameworks',
          companyId: vercelComp._id,
          description: 'Help build the next generation of web developer tooling. You will collaborate with design and runtime teams to optimize frontend rendering, state caching, and responsive UI components.',
          skills: ['React', 'Next.js', 'JavaScript', 'TailwindCSS'],
          location: 'San Francisco, CA (Hybrid)',
          remoteType: 'HYBRID',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          salaryRange: { min: 130000, max: 165000, currency: 'USD', period: 'YEARLY' },
          status: 'PUBLISHED',
          source: 'PLATFORM',
        },
        {
          title: 'Backend Systems Engineer, Cloud Storage',
          companyId: githubComp._id,
          description: 'Engineer high-throughput repository persistence services, asynchronous worker queues, and caching clusters. Knowledge of Node.js, distributed databases, and security best practices is essential.',
          skills: ['Node.js', 'Express', 'MongoDB', 'Docker', 'Redis'],
          location: 'Remote',
          remoteType: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          salaryRange: { min: 135000, max: 175000, currency: 'USD', period: 'YEARLY' },
          status: 'PUBLISHED',
          source: 'PLATFORM',
        },
      ];

      for (const job of sampleJobs) {
        await Job.findOneAndUpdate(
          { title: job.title, companyId: job.companyId },
          { $set: job },
          { upsert: true, new: true }
        );
      }
    }

    // 6. Seed Interview Questions
    for (const q of INITIAL_INTERVIEW_QUESTIONS) {
      await InterviewQuestion.findOneAndUpdate(
        { question: q.question },
        { $set: q },
        { upsert: true, new: true }
      );
    }

    // 7. Seed Career Resources
    for (const res of INITIAL_RESOURCES) {
      await CareerResource.findOneAndUpdate(
        { title: res.title },
        { $set: res },
        { upsert: true, new: true }
      );
    }

    return { success: true, message: 'Career ecosystem seed completed' };
  } catch (error) {
    console.error('Error seeding career ecosystem:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  seedCareerEcosystem,
  CAREER_FLAGS,
  INITIAL_CAREER_PATHS,
  INITIAL_COMPANIES,
  INITIAL_INTERVIEW_QUESTIONS,
  INITIAL_RESOURCES,
};
