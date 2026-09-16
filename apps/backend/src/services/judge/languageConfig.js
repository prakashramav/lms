/**
 * Supported Languages and Configuration Registry
 */

const SUPPORTED_LANGUAGES = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    monacoLanguage: 'javascript',
    extension: '.js',
    category: 'JAVASCRIPT',
    isAvailable: true,
    version: 'Node.js v24 (V8)',
    description: 'Modern JavaScript (ES2024+) running in an isolated execution sandbox.',
  },
  html_css: {
    id: 'html_css',
    name: 'HTML & CSS',
    monacoLanguage: 'html',
    extension: '.html',
    category: 'HTML_CSS',
    isAvailable: true,
    version: 'HTML5 & CSS3',
    description: 'Isolated browser preview and DOM assertion test runner.',
  },
  react: {
    id: 'react',
    name: 'React',
    monacoLanguage: 'javascript',
    extension: '.jsx',
    category: 'REACT',
    isAvailable: true,
    version: 'React 18',
    description: 'Component architecture and state runner in a sandboxed DOM environment.',
  },
  node: {
    id: 'node',
    name: 'Node.js',
    monacoLanguage: 'javascript',
    extension: '.js',
    category: 'NODE',
    isAvailable: true,
    version: 'Node.js v24',
    description: 'Standard I/O, streams, and data processing runtime.',
  },
  express: {
    id: 'express',
    name: 'Express.js',
    monacoLanguage: 'javascript',
    extension: '.js',
    category: 'EXPRESS',
    isAvailable: true,
    version: 'Express.js 4.x',
    description: 'Isolated HTTP route handler and middleware test runner.',
  },
  python: {
    id: 'python',
    name: 'Python',
    monacoLanguage: 'python',
    extension: '.py',
    category: 'ALGORITHM',
    isAvailable: false,
    version: 'Python 3.12 (Coming Soon)',
    description: 'Isolated container runner planned for a future release.',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    monacoLanguage: 'typescript',
    extension: '.ts',
    category: 'ALGORITHM',
    isAvailable: false,
    version: 'TypeScript 5.x (Coming Soon)',
    description: 'Transpiled TypeScript runner planned for a future release.',
  },
  java: {
    id: 'java',
    name: 'Java',
    monacoLanguage: 'java',
    extension: '.java',
    category: 'ALGORITHM',
    isAvailable: false,
    version: 'OpenJDK 21 (Coming Soon)',
    description: 'JVM sandbox container planned for a future release.',
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    monacoLanguage: 'cpp',
    extension: '.cpp',
    category: 'ALGORITHM',
    isAvailable: false,
    version: 'GCC 13 (Coming Soon)',
    description: 'Native compiled execution environment planned for a future release.',
  },
};

function getSupportedLanguages() {
  return Object.values(SUPPORTED_LANGUAGES).filter((l) => l.isAvailable);
}

function getAllLanguages() {
  return Object.values(SUPPORTED_LANGUAGES);
}

function getLanguageConfig(languageId) {
  return SUPPORTED_LANGUAGES[languageId.toLowerCase()] || null;
}

module.exports = {
  SUPPORTED_LANGUAGES,
  getSupportedLanguages,
  getAllLanguages,
  getLanguageConfig,
};
