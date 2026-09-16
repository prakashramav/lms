const { Problem } = require('../models/problem.model');
const { TestCase } = require('../models/testCase.model');
const { Submission } = require('../models/submission.model');

const seedPracticeProblems = async (studentUser, instructorUser) => {
  console.log('[Seed] Seeding coding practice problems...');

  // Clear existing practice collections
  await Promise.all([
    Problem.deleteMany({}),
    TestCase.deleteMany({}),
    Submission.deleteMany({}),
  ]);

  const problemsData = [
    // ==========================================
    // 10 JAVASCRIPT PROBLEMS
    // ==========================================
    {
      title: 'Two Sum',
      slug: 'two-sum',
      category: 'JAVASCRIPT',
      difficulty: 'EASY',
      topics: ['Arrays', 'Hash Map', 'Algorithms'],
      supportedLanguages: ['javascript'],
      description:
        'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      functionSignature: {
        name: 'twoSum',
        params: [
          { name: 'nums', type: 'number[]' },
          { name: 'target', type: 'number' },
        ],
        returnType: 'number[]',
      },
      inputFormat: 'twoSum(nums, target)',
      outputFormat: 'Array of two indices [i, j]',
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
      examples: [
        { input: '[2, 7, 11, 15], 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
        { input: '[3, 2, 4], 6', output: '[1, 2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
      ],
      starterCode: {
        javascript: 'function twoSum(nums, target) {\n  // Write your code here\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      },
      testCases: [
        { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false, order: 1, description: 'Sample Case 1' },
        { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false, order: 2, description: 'Sample Case 2' },
        { input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true, order: 3, description: 'Duplicates' },
        { input: '[-1, -2, -3, -4, -5], -8', expectedOutput: '[2, 4]', isHidden: true, order: 4, description: 'Negative numbers' },
      ],
    },
    {
      title: 'Valid Palindrome',
      slug: 'valid-palindrome',
      category: 'JAVASCRIPT',
      difficulty: 'EASY',
      topics: ['Strings', 'Two Pointers'],
      supportedLanguages: ['javascript'],
      description:
        'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
      functionSignature: {
        name: 'isPalindrome',
        params: [{ name: 's', type: 'string' }],
        returnType: 'boolean',
      },
      inputFormat: 'isPalindrome(s)',
      outputFormat: 'boolean true or false',
      constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
      examples: [
        { input: '"A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
        { input: '"race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' },
      ],
      starterCode: {
        javascript: 'function isPalindrome(s) {\n  // Write your code here\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return cleaned === cleaned.split("").reverse().join("");\n}',
      },
      testCases: [
        { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '"race a car"', expectedOutput: 'false', isHidden: false, order: 2 },
        { input: '" "', expectedOutput: 'true', isHidden: true, order: 3 },
        { input: '"0P"', expectedOutput: 'false', isHidden: true, order: 4 },
      ],
    },
    {
      title: 'Reverse String',
      slug: 'reverse-string',
      category: 'JAVASCRIPT',
      difficulty: 'EASY',
      topics: ['Strings', 'Algorithms'],
      supportedLanguages: ['javascript'],
      description: 'Write a function that reverses a given string `str` and returns the reversed result.',
      functionSignature: {
        name: 'reverseString',
        params: [{ name: 'str', type: 'string' }],
        returnType: 'string',
      },
      inputFormat: 'reverseString(str)',
      outputFormat: 'Reversed string',
      constraints: ['0 <= str.length <= 10^5'],
      examples: [
        { input: '"hello"', output: '"olleh"' },
        { input: '"Hannah"', output: '"hannaH"' },
      ],
      starterCode: {
        javascript: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
      },
      testCases: [
        { input: '"hello"', expectedOutput: '"olleh"', isHidden: false, order: 1 },
        { input: '"JavaScript"', expectedOutput: '"tpircSavaJ"', isHidden: false, order: 2 },
        { input: '""', expectedOutput: '""', isHidden: true, order: 3 },
        { input: '"a"', expectedOutput: '"a"', isHidden: true, order: 4 },
      ],
    },
    {
      title: 'FizzBuzz',
      slug: 'fizz-buzz',
      category: 'JAVASCRIPT',
      difficulty: 'EASY',
      topics: ['Math', 'Algorithms'],
      supportedLanguages: ['javascript'],
      description:
        'Given an integer `n`, return a string array `answer` (1-indexed) where:\n- `answer[i] == "FizzBuzz"` if `i` is divisible by 3 and 5.\n- `answer[i] == "Fizz"` if `i` is divisible by 3.\n- `answer[i] == "Buzz"` if `i` is divisible by 5.\n- `answer[i] == i` (as a string) if none of the above conditions are true.',
      functionSignature: {
        name: 'fizzBuzz',
        params: [{ name: 'n', type: 'number' }],
        returnType: 'string[]',
      },
      inputFormat: 'fizzBuzz(n)',
      outputFormat: 'Array of strings',
      constraints: ['1 <= n <= 10^4'],
      examples: [{ input: '5', output: '["1","2","Fizz","4","Buzz"]' }],
      starterCode: {
        javascript: 'function fizzBuzz(n) {\n  const res = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) res.push("FizzBuzz");\n    else if (i % 3 === 0) res.push("Fizz");\n    else if (i % 5 === 0) res.push("Buzz");\n    else res.push(String(i));\n  }\n  return res;\n}',
      },
      testCases: [
        { input: '3', expectedOutput: '["1","2","Fizz"]', isHidden: false, order: 1 },
        { input: '5', expectedOutput: '["1","2","Fizz","4","Buzz"]', isHidden: false, order: 2 },
        { input: '15', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'Flatten Nested Array',
      slug: 'flatten-nested-array',
      category: 'JAVASCRIPT',
      difficulty: 'MEDIUM',
      topics: ['Recursion', 'Arrays'],
      supportedLanguages: ['javascript'],
      description: 'Given a multi-dimensional array with arbitrary nesting depths, implement a function `flattenArray(arr)` that returns a completely flattened 1D array.',
      functionSignature: {
        name: 'flattenArray',
        params: [{ name: 'arr', type: 'any[]' }],
        returnType: 'any[]',
      },
      inputFormat: 'flattenArray(arr)',
      outputFormat: '1D array',
      constraints: ['0 <= array depth <= 50', '0 <= total elements <= 10^4'],
      examples: [{ input: '[1, [2, [3, [4]], 5]]', output: '[1, 2, 3, 4, 5]' }],
      starterCode: {
        javascript: 'function flattenArray(arr) {\n  const res = [];\n  function helper(sub) {\n    for (const item of sub) {\n      if (Array.isArray(item)) helper(item);\n      else res.push(item);\n    }\n  }\n  helper(arr);\n  return res;\n}',
      },
      testCases: [
        { input: '[1, [2, [3, [4]], 5]]', expectedOutput: '[1, 2, 3, 4, 5]', isHidden: false, order: 1 },
        { input: '[[1, 2], [3, 4]]', expectedOutput: '[1, 2, 3, 4]', isHidden: false, order: 2 },
        { input: '[]', expectedOutput: '[]', isHidden: true, order: 3 },
        { input: '[1, [2, [3, [4, [5]]]]]', expectedOutput: '[1, 2, 3, 4, 5]', isHidden: true, order: 4 },
      ],
    },
    {
      title: 'Debounce Function',
      slug: 'debounce-function',
      category: 'JAVASCRIPT',
      difficulty: 'MEDIUM',
      topics: ['Closures', 'Async', 'Functional Programming'],
      supportedLanguages: ['javascript'],
      description: 'Implement a function `debounce(fn, delay)` that returns a debounced version of `fn`. The original function must only be called after `delay` milliseconds have elapsed since the last invocation.',
      functionSignature: {
        name: 'debounce',
        params: [
          { name: 'fn', type: 'function' },
          { name: 'delay', type: 'number' },
        ],
        returnType: 'function',
      },
      inputFormat: 'debounce(fn, delay)',
      outputFormat: 'Debounced function',
      constraints: ['delay >= 0'],
      examples: [{ input: 'fn, 100', output: 'Debounced closure' }],
      starterCode: {
        javascript: 'function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}',
      },
      testCases: [
        { input: '1, 100', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '2, 50', expectedOutput: 'true', isHidden: true, order: 2 },
      ],
    },
    {
      title: 'Deep Clone Object',
      slug: 'deep-clone-object',
      category: 'JAVASCRIPT',
      difficulty: 'MEDIUM',
      topics: ['Objects', 'Recursion'],
      supportedLanguages: ['javascript'],
      description: 'Implement `deepClone(obj)` that produces a full, recursive copy of an object or array without mutating the original or maintaining nested object references.',
      functionSignature: {
        name: 'deepClone',
        params: [{ name: 'obj', type: 'any' }],
        returnType: 'any',
      },
      inputFormat: 'deepClone(obj)',
      outputFormat: 'Independent clone',
      constraints: ['Input contains primitive values, arrays, and plain objects.'],
      examples: [{ input: '{"a": 1, "b": {"c": 2}}', output: '{"a": 1, "b": {"c": 2}}' }],
      starterCode: {
        javascript: 'function deepClone(obj) {\n  if (obj === null || typeof obj !== "object") return obj;\n  if (Array.isArray(obj)) return obj.map(deepClone);\n  const copy = {};\n  for (const key of Object.keys(obj)) {\n    copy[key] = deepClone(obj[key]);\n  }\n  return copy;\n}',
      },
      testCases: [
        { input: '{"a": 1, "b": {"c": 2}}', expectedOutput: '{"a": 1, "b": {"c": 2}}', isHidden: false, order: 1 },
        { input: '[1, [2, 3], {"x": 10}]', expectedOutput: '[1, [2, 3], {"x": 10}]', isHidden: false, order: 2 },
        { input: '{"empty": {}}', expectedOutput: '{"empty": {}}', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      category: 'JAVASCRIPT',
      difficulty: 'EASY',
      topics: ['Stack', 'Strings'],
      supportedLanguages: ['javascript'],
      description:
        'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
      functionSignature: {
        name: 'isValid',
        params: [{ name: 's', type: 'string' }],
        returnType: 'boolean',
      },
      inputFormat: 'isValid(s)',
      outputFormat: 'boolean true or false',
      constraints: ['1 <= s.length <= 10^4'],
      examples: [
        { input: '"()"', output: 'true' },
        { input: '"()[]{}"', output: 'true' },
        { input: '"(]"', output: 'false' },
      ],
      starterCode: {
        javascript: 'function isValid(s) {\n  const stack = [];\n  const pairs = { ")": "(", "}": "{", "]": "[" };\n  for (const char of s) {\n    if (char === "(" || char === "{" || char === "[") {\n      stack.push(char);\n    } else {\n      if (stack.pop() !== pairs[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}',
      },
      testCases: [
        { input: '"()"', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '"()[]{}"', expectedOutput: 'true', isHidden: false, order: 2 },
        { input: '"(]"', expectedOutput: 'false', isHidden: false, order: 3 },
        { input: '"([)]"', expectedOutput: 'false', isHidden: true, order: 4 },
        { input: '"{[]}"', expectedOutput: 'true', isHidden: true, order: 5 },
      ],
    },
    {
      title: 'Memoize Function',
      slug: 'memoize-function',
      category: 'JAVASCRIPT',
      difficulty: 'MEDIUM',
      topics: ['Closures', 'Performance'],
      supportedLanguages: ['javascript'],
      description: 'Given a function `fn`, return a memoized version of that function that caches the results of previously computed calls using JSON serialization of arguments.',
      functionSignature: {
        name: 'memoize',
        params: [{ name: 'fn', type: 'function' }],
        returnType: 'function',
      },
      inputFormat: 'memoize(fn)',
      outputFormat: 'Memoized function',
      constraints: ['Arguments are serializable.'],
      examples: [{ input: 'fn = (a, b) => a + b', output: 'Cached calculation' }],
      starterCode: {
        javascript: 'function memoize(fn) {\n  const cache = new Map();\n  return function(...args) {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n}',
      },
      testCases: [
        { input: '(a, b) => a + b', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '(n) => n * 2', expectedOutput: 'true', isHidden: true, order: 2 },
      ],
    },
    {
      title: 'LRU Cache',
      slug: 'lru-cache',
      category: 'JAVASCRIPT',
      difficulty: 'HARD',
      topics: ['Hash Map', 'Doubly Linked List', 'Design'],
      supportedLanguages: ['javascript'],
      description:
        'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class with `get(key)` and `put(key, value)`. When the cache reaches its `capacity`, it should invalidate and evict the least recently used key.',
      functionSignature: {
        name: 'createLRU',
        params: [{ name: 'capacity', type: 'number' }],
        returnType: 'object',
      },
      inputFormat: 'createLRU(capacity)',
      outputFormat: 'LRU Cache instance',
      constraints: ['1 <= capacity <= 3000'],
      examples: [{ input: 'capacity = 2', output: 'LRU structure' }],
      starterCode: {
        javascript: 'function createLRU(capacity) {\n  const map = new Map();\n  return {\n    get(key) {\n      if (!map.has(key)) return -1;\n      const val = map.get(key);\n      map.delete(key);\n      map.set(key, val);\n      return val;\n    },\n    put(key, val) {\n      if (map.has(key)) map.delete(key);\n      else if (map.size >= capacity) map.delete(map.keys().next().value);\n      map.set(key, val);\n    }\n  };\n}',
      },
      testCases: [
        { input: '2', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '1', expectedOutput: 'true', isHidden: true, order: 2 },
      ],
    },

    // ==========================================
    // 6 HTML/CSS PROBLEMS
    // ==========================================
    {
      title: 'Responsive Card Component',
      slug: 'responsive-card-component',
      category: 'HTML_CSS',
      difficulty: 'EASY',
      topics: ['HTML5', 'CSS3', 'Layout'],
      supportedLanguages: ['html_css'],
      description:
        'Create a responsive product card component with:\n1. A container element with class `.card`\n2. A title element with class `.card-title` containing the text "Product Title"\n3. A body paragraph with class `.card-body`\n4. A button element with class `.card-btn`',
      inputFormat: 'HTML & CSS markup',
      outputFormat: 'DOM structure',
      constraints: ['Valid semantic HTML5.'],
      examples: [{ input: '<div class="card">...</div>', output: 'Structured Card' }],
      starterCode: {
        html_css: '<style>\n  .card {\n    border: 1px solid #e2e8f0;\n    border-radius: 8px;\n    padding: 16px;\n  }\n  .card-title { font-size: 1.25rem; font-weight: bold; }\n  .card-body { margin-top: 8px; color: #4b5563; }\n  .card-btn { margin-top: 12px; background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; }\n</style>\n<div class="card">\n  <h3 class="card-title">Product Title</h3>\n  <p class="card-body">High-performance developer platform designed for engineers.</p>\n  <button class="card-btn">Learn More</button>\n</div>',
      },
      testCases: [
        { input: '{"selector": ".card", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 1, description: 'Card container exists' },
        { input: '{"selector": ".card-title", "property": "textContent"}', expectedOutput: 'Product Title', isHidden: false, order: 2, description: 'Card title content' },
        { input: '{"selector": ".card-btn", "property": "exists"}', expectedOutput: 'true', isHidden: true, order: 3, description: 'Button element exists' },
      ],
    },
    {
      title: 'Flexbox Navigation Bar',
      slug: 'flexbox-navigation-bar',
      category: 'HTML_CSS',
      difficulty: 'EASY',
      topics: ['Flexbox', 'CSS', 'Navigation'],
      supportedLanguages: ['html_css'],
      description: 'Build a top navigation bar with class `.navbar` that uses flexbox to display logo `.brand` and 3 navigation links with class `.nav-item`.',
      inputFormat: 'HTML markup',
      outputFormat: 'DOM elements',
      constraints: ['Must contain 3 nav-item elements.'],
      examples: [{ input: '<nav class="navbar">...</nav>', output: 'Flex Nav' }],
      starterCode: {
        html_css: '<nav class="navbar" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 24px;">\n  <div class="brand">EdTech</div>\n  <div class="nav-links">\n    <a href="#" class="nav-item">Courses</a>\n    <a href="#" class="nav-item">Practice</a>\n    <a href="#" class="nav-item">Assessments</a>\n  </div>\n</nav>',
      },
      testCases: [
        { input: '{"selector": ".navbar", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '{"selector": ".brand", "property": "textContent"}', expectedOutput: 'EdTech', isHidden: false, order: 2 },
        { input: '{"selector": ".nav-item", "property": "count"}', expectedOutput: '3', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'Modal Dialog Box',
      slug: 'modal-dialog-box',
      category: 'HTML_CSS',
      difficulty: 'MEDIUM',
      topics: ['Accessibility', 'CSS Positioning'],
      supportedLanguages: ['html_css'],
      description: 'Construct an accessible modal overlay with `.modal-overlay`, a centered `.modal-content` card, and a `.modal-close` button.',
      inputFormat: 'HTML markup',
      outputFormat: 'DOM structure',
      constraints: ['Overlay and content classes present.'],
      examples: [{ input: '<div class="modal-overlay">...</div>', output: 'Modal' }],
      starterCode: {
        html_css: '<div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">\n  <div class="modal-content" style="background: white; padding: 24px; border-radius: 8px;">\n    <h2 class="modal-title">Confirm Action</h2>\n    <p>Are you sure you want to proceed?</p>\n    <button class="modal-close">Close</button>\n  </div>\n</div>',
      },
      testCases: [
        { input: '{"selector": ".modal-overlay", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '{"selector": ".modal-content", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 2 },
        { input: '{"selector": ".modal-close", "property": "textContent"}', expectedOutput: 'Close', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'CSS Grid Photo Gallery',
      slug: 'css-grid-photo-gallery',
      category: 'HTML_CSS',
      difficulty: 'MEDIUM',
      topics: ['CSS Grid', 'Responsive'],
      supportedLanguages: ['html_css'],
      description: 'Create a responsive photo grid gallery container with class `.grid-container` containing at least 4 `.grid-item` elements.',
      inputFormat: 'HTML markup',
      outputFormat: 'Grid structure',
      constraints: ['Minimum 4 grid items.'],
      examples: [{ input: '<div class="grid-container">...</div>', output: 'Grid' }],
      starterCode: {
        html_css: '<div class="grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">\n  <div class="grid-item">Item 1</div>\n  <div class="grid-item">Item 2</div>\n  <div class="grid-item">Item 3</div>\n  <div class="grid-item">Item 4</div>\n</div>',
      },
      testCases: [
        { input: '{"selector": ".grid-container", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '{"selector": ".grid-item", "property": "count"}', expectedOutput: '4', isHidden: false, order: 2 },
      ],
    },
    {
      title: 'Status Badge Component',
      slug: 'status-badge-component',
      category: 'HTML_CSS',
      difficulty: 'EASY',
      topics: ['CSS', 'Components'],
      supportedLanguages: ['html_css'],
      description: 'Design a reusable status badge element with classes `.badge` and `.badge-success` that contains the text "Active".',
      inputFormat: 'HTML markup',
      outputFormat: 'DOM element',
      constraints: ['Badge class with success modifier.'],
      examples: [{ input: '<span class="badge badge-success">Active</span>', output: 'Badge' }],
      starterCode: {
        html_css: '<span class="badge badge-success" style="display: inline-block; padding: 4px 8px; border-radius: 9999px; background: #dcfce7; color: #166534; font-size: 12px;">Active</span>',
      },
      testCases: [
        { input: '{"selector": ".badge.badge-success", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '{"selector": ".badge", "property": "textContent"}', expectedOutput: 'Active', isHidden: true, order: 2 },
      ],
    },
    {
      title: 'Subscription Pricing Card',
      slug: 'subscription-pricing-card',
      category: 'HTML_CSS',
      difficulty: 'HARD',
      topics: ['CSS Grid', 'Typography', 'Responsive Design'],
      supportedLanguages: ['html_css'],
      description: 'Build a pricing table card with `.pricing-table`, a plan header `.plan-name` ("Pro Plan"), price tag `.price` ("$29/mo"), and `.feature-list`.',
      inputFormat: 'HTML markup',
      outputFormat: 'Pricing Card',
      constraints: ['Plan name and price classes.'],
      examples: [{ input: '<div class="pricing-table">...</div>', output: 'Pricing table' }],
      starterCode: {
        html_css: '<div class="pricing-table" style="border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; max-width: 320px;">\n  <h3 class="plan-name">Pro Plan</h3>\n  <div class="price">$29/mo</div>\n  <ul class="feature-list">\n    <li>Unlimited Code Runs</li>\n    <li>Certification Assessments</li>\n  </ul>\n</div>',
      },
      testCases: [
        { input: '{"selector": ".pricing-table", "property": "exists"}', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '{"selector": ".plan-name", "property": "textContent"}', expectedOutput: 'Pro Plan', isHidden: false, order: 2 },
        { input: '{"selector": ".price", "property": "textContent"}', expectedOutput: '$29/mo', isHidden: true, order: 3 },
      ],
    },

    // ==========================================
    // 6 REACT PROBLEMS
    // ==========================================
    {
      title: 'React Counter with Step',
      slug: 'react-counter-with-step',
      category: 'REACT',
      difficulty: 'EASY',
      topics: ['React', 'Hooks', 'State'],
      supportedLanguages: ['react'],
      description:
        'Create a React function component `Counter` that accepts a prop `initialCount` (default 0) and renders a `.count-value` element displaying the current count.',
      functionSignature: {
        name: 'Counter',
        params: [{ name: 'props', type: 'object' }],
        returnType: 'JSX.Element',
      },
      inputFormat: 'Counter({ initialCount })',
      outputFormat: 'Rendered DOM text',
      constraints: ['Must be a functional component with useState.'],
      examples: [{ input: '{ "initialCount": 5 }', output: '5' }],
      starterCode: {
        react: 'function Counter({ initialCount = 0 }) {\n  const [count, setCount] = React.useState(initialCount);\n  return (\n    <div className="counter">\n      <span className="count-value">{count}</span>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}',
      },
      testCases: [
        { input: '{"action": "render", "props": {"initialCount": 0}, "selector": ".count-value"}', expectedOutput: '0', isHidden: false, order: 1 },
        { input: '{"action": "render", "props": {"initialCount": 10}, "selector": ".count-value"}', expectedOutput: '10', isHidden: false, order: 2 },
        { input: '{"action": "render", "props": {"initialCount": -5}, "selector": ".count-value"}', expectedOutput: '-5', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'React Toggle Switch',
      slug: 'react-toggle-switch',
      category: 'REACT',
      difficulty: 'EASY',
      topics: ['React', 'State', 'UI'],
      supportedLanguages: ['react'],
      description: 'Build a `ToggleSwitch` component with an `initialState` prop (boolean). Render a `.toggle-label` showing "ON" when true or "OFF" when false.',
      functionSignature: {
        name: 'ToggleSwitch',
        params: [{ name: 'props', type: 'object' }],
        returnType: 'JSX.Element',
      },
      inputFormat: 'ToggleSwitch({ initialState })',
      outputFormat: 'DOM label',
      constraints: ['Uses useState hook.'],
      examples: [{ input: '{ "initialState": true }', output: 'ON' }],
      starterCode: {
        react: 'function ToggleSwitch({ initialState = false }) {\n  const [isOn, setIsOn] = React.useState(initialState);\n  return (\n    <div className="switch">\n      <span className="toggle-label">{isOn ? "ON" : "OFF"}</span>\n    </div>\n  );\n}',
      },
      testCases: [
        { input: '{"action": "render", "props": {"initialState": true}, "selector": ".toggle-label"}', expectedOutput: 'ON', isHidden: false, order: 1 },
        { input: '{"action": "render", "props": {"initialState": false}, "selector": ".toggle-label"}', expectedOutput: 'OFF', isHidden: false, order: 2 },
      ],
    },
    {
      title: 'React Search Filter List',
      slug: 'react-search-filter-list',
      category: 'REACT',
      difficulty: 'MEDIUM',
      topics: ['React', 'Filters', 'Arrays'],
      supportedLanguages: ['react'],
      description: 'Create a component `SearchFilter` that accepts an array of `items` and a `query` string prop, and renders the count of matching items in `.match-count`.',
      functionSignature: {
        name: 'SearchFilter',
        params: [{ name: 'props', type: 'object' }],
        returnType: 'JSX.Element',
      },
      inputFormat: 'SearchFilter({ items, query })',
      outputFormat: 'Match count string',
      constraints: ['Case-insensitive search matching.'],
      examples: [{ input: '{ "items": ["React", "Node", "Next"], "query": "re" }', output: '1' }],
      starterCode: {
        react: 'function SearchFilter({ items = [], query = "" }) {\n  const filtered = items.filter(i => i.toLowerCase().includes(query.toLowerCase()));\n  return (\n    <div>\n      <span className="match-count">{filtered.length}</span>\n    </div>\n  );\n}',
      },
      testCases: [
        { input: '{"action": "render", "props": {"items": ["React", "Next", "Node"], "query": "re"}, "selector": ".match-count"}', expectedOutput: '1', isHidden: false, order: 1 },
        { input: '{"action": "render", "props": {"items": ["Apple", "Apricot", "Banana"], "query": "ap"}, "selector": ".match-count"}', expectedOutput: '2', isHidden: false, order: 2 },
        { input: '{"action": "render", "props": {"items": ["A", "B", "C"], "query": "z"}, "selector": ".match-count"}', expectedOutput: '0', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'React Accordion Item',
      slug: 'react-accordion-item',
      category: 'REACT',
      difficulty: 'MEDIUM',
      topics: ['React', 'Components', 'Accessibility'],
      supportedLanguages: ['react'],
      description: 'Implement `AccordionItem` with props `title` and `isOpen` (boolean). When `isOpen` is true, render a `.content` container with the text "Expanded".',
      functionSignature: {
        name: 'AccordionItem',
        params: [{ name: 'props', type: 'object' }],
        returnType: 'JSX.Element',
      },
      inputFormat: 'AccordionItem({ title, isOpen })',
      outputFormat: 'Accordion DOM',
      constraints: ['Conditional rendering.'],
      examples: [{ input: '{ "title": "Overview", "isOpen": true }', output: 'Expanded' }],
      starterCode: {
        react: 'function AccordionItem({ title, isOpen = false }) {\n  return (\n    <div className="accordion">\n      <h4 className="title">{title}</h4>\n      {isOpen && <div className="content">Expanded</div>}\n    </div>\n  );\n}',
      },
      testCases: [
        { input: '{"action": "render", "props": {"title": "FAQ", "isOpen": true}, "selector": ".content"}', expectedOutput: 'Expanded', isHidden: false, order: 1 },
        { input: '{"action": "render", "props": {"title": "FAQ", "isOpen": false}, "selector": ".content"}', expectedOutput: 'null', isHidden: true, order: 2 },
      ],
    },
    {
      title: 'React Star Rating Component',
      slug: 'react-star-rating-component',
      category: 'REACT',
      difficulty: 'MEDIUM',
      topics: ['React', 'Props', 'UI'],
      supportedLanguages: ['react'],
      description: 'Create a `StarRating` component accepting `rating` (integer 1-5). Display the text in `.rating-text` in the format "Rating: X / 5".',
      functionSignature: {
        name: 'StarRating',
        params: [{ name: 'props', type: 'object' }],
        returnType: 'JSX.Element',
      },
      inputFormat: 'StarRating({ rating })',
      outputFormat: 'Rating text',
      constraints: ['1 <= rating <= 5'],
      examples: [{ input: '{ "rating": 4 }', output: 'Rating: 4 / 5' }],
      starterCode: {
        react: 'function StarRating({ rating = 5 }) {\n  return (\n    <div className="stars">\n      <span className="rating-text">Rating: {rating} / 5</span>\n    </div>\n  );\n}',
      },
      testCases: [
        { input: '{"action": "render", "props": {"rating": 5}, "selector": ".rating-text"}', expectedOutput: 'Rating: 5 / 5', isHidden: false, order: 1 },
        { input: '{"action": "render", "props": {"rating": 3}, "selector": ".rating-text"}', expectedOutput: 'Rating: 3 / 5', isHidden: false, order: 2 },
        { input: '{"action": "render", "props": {"rating": 1}, "selector": ".rating-text"}', expectedOutput: 'Rating: 1 / 5', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'React Stopwatch Display',
      slug: 'react-stopwatch-display',
      category: 'REACT',
      difficulty: 'HARD',
      topics: ['React', 'Effects', 'Timers'],
      supportedLanguages: ['react'],
      description: 'Build a `Stopwatch` component that accepts `seconds` and renders the formatted time in `.time-display` formatted as "MM:SS".',
      functionSignature: {
        name: 'Stopwatch',
        params: [{ name: 'props', type: 'object' }],
        returnType: 'JSX.Element',
      },
      inputFormat: 'Stopwatch({ seconds })',
      outputFormat: 'MM:SS string',
      constraints: ['seconds >= 0'],
      examples: [{ input: '{ "seconds": 65 }', output: '01:05' }],
      starterCode: {
        react: 'function Stopwatch({ seconds = 0 }) {\n  const m = String(Math.floor(seconds / 60)).padStart(2, "0");\n  const s = String(seconds % 60).padStart(2, "0");\n  return <div className="time-display">{m}:{s}</div>;\n}',
      },
      testCases: [
        { input: '{"action": "render", "props": {"seconds": 65}, "selector": ".time-display"}', expectedOutput: '01:05', isHidden: false, order: 1 },
        { input: '{"action": "render", "props": {"seconds": 0}, "selector": ".time-display"}', expectedOutput: '00:00', isHidden: false, order: 2 },
        { input: '{"action": "render", "props": {"seconds": 360}, "selector": ".time-display"}', expectedOutput: '06:00', isHidden: true, order: 3 },
      ],
    },

    // ==========================================
    // 4 NODE.JS PROBLEMS
    // ==========================================
    {
      title: 'Node.js Line Counter Stream',
      slug: 'node-line-counter-stream',
      category: 'NODE',
      difficulty: 'EASY',
      topics: ['Node.js', 'Strings', 'Streams'],
      supportedLanguages: ['node', 'javascript'],
      description: 'Implement a function `countLines(text)` that counts the number of non-empty lines in a given multi-line text string.',
      functionSignature: {
        name: 'countLines',
        params: [{ name: 'text', type: 'string' }],
        returnType: 'number',
      },
      inputFormat: 'countLines(text)',
      outputFormat: 'number of lines',
      constraints: ['Handles \\n and \\r\\n newlines.'],
      examples: [{ input: '"line 1\\nline 2\\nline 3"', output: '3' }],
      starterCode: {
        node: 'function countLines(text) {\n  if (!text) return 0;\n  const lines = text.split(/\\r?\\n/).filter(l => l.trim().length > 0);\n  return lines.length;\n}',
      },
      testCases: [
        { input: '"line 1\\nline 2\\nline 3"', expectedOutput: '3', isHidden: false, order: 1 },
        { input: '"hello\\n\\nworld"', expectedOutput: '2', isHidden: false, order: 2 },
        { input: '""', expectedOutput: '0', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'Node.js JSON Config Validator',
      slug: 'node-json-config-validator',
      category: 'NODE',
      difficulty: 'MEDIUM',
      topics: ['Node.js', 'Validation', 'JSON'],
      supportedLanguages: ['node', 'javascript'],
      description: 'Implement `validateConfig(jsonString)` that checks if a JSON string contains required fields: `port` (number) and `host` (string). Return `true` if valid, `false` otherwise.',
      functionSignature: {
        name: 'validateConfig',
        params: [{ name: 'jsonString', type: 'string' }],
        returnType: 'boolean',
      },
      inputFormat: 'validateConfig(jsonString)',
      outputFormat: 'boolean true or false',
      constraints: ['Safely catch JSON parse errors.'],
      examples: [{ input: '\'{"port": 5000, "host": "localhost"}\'', output: 'true' }],
      starterCode: {
        node: 'function validateConfig(jsonString) {\n  try {\n    const parsed = JSON.parse(jsonString);\n    return typeof parsed.port === "number" && typeof parsed.host === "string";\n  } catch {\n    return false;\n  }\n}',
      },
      testCases: [
        { input: '\'{"port": 5000, "host": "localhost"}\'', expectedOutput: 'true', isHidden: false, order: 1 },
        { input: '\'{"port": "5000"}\'', expectedOutput: 'false', isHidden: false, order: 2 },
        { input: '\'invalid-json\'', expectedOutput: 'false', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'Node.js CLI Argument Parser',
      slug: 'node-cli-argument-parser',
      category: 'NODE',
      difficulty: 'MEDIUM',
      topics: ['CLI', 'Parsing', 'Node.js'],
      supportedLanguages: ['node', 'javascript'],
      description: 'Implement `parseArgs(argsArray)` that parses an array of CLI flags (e.g. `["--port=8080", "--env=prod"]`) into an object `{ port: "8080", env: "prod" }`.',
      functionSignature: {
        name: 'parseArgs',
        params: [{ name: 'argsArray', type: 'string[]' }],
        returnType: 'object',
      },
      inputFormat: 'parseArgs(argsArray)',
      outputFormat: 'Object of key-value arguments',
      constraints: ['Flags start with --'],
      examples: [{ input: '["--port=8080", "--host=0.0.0.0"]', output: '{"port":"8080","host":"0.0.0.0"}' }],
      starterCode: {
        node: 'function parseArgs(argsArray) {\n  const result = {};\n  for (const arg of argsArray) {\n    if (arg.startsWith("--") && arg.includes("=")) {\n      const [key, val] = arg.slice(2).split("=");\n      result[key] = val;\n    }\n  }\n  return result;\n}',
      },
      testCases: [
        { input: '["--port=8080", "--host=0.0.0.0"]', expectedOutput: '{"port":"8080","host":"0.0.0.0"}', isHidden: false, order: 1 },
        { input: '["--debug=true"]', expectedOutput: '{"debug":"true"}', isHidden: false, order: 2 },
        { input: '[]', expectedOutput: '{}', isHidden: true, order: 3 },
      ],
    },
    {
      title: 'Node.js Path Normalizer',
      slug: 'node-path-normalizer',
      category: 'NODE',
      difficulty: 'HARD',
      topics: ['Path', 'Algorithms', 'Node.js'],
      supportedLanguages: ['node', 'javascript'],
      description: 'Implement `normalizePath(pathStr)` that resolves relative path segments `.` and `..` into a clean canonical POSIX path starting with `/`.',
      functionSignature: {
        name: 'normalizePath',
        params: [{ name: 'pathStr', type: 'string' }],
        returnType: 'string',
      },
      inputFormat: 'normalizePath(pathStr)',
      outputFormat: 'Canonical path string',
      constraints: ['No trailing slashes unless root.'],
      examples: [{ input: '"/a/./b/../../c/"', output: '"/c"' }],
      starterCode: {
        node: 'function normalizePath(pathStr) {\n  const parts = pathStr.split("/").filter(p => p !== "" && p !== ".");\n  const stack = [];\n  for (const part of parts) {\n    if (part === "..") {\n      if (stack.length > 0) stack.pop();\n    } else {\n      stack.push(part);\n    }\n  }\n  return "/" + stack.join("/");\n}',
      },
      testCases: [
        { input: '"/a/./b/../../c/"', expectedOutput: '"/c"', isHidden: false, order: 1 },
        { input: '"/home//foo/"', expectedOutput: '"/home/foo"', isHidden: false, order: 2 },
        { input: '"/../"', expectedOutput: '"/"', isHidden: true, order: 3 },
      ],
    },

    // ==========================================
    // 4 EXPRESS.JS PROBLEMS
    // ==========================================
    {
      title: 'Express Health Check Endpoint',
      slug: 'express-health-check-endpoint',
      category: 'EXPRESS',
      difficulty: 'EASY',
      topics: ['Express.js', 'REST API', 'HTTP'],
      supportedLanguages: ['express', 'javascript'],
      description: 'Configure an Express application instance `app` that responds to `GET /api/health` with HTTP status 200 and JSON body `{"status":"healthy","uptime":100}`.',
      inputFormat: 'GET /api/health',
      outputFormat: 'JSON body',
      constraints: ['Status 200 and JSON response.'],
      examples: [{ input: 'GET /api/health', output: '{"status":"healthy","uptime":100}' }],
      starterCode: {
        express: 'const app = express();\n\napp.get("/api/health", (req, res) => {\n  res.status(200).json({ status: "healthy", uptime: 100 });\n});',
      },
      testCases: [
        { input: '{"method": "GET", "url": "/api/health"}', expectedOutput: '{"status":"healthy","uptime":100}', isHidden: false, order: 1 },
        { input: '{"method": "GET", "url": "/unknown"}', expectedOutput: '{"error":"Not Found"}', isHidden: true, order: 2 },
      ],
    },
    {
      title: 'Express User API Routes',
      slug: 'express-user-api-routes',
      category: 'EXPRESS',
      difficulty: 'MEDIUM',
      topics: ['Express.js', 'CRUD', 'Routing'],
      supportedLanguages: ['express', 'javascript'],
      description: 'Implement `GET /api/users` returning status 200 and JSON `[{"id":1,"name":"Alice"}]`, and `POST /api/users` returning status 201 with `{ "success": true }`.',
      inputFormat: 'HTTP requests to /api/users',
      outputFormat: 'JSON responses',
      constraints: ['Correct HTTP status codes.'],
      examples: [{ input: 'GET /api/users', output: '[{"id":1,"name":"Alice"}]' }],
      starterCode: {
        express: 'const app = express();\n\napp.get("/api/users", (req, res) => {\n  res.status(200).json([{ id: 1, name: "Alice" }]);\n});\n\napp.post("/api/users", (req, res) => {\n  res.status(201).json({ success: true });\n});',
      },
      testCases: [
        { input: '{"method": "GET", "url": "/api/users"}', expectedOutput: '[{"id":1,"name":"Alice"}]', isHidden: false, order: 1 },
        { input: '{"method": "POST", "url": "/api/users"}', expectedOutput: '{"success":true}', isHidden: false, order: 2 },
      ],
    },
    {
      title: 'Express Bearer Token Validator',
      slug: 'express-bearer-token-validator',
      category: 'EXPRESS',
      difficulty: 'MEDIUM',
      topics: ['Middleware', 'Auth', 'Express.js'],
      supportedLanguages: ['express', 'javascript'],
      description: 'Implement route `GET /api/secure` requiring header `authorization: "Bearer secret123"`. Return 200 `{ "authorized": true }` if present, else 401 `{ "error": "Unauthorized" }`.',
      inputFormat: 'GET /api/secure with auth header',
      outputFormat: 'Auth validation response',
      constraints: ['Checks req.headers.authorization.'],
      examples: [{ input: 'Bearer token', output: '{"authorized":true}' }],
      starterCode: {
        express: 'const app = express();\n\napp.get("/api/secure", (req, res) => {\n  if (req.headers.authorization === "Bearer secret123") {\n    res.status(200).json({ authorized: true });\n  } else {\n    res.status(401).json({ error: "Unauthorized" });\n  }\n});',
      },
      testCases: [
        { input: '{"method": "GET", "url": "/api/secure", "headers": {"authorization": "Bearer secret123"}}', expectedOutput: '{"authorized":true}', isHidden: false, order: 1 },
        { input: '{"method": "GET", "url": "/api/secure", "headers": {}}', expectedOutput: '{"error":"Unauthorized"}', isHidden: true, order: 2 },
      ],
    },
    {
      title: 'Express Error Handling Middleware',
      slug: 'express-error-handling-middleware',
      category: 'EXPRESS',
      difficulty: 'HARD',
      topics: ['Error Handling', 'Middleware', 'Express.js'],
      supportedLanguages: ['express', 'javascript'],
      description: 'Create route `GET /api/error` that catches an exception and returns HTTP status 500 with JSON `{ "error": "Internal Server Error" }`.',
      inputFormat: 'GET /api/error',
      outputFormat: 'Status 500 JSON',
      constraints: ['Catches error and responds with status 500.'],
      examples: [{ input: 'GET /api/error', output: '{"error":"Internal Server Error"}' }],
      starterCode: {
        express: 'const app = express();\n\napp.get("/api/error", (req, res) => {\n  res.status(500).json({ error: "Internal Server Error" });\n});',
      },
      testCases: [
        { input: '{"method": "GET", "url": "/api/error"}', expectedOutput: '{"error":"Internal Server Error"}', isHidden: false, order: 1 },
      ],
    },
  ];

  let totalTestCasesCount = 0;
  for (const probData of problemsData) {
    const { testCases, ...probFields } = probData;

    const problem = await Problem.create({
      ...probFields,
      createdBy: instructorUser._id,
      isPublished: true,
      totalSubmissions: 5,
      acceptedSubmissions: 4,
    });

    if (testCases && testCases.length > 0) {
      const tcDocs = testCases.map((tc, idx) => ({
        problemId: problem._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden || false,
        order: tc.order || idx + 1,
        description: tc.description || `Test case ${idx + 1}`,
      }));
      await TestCase.insertMany(tcDocs);
      totalTestCasesCount += tcDocs.length;
    }
  }

  // Create a demo accepted submission for studentUser on Two Sum
  const twoSumProblem = await Problem.findOne({ slug: 'two-sum' });
  if (twoSumProblem && studentUser) {
    await Submission.create({
      studentId: studentUser._id,
      problemId: twoSumProblem._id,
      language: 'javascript',
      code: twoSumProblem.starterCode.get('javascript') || 'function twoSum() {}',
      status: 'COMPLETED',
      verdict: 'ACCEPTED',
      score: 100,
      passedTests: 4,
      totalTests: 4,
      executionTime: 12.4,
      memoryUsed: 14500,
      testResults: [
        { passed: true, isHidden: false, executionTime: 3.1 },
        { passed: true, isHidden: false, executionTime: 2.8 },
        { passed: true, isHidden: true, executionTime: 3.2 },
        { passed: true, isHidden: true, executionTime: 3.3 },
      ],
      submittedAt: new Date(),
    });
  }

  console.log(`[Seed] Seeded ${problemsData.length} coding practice problems with ${totalTestCasesCount} test cases.`);
};

module.exports = { seedPracticeProblems };
