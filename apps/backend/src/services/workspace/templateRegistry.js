/**
 * Workspace Template Registry
 * Central repository for all runtime capabilities, frameworks, default starter files,
 * preview ports, test commands, and resource configurations.
 */

const TEMPLATE_DEFINITIONS = {
  react: {
    id: 'react',
    name: 'React (Vite)',
    category: 'CLOUD_IDE',
    runtime: { language: 'javascript', version: 'node-22' },
    frameworks: ['react', 'vite'],
    tools: ['npm'],
    defaultCommand: 'npm run dev',
    previewPort: 5173,
    testCommand: 'npm test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Modern React 18 frontend environment powered by Vite and fast HMR.',
    icon: 'Atom',
    starterFiles: [
      {
        path: 'package.json',
        permission: 'readonly',
        content: JSON.stringify(
          {
            name: 'student-react-workspace',
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite --host 0.0.0.0 --port 5173',
              build: 'vite build',
              test: 'vitest run',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^0.475.0',
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.3.4',
              vite: '^5.4.14',
              vitest: '^2.1.8',
            },
          },
          null,
          2
        ),
      },
      {
        path: 'index.html',
        permission: 'readonly',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learning Workspace - React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      },
      {
        path: 'src/main.jsx',
        permission: 'readonly',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      {
        path: 'src/index.css',
        permission: 'editable',
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.card {
  background: #1e293b;
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid #334155;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  text-align: center;
  max-width: 480px;
}
button {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
button:hover {
  background: #0284c7;
}`,
      },
      {
        path: 'src/App.jsx',
        permission: 'editable',
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      <h2>Interactive React Workspace</h2>
      <p>Edit <code>src/App.jsx</code> to build and test your component.</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count is: {count}
      </button>
    </div>
  );
}`,
      },
      {
        path: 'tests/App.test.jsx',
        permission: 'hidden',
        content: `import { describe, it, expect } from 'vitest';
import React from 'react';
import App from '../src/App';

describe('React App Verification', () => {
  it('renders interactive workspace', () => {
    expect(App).toBeDefined();
  });
});`,
      },
      {
        path: 'README.md',
        permission: 'readonly',
        content: `# React Learning Environment
Welcome to your React workspace.
- Start dev server: \`npm run dev\`
- Run visible test suite: \`npm test\`
- Modify \`src/App.jsx\` to implement the assignment tasks.`,
      },
    ],
    defaultTests: [
      {
        name: 'Component Export Test',
        description: 'Verify App component is exported correctly',
        type: 'UNIT',
        isHidden: false,
        expected: 'function',
      },
      {
        name: 'Interactive State Verification',
        description: 'Ensure state update triggers correctly',
        type: 'UNIT',
        isHidden: true,
        expected: 'passed',
      },
    ],
  },

  nextjs: {
    id: 'nextjs',
    name: 'Next.js 14 (App Router)',
    category: 'CLOUD_IDE',
    runtime: { language: 'javascript', version: 'node-22' },
    frameworks: ['next', 'react'],
    tools: ['npm'],
    defaultCommand: 'npm run dev',
    previewPort: 3000,
    testCommand: 'npm test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Server Components, dynamic routes, and API endpoints with Next.js 14.',
    icon: 'Layers',
    starterFiles: [
      {
        path: 'package.json',
        permission: 'readonly',
        content: JSON.stringify(
          {
            name: 'student-nextjs-workspace',
            version: '1.0.0',
            scripts: {
              dev: 'next dev -p 3000',
              build: 'next build',
              start: 'next start',
              test: 'node test.js',
            },
            dependencies: {
              next: '14.2.24',
              react: '^18.3.1',
              'react-dom': '^18.3.1',
            },
          },
          null,
          2
        ),
      },
      {
        path: 'app/page.jsx',
        permission: 'editable',
        content: `export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Next.js Learning Workspace</h1>
      <p>Implement your server-rendered route or API integration here.</p>
    </main>
  );
}`,
      },
      {
        path: 'app/api/health/route.js',
        permission: 'editable',
        content: `export async function GET() {
  return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
}`,
      },
      {
        path: 'test.js',
        permission: 'hidden',
        content: `console.log('Next.js test validation executed successfully.');`,
      },
    ],
    defaultTests: [
      {
        name: 'Homepage Route Render',
        description: 'Verify page component compiles',
        type: 'BUILD',
        isHidden: false,
      },
      {
        name: 'API Route Response',
        description: 'Verify GET /api/health returns valid JSON',
        type: 'API',
        isHidden: true,
      },
    ],
  },

  'node-express': {
    id: 'node-express',
    name: 'Node.js + Express.js API',
    category: 'CLOUD_IDE',
    runtime: { language: 'javascript', version: 'node-22' },
    frameworks: ['express'],
    tools: ['npm'],
    defaultCommand: 'npm run dev',
    previewPort: 3000,
    testCommand: 'npm test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'RESTful API service with route handlers, middleware, and Jest tests.',
    icon: 'Server',
    starterFiles: [
      {
        path: 'package.json',
        permission: 'readonly',
        content: JSON.stringify(
          {
            name: 'student-express-workspace',
            version: '1.0.0',
            main: 'src/server.js',
            scripts: {
              dev: 'node src/server.js',
              test: 'node tests/runner.js',
            },
            dependencies: {
              express: '^4.21.2',
            },
          },
          null,
          2
        ),
      },
      {
        path: 'src/app.js',
        permission: 'editable',
        content: `const express = require('express');
const app = express();

app.use(express.json());

// In-memory data store for assignment
const items = [
  { id: 1, title: 'Learn Cloud IDE Architecture' },
  { id: 2, title: 'Build Express REST Endpoints' }
];

app.get('/api/items', (req, res) => {
  res.json({ success: true, count: items.length, data: items });
});

app.post('/api/items', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  const newItem = { id: items.length + 1, title };
  items.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});

module.exports = app;`,
      },
      {
        path: 'src/server.js',
        permission: 'readonly',
        content: `const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Express API server listening on http://0.0.0.0:\${PORT}\`);
});`,
      },
      {
        path: 'tests/runner.js',
        permission: 'hidden',
        content: `const app = require('../src/app');
console.log('Validating Express routes...');
if (!app) process.exit(1);
console.log('All Express tests passed.');`,
      },
      {
        path: 'README.md',
        permission: 'readonly',
        content: `# Node + Express Learning Lab
- Endpoints:
  - \`GET /api/items\` -> Returns list of items
  - \`POST /api/items\` -> Creates new item with \`{ title }\`
- Test with: \`npm test\``,
      },
    ],
    defaultTests: [
      {
        name: 'GET /api/items Status 200',
        description: 'Verify items endpoint returns 200 status and array',
        type: 'API',
        path: '/api/items',
        method: 'GET',
        expectedStatus: 200,
        isHidden: false,
      },
      {
        name: 'POST /api/items Validation',
        description: 'Verify missing title yields 400 Bad Request',
        type: 'API',
        path: '/api/items',
        method: 'POST',
        body: {},
        expectedStatus: 400,
        isHidden: true,
      },
    ],
  },

  fastapi: {
    id: 'fastapi',
    name: 'FastAPI (Python 3.12)',
    category: 'CLOUD_IDE',
    runtime: { language: 'python', version: '3.12' },
    frameworks: ['fastapi', 'uvicorn'],
    tools: ['pip'],
    defaultCommand: 'uvicorn main:app --host 0.0.0.0 --port 8000 --reload',
    previewPort: 8000,
    testCommand: 'pytest',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'High-performance Python API framework with type hints and OpenAPI docs.',
    icon: 'Zap',
    starterFiles: [
      {
        path: 'requirements.txt',
        permission: 'readonly',
        content: `fastapi>=0.115.0\nuvicorn>=0.32.0\npytest>=8.3.0\npydantic>=2.9.0`,
      },
      {
        path: 'main.py',
        permission: 'editable',
        content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Learning Workspace API")

class Task(BaseModel):
    id: Optional[int] = None
    title: str
    completed: bool = False

db: List[Task] = [
    Task(id=1, title="Understand Workspace Lifecycle", completed=True),
    Task(id=2, title="Complete FastAPI Exercise", completed=False)
]

@app.get("/")
def read_root():
    return {"message": "FastAPI Workspace Online"}

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return db

@app.post("/tasks", status_code=201, response_model=Task)
def create_task(task: Task):
    task.id = len(db) + 1
    db.append(task)
    return task`,
      },
      {
        path: 'test_main.py',
        permission: 'hidden',
        content: `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "FastAPI Workspace Online" in response.json()["message"]`,
      },
    ],
    defaultTests: [
      {
        name: 'Root Endpoint GET /',
        description: 'Verify root returns 200 with greeting',
        type: 'API',
        path: '/',
        method: 'GET',
        expectedStatus: 200,
        isHidden: false,
      },
      {
        name: 'Task Creation POST /tasks',
        description: 'Verify 201 Created and response contains ID',
        type: 'API',
        path: '/tasks',
        method: 'POST',
        expectedStatus: 201,
        isHidden: true,
      },
    ],
  },

  springboot: {
    id: 'springboot',
    name: 'Spring Boot (Java 21)',
    category: 'CLOUD_IDE',
    runtime: { language: 'java', version: '21' },
    frameworks: ['spring-boot'],
    tools: ['maven'],
    defaultCommand: 'mvn spring-boot:run',
    previewPort: 8080,
    testCommand: 'mvn test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Enterprise Java 21 development with Maven, Spring Web, and JUnit 5.',
    icon: 'Coffee',
    starterFiles: [
      {
        path: 'pom.xml',
        permission: 'readonly',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
        <relativePath/>
    </parent>
    <groupId>com.edtech.workspace</groupId>
    <artifactId>learning-app</artifactId>
    <version>1.0.0</version>
    <properties>
        <java.version>21</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>`,
      },
      {
        path: 'src/main/java/com/edtech/workspace/Application.java',
        permission: 'readonly',
        content: `package com.edtech.workspace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`,
      },
      {
        path: 'src/main/java/com/edtech/workspace/controller/HelloController.java',
        permission: 'editable',
        content: `package com.edtech.workspace.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return Map.of("service", "SpringBoot Workspace", "status", "UP");
    }
}`,
      },
      {
        path: 'src/test/java/com/edtech/workspace/ApplicationTests.java',
        permission: 'hidden',
        content: `package com.edtech.workspace;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTests {
    @Test
    void contextLoads() {}
}`,
      },
    ],
    defaultTests: [
      {
        name: 'Spring Context Load Test',
        description: 'Verify Spring application context boots cleanly',
        type: 'BUILD',
        isHidden: false,
      },
      {
        name: 'GET /api/status Endpoint',
        description: 'Verify REST endpoint returns status UP',
        type: 'API',
        path: '/api/status',
        method: 'GET',
        expectedStatus: 200,
        isHidden: true,
      },
    ],
  },

  django: {
    id: 'django',
    name: 'Django (Python 3.12)',
    category: 'CLOUD_IDE',
    runtime: { language: 'python', version: '3.12' },
    frameworks: ['django'],
    tools: ['pip'],
    defaultCommand: 'python manage.py runserver 0.0.0.0:8000',
    previewPort: 8000,
    testCommand: 'python manage.py test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Batteries-included web framework with ORM and MVC architecture.',
    icon: 'Globe',
    starterFiles: [
      {
        path: 'requirements.txt',
        permission: 'readonly',
        content: 'django>=5.1.0\ndjangorestframework>=3.15.0',
      },
      {
        path: 'manage.py',
        permission: 'readonly',
        content: `#!/usr/bin/env python\nimport os\nimport sys\n\ndef main():\n    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_project.settings')\n    from django.core.management import execute_from_command_line\n    execute_from_command_line(sys.argv)\n\nif __name__ == '__main__':\n    main()`,
      },
      {
        path: 'learning_app/views.py',
        permission: 'editable',
        content: `from django.http import JsonResponse\n\ndef index(request):\n    return JsonResponse({"status": "running", "platform": "Django Learning Workspace"})`,
      },
    ],
    defaultTests: [
      {
        name: 'Django View Test',
        description: 'Verify JSON response from index view',
        type: 'API',
        isHidden: false,
      },
    ],
  },

  angular: {
    id: 'angular',
    name: 'Angular (v18)',
    category: 'CLOUD_IDE',
    runtime: { language: 'javascript', version: 'node-22' },
    frameworks: ['angular'],
    tools: ['npm', 'ng'],
    defaultCommand: 'npm start',
    previewPort: 4200,
    testCommand: 'npm test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Enterprise Single Page Application framework with TypeScript.',
    icon: 'Shield',
    starterFiles: [
      {
        path: 'package.json',
        permission: 'readonly',
        content: JSON.stringify(
          {
            name: 'angular-workspace',
            version: '1.0.0',
            scripts: {
              start: 'ng serve --host 0.0.0.0 --port 4200',
              test: 'ng test --watch=false',
            },
            dependencies: {
              '@angular/core': '^18.0.0',
              '@angular/common': '^18.0.0',
            },
          },
          null,
          2
        ),
      },
      {
        path: 'src/app/app.component.ts',
        permission: 'editable',
        content: `export class AppComponent {\n  title = 'Angular Workspace';\n}`,
      },
    ],
    defaultTests: [
      {
        name: 'Angular Component Instantiation',
        description: 'Ensure root component mounts',
        type: 'UNIT',
        isHidden: false,
      },
    ],
  },

  vue: {
    id: 'vue',
    name: 'Vue 3 (Vite)',
    category: 'CLOUD_IDE',
    runtime: { language: 'javascript', version: 'node-22' },
    frameworks: ['vue', 'vite'],
    tools: ['npm'],
    defaultCommand: 'npm run dev',
    previewPort: 5173,
    testCommand: 'npm test',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Progressive JavaScript framework featuring Vue 3 Composition API.',
    icon: 'Compass',
    starterFiles: [
      {
        path: 'package.json',
        permission: 'readonly',
        content: JSON.stringify(
          {
            name: 'vue-workspace',
            version: '1.0.0',
            scripts: {
              dev: 'vite --host 0.0.0.0 --port 5173',
              test: 'vitest run',
            },
            dependencies: {
              vue: '^3.4.0',
            },
          },
          null,
          2
        ),
      },
      {
        path: 'src/App.vue',
        permission: 'editable',
        content: `<template>\n  <div class="card">\n    <h1>{{ message }}</h1>\n    <button @click="count++">Clicked {{ count }} times</button>\n  </div>\n</template>\n\n<script setup>\nimport { ref } from 'vue';\nconst message = ref('Vue 3 Learning Environment');\nconst count = ref(0);\n</script>`,
      },
    ],
    defaultTests: [
      {
        name: 'Vue Reactive State Test',
        description: 'Verify ref reactivity',
        type: 'UNIT',
        isHidden: false,
      },
    ],
  },

  'sql-postgresql': {
    id: 'sql-postgresql',
    name: 'SQL & PostgreSQL Lab',
    category: 'DATABASE_LAB',
    runtime: { language: 'sql', version: 'postgresql-16' },
    frameworks: ['postgresql'],
    tools: ['psql'],
    defaultCommand: 'query-runner',
    previewPort: null,
    testCommand: 'evaluate-queries',
    resourceProfile: 'BASIC',
    hardware: 'cpu',
    description: 'Relational database lab with pre-seeded datasets, schema editor, and query evaluator.',
    icon: 'Database',
    starterFiles: [
      {
        path: 'schema.sql',
        permission: 'readonly',
        content: `-- E-Commerce Sample Schema
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    city VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    order_date DATE DEFAULT CURRENT_DATE
);`,
      },
      {
        path: 'seed.sql',
        permission: 'readonly',
        content: `INSERT INTO customers (id, name, email, city) VALUES
(1, 'Alice Smith', 'alice@example.com', 'New York'),
(2, 'Bob Johnson', 'bob@example.com', 'San Francisco'),
(3, 'Charlie Brown', 'charlie@example.com', 'Chicago'),
(4, 'Diana Prince', 'diana@example.com', 'Seattle');

INSERT INTO orders (id, customer_id, total_amount, status, order_date) VALUES
(1, 1, 250.00, 'completed', '2026-01-15'),
(2, 1, 140.50, 'completed', '2026-02-10'),
(3, 2, 89.99, 'completed', '2026-02-14'),
(4, 3, 420.00, 'completed', '2026-03-01'),
(5, 4, 15.00, 'refunded', '2026-03-05');`,
      },
      {
        path: 'solution.sql',
        permission: 'editable',
        content: `-- Task: Write a query that returns total spend per customer
-- Columns: customer_name, total_spent
-- Order by total_spent DESC

SELECT 
    c.name AS customer_name,
    SUM(o.total_amount) AS total_spent
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.id, c.name
ORDER BY total_spent DESC;`,
      },
    ],
    defaultTests: [
      {
        name: 'Customer Aggregation Output Test',
        description: 'Verify query outputs customer_name and total_spent matching ground truth dataset',
        type: 'QUERY_MATCH',
        isHidden: false,
      },
      {
        name: 'Refunded Order Exclusion Test',
        description: 'Ensure refunded transactions are excluded from total calculation',
        type: 'QUERY_MATCH',
        isHidden: true,
      },
    ],
  },

  mongodb: {
    id: 'mongodb',
    name: 'MongoDB Aggregation Lab',
    category: 'DATABASE_LAB',
    runtime: { language: 'javascript', version: 'mongodb-7.0' },
    frameworks: ['mongodb'],
    tools: ['mongosh'],
    defaultCommand: 'run-aggregation',
    previewPort: null,
    testCommand: 'evaluate-pipeline',
    resourceProfile: 'BASIC',
    hardware: 'cpu',
    description: 'Document database lab with MQL aggregation pipelines and JSON datasets.',
    icon: 'Layers',
    starterFiles: [
      {
        path: 'dataset.json',
        permission: 'readonly',
        content: JSON.stringify(
          [
            { id: 1, title: 'Quantum Computing Fundamentals', category: 'Tech', price: 99, enrolled: 1200 },
            { id: 2, title: 'Modern React Architecture', category: 'Tech', price: 79, enrolled: 3500 },
            { id: 3, title: 'Strategic Product Management', category: 'Business', price: 129, enrolled: 800 },
            { id: 4, title: 'Fullstack Deep Learning', category: 'AI', price: 149, enrolled: 2100 },
          ],
          null,
          2
        ),
      },
      {
        path: 'pipeline.js',
        permission: 'editable',
        content: `// Task: Build aggregation pipeline returning total revenue by category
// e.g. [ { $group: { _id: "$category", totalRevenue: { $sum: { $multiply: ["$price", "$enrolled"] } } } } ]
[
  {
    $group: {
      _id: "$category",
      totalRevenue: { $sum: { $multiply: ["$price", "$enrolled"] } },
      courseCount: { $sum: 1 }
    }
  },
  { $sort: { totalRevenue: -1 } }
]`,
      },
    ],
    defaultTests: [
      {
        name: 'Category Revenue Aggregation',
        description: 'Verify group stage computes accurate total revenue',
        type: 'DATA_EVAL',
        isHidden: false,
      },
    ],
  },

  redis: {
    id: 'redis',
    name: 'Redis Caching & Data Structures',
    category: 'DATABASE_LAB',
    runtime: { language: 'redis', version: 'redis-7.2' },
    frameworks: ['redis'],
    tools: ['redis-cli'],
    defaultCommand: 'redis-commander',
    previewPort: null,
    testCommand: 'verify-keys',
    resourceProfile: 'BASIC',
    hardware: 'cpu',
    description: 'In-memory caching, rate-limiting counters, and Pub/Sub lab.',
    icon: 'Cpu',
    starterFiles: [
      {
        path: 'commands.redis',
        permission: 'editable',
        content: `SET user:1001:session "active_token_xyz" EX 3600\nHSET user:1001:profile name "Arjun" role "engineer"\nINCR page:views:homepage`,
      },
    ],
    defaultTests: [
      {
        name: 'TTL and Key Expiration',
        description: 'Verify key persistence and TTL bounds',
        type: 'KEY_VALUE_CHECK',
        isHidden: false,
      },
    ],
  },

  ml: {
    id: 'ml',
    name: 'Data Science & Machine Learning (Jupyter)',
    category: 'DATA_SCIENCE_LAB',
    runtime: { language: 'python', version: '3.11' },
    frameworks: ['jupyter', 'pandas', 'scikit-learn', 'numpy', 'matplotlib', 'seaborn'],
    tools: ['jupyter-lab', 'pip'],
    defaultCommand: 'jupyter lab --no-browser --ip=0.0.0.0 --port=8888',
    previewPort: 8888,
    testCommand: 'python evaluate.py',
    resourceProfile: 'ML',
    hardware: 'cpu',
    description: 'Data science lab featuring Pandas, NumPy, Scikit-learn, and interactive Jupyter notebooks.',
    icon: 'BarChart2',
    starterFiles: [
      {
        path: 'data/housing.csv',
        permission: 'readonly',
        content: `area,bedrooms,age,price
1200,2,10,250000
1500,3,5,320000
1800,3,8,380000
2400,4,3,510000
3000,5,2,650000
3500,5,1,720000`,
      },
      {
        path: 'notebook.ipynb',
        permission: 'editable',
        content: JSON.stringify(
          {
            cells: [
              {
                cell_type: 'markdown',
                metadata: {},
                source: ['# Machine Learning Housing Price Predictor\n', 'Train a linear regression model.'],
              },
              {
                cell_type: 'code',
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                  'import pandas as pd\n',
                  'from sklearn.linear_model import LinearRegression\n',
                  'df = pd.read_csv("data/housing.csv")\n',
                  'print(df.head())\n',
                ],
              },
            ],
            metadata: {
              language_info: { name: 'python' },
            },
            nbformat: 4,
            nbformat_minor: 2,
          },
          null,
          2
        ),
      },
      {
        path: 'model_trainer.py',
        permission: 'editable',
        content: `import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def train_model():
    df = pd.read_csv("data/housing.csv")
    X = df[['area', 'bedrooms', 'age']]
    y = df['price']
    model = LinearRegression()
    model.fit(X, y)
    return model

if __name__ == '__main__':
    model = train_model()
    test_pred = model.predict([[2000, 3, 5]])
    print(f"Predicted price for 2000sqft: \${test_pred[0]:.2f}")`,
      },
      {
        path: 'evaluate.py',
        permission: 'hidden',
        content: `from model_trainer import train_model
model = train_model()
pred = model.predict([[2000, 3, 5]])[0]
assert pred > 300000 and pred < 500000, "Model predictions fall outside realistic bounds"
print("Model evaluation passed with R2 validation.")`,
      },
    ],
    defaultTests: [
      {
        name: 'Model Convergence & R2 Score',
        description: 'Verify trained model achieves R2 score >= 0.85 on test split',
        type: 'METRIC',
        metric: 'r2_score',
        threshold: 0.85,
        isHidden: false,
      },
      {
        name: 'Out-of-Distribution Generalization',
        description: 'Verify predictions on unseen test vector',
        type: 'METRIC',
        isHidden: true,
      },
    ],
  },

  'deep-learning': {
    id: 'deep-learning',
    name: 'Deep Learning (PyTorch & TensorFlow)',
    category: 'DEEP_LEARNING_LAB',
    runtime: { language: 'python', version: '3.11' },
    frameworks: ['pytorch', 'torchvision', 'tensorflow', 'cuda'],
    tools: ['jupyter-lab', 'pip', 'nvidia-smi'],
    defaultCommand: 'jupyter lab --no-browser --ip=0.0.0.0 --port=8888',
    previewPort: 8888,
    testCommand: 'python eval_network.py',
    resourceProfile: 'GPU',
    hardware: 'gpu',
    description: 'Neural network training with PyTorch and optional GPU acceleration scheduling.',
    icon: 'Cpu',
    starterFiles: [
      {
        path: 'model.py',
        permission: 'editable',
        content: `import torch
import torch.nn as nn

class ClassifierNN(nn.Module):
    def __init__(self, input_dim=10, hidden_dim=32, num_classes=2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, x):
        return self.net(x)`,
      },
      {
        path: 'train.py',
        permission: 'editable',
        content: `import torch
from model import ClassifierNN

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Executing Deep Learning on hardware: {device}")

model = ClassifierNN().to(device)
print(model)`,
      },
    ],
    defaultTests: [
      {
        name: 'Network Architecture Forward Pass',
        description: 'Verify forward pass tensor dimensions',
        type: 'UNIT',
        isHidden: false,
      },
      {
        name: 'Validation Loss Threshold',
        description: 'Verify loss decreases below 0.3 within 5 epochs',
        type: 'METRIC',
        isHidden: true,
      },
    ],
  },

  genai: {
    id: 'genai',
    name: 'GenAI & RAG Applications',
    category: 'GENAI_LAB',
    runtime: { language: 'python', version: '3.11' },
    frameworks: ['langchain', 'llamaindex', 'chromadb'],
    tools: ['pip'],
    defaultCommand: 'python app.py',
    previewPort: 8000,
    testCommand: 'python test_rag.py',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'RAG pipelines, vector embeddings, and LLM orchestration using secure AI Gateway.',
    icon: 'Sparkles',
    starterFiles: [
      {
        path: 'documents/course_policy.txt',
        permission: 'readonly',
        content: `Course Policy:
Submissions are evaluated through visible and hidden test suites.
Students can request AI hints with rate limits of 30 queries per hour.
Workspaces auto-suspend after 30 minutes of inactivity.`,
      },
      {
        path: 'rag_service.py',
        permission: 'editable',
        content: `import os
import requests

AI_GATEWAY_URL = os.getenv("AI_GATEWAY_URL", "http://localhost:5000/api/v1/workspaces/ai-gateway")
WORKSPACE_TOKEN = os.getenv("WORKSPACE_TOKEN", "")

def query_llm_via_gateway(prompt: str, context: str):
    headers = {"Authorization": f"Bearer {WORKSPACE_TOKEN}"}
    payload = {
        "prompt": prompt,
        "systemInstruction": f"You are a strict RAG tutor. Ground your answer exclusively in this context: {context}"
    }
    response = requests.post(f"{AI_GATEWAY_URL}/chat", json=payload, headers=headers)
    return response.json().get("response")

if __name__ == '__main__':
    with open("documents/course_policy.txt") as f:
        doc = f.read()
    ans = query_llm_via_gateway("When does a workspace auto-suspend?", doc)
    print("RAG Result:", ans)`,
      },
    ],
    defaultTests: [
      {
        name: 'AI Gateway Connectivity',
        description: 'Verify student query routes cleanly through platform AI gateway without direct API keys',
        type: 'INTEGRATION',
        isHidden: false,
      },
      {
        name: 'Grounded Answer Accuracy',
        description: 'Verify RAG response accurately retrieves policy suspension time',
        type: 'EVAL',
        isHidden: true,
      },
    ],
  },

  'agentic-ai': {
    id: 'agentic-ai',
    name: 'Agentic AI & Multi-Agent Systems',
    category: 'GENAI_LAB',
    runtime: { language: 'python', version: '3.11' },
    frameworks: ['crewai', 'langgraph', 'langchain'],
    tools: ['pip'],
    defaultCommand: 'python agent_system.py',
    previewPort: null,
    testCommand: 'python test_agents.py',
    resourceProfile: 'STANDARD',
    hardware: 'cpu',
    description: 'Autonomous AI agents with tool-calling, goal planning, and multi-agent coordination.',
    icon: 'Bot',
    starterFiles: [
      {
        path: 'agent_system.py',
        permission: 'editable',
        content: `class SimpleAgent:
    def __init__(self, role, goal):
        self.role = role
        self.goal = goal

    def act(self, task):
        return f"Agent [{self.role}] fulfilled task: {task} to achieve {self.goal}"

if __name__ == '__main__':
    researcher = SimpleAgent("Researcher", "Collect relevant engineering specs")
    print(researcher.act("Analyze system bottleneck"))`,
      },
    ],
    defaultTests: [
      {
        name: 'Agent Goal Execution Test',
        description: 'Verify agent loop executes required action cycle',
        type: 'UNIT',
        isHidden: false,
      },
    ],
  },
};

class TemplateRegistry {
  constructor() {
    this.templates = new Map(Object.entries(TEMPLATE_DEFINITIONS));
  }

  getTemplate(templateId) {
    if (!templateId) return null;
    return this.templates.get(templateId.toLowerCase()) || null;
  }

  listTemplates(category = null) {
    const list = Array.from(this.templates.values());
    if (category) {
      return list.filter((t) => t.category === category);
    }
    return list;
  }

  registerCustomTemplate(templateId, templateData) {
    const id = templateId.toLowerCase().trim();
    this.templates.set(id, {
      ...templateData,
      id,
      isCustom: true,
    });
    return this.templates.get(id);
  }

  isValidTemplate(templateId) {
    return this.templates.has((templateId || '').toLowerCase().trim());
  }
}

const templateRegistry = new TemplateRegistry();

module.exports = {
  templateRegistry,
  TemplateRegistry,
  TEMPLATE_DEFINITIONS,
};
