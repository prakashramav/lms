'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Bot,
  Plus,
  Trash2,
  Eye,
  FileCode,
  Lock,
  EyeOff,
  CheckCircle2,
  Shield,
  Save,
  Play,
  RotateCcw,
  ExternalLink,
  HelpCircle,
  X,
} from 'lucide-react';

const ENVIRONMENT_TYPES = [
  { id: 'NONE', label: 'None', desc: 'No coding environment attached' },
  { id: 'CODE_RUNNER', label: 'Code Runner', desc: 'Lightweight runner for Python/Java/JS/C++ DSA exercises' },
  { id: 'CLOUD_IDE', label: 'Cloud IDE', desc: 'Fullstack project workspace with terminal, dev server & live preview' },
  { id: 'DATABASE_LAB', label: 'Database Lab', desc: 'Relational & NoSQL sandboxes with pre-seeded datasets' },
  { id: 'DATA_SCIENCE_LAB', label: 'Data Science Lab', desc: 'Python, Pandas, NumPy, Scikit-learn & JupyterLab' },
  { id: 'DEEP_LEARNING_LAB', label: 'Deep Learning Lab', desc: 'PyTorch, TensorFlow, CUDA & GPU scheduling' },
  { id: 'GENAI_LAB', label: 'GenAI / Agentic Lab', desc: 'LLM orchestration, RAG & Agents via protected AI Gateway' },
];

const TECHNOLOGIES_BY_ENV = {
  CLOUD_IDE: [
    { id: 'react', name: 'React 18 (Vite)', runtime: 'Node 22', previewPort: 5173 },
    { id: 'nextjs', name: 'Next.js 14 (App Router)', runtime: 'Node 22', previewPort: 3000 },
    { id: 'node-express', name: 'Node.js + Express.js API', runtime: 'Node 22', previewPort: 3000 },
    { id: 'fastapi', name: 'FastAPI (Python 3.12)', runtime: 'Python 3.12', previewPort: 8000 },
    { id: 'springboot', name: 'Spring Boot (Java 21)', runtime: 'Java 21', previewPort: 8080 },
    { id: 'django', name: 'Django (Python 3.12)', runtime: 'Python 3.12', previewPort: 8000 },
    { id: 'angular', name: 'Angular v18', runtime: 'Node 22', previewPort: 4200 },
    { id: 'vue', name: 'Vue 3 (Vite)', runtime: 'Node 22', previewPort: 5173 },
  ],
  DATABASE_LAB: [
    { id: 'sql-postgresql', name: 'PostgreSQL 16 & Relational SQL', runtime: 'PostgreSQL', previewPort: null },
    { id: 'mongodb', name: 'MongoDB 7 Aggregation Lab', runtime: 'MongoDB', previewPort: null },
    { id: 'redis', name: 'Redis 7.2 In-Memory Caching', runtime: 'Redis', previewPort: null },
  ],
  DATA_SCIENCE_LAB: [
    { id: 'ml', name: 'Scikit-learn, Pandas & JupyterLab', runtime: 'Python 3.11', previewPort: 8888 },
  ],
  DEEP_LEARNING_LAB: [
    { id: 'deep-learning', name: 'PyTorch 2.4 & TensorFlow (GPU/CPU)', runtime: 'Python 3.11 + CUDA', previewPort: 8888 },
  ],
  GENAI_LAB: [
    { id: 'genai', name: 'GenAI & RAG Applications (LangChain)', runtime: 'Python 3.11', previewPort: 8000 },
    { id: 'agentic-ai', name: 'Agentic AI & Multi-Agent Systems', runtime: 'Python 3.11', previewPort: null },
  ],
  CODE_RUNNER: [
    { id: 'javascript', name: 'JavaScript (Node.js)', runtime: 'Node 22', previewPort: null },
    { id: 'python', name: 'Python 3', runtime: 'Python 3.12', previewPort: null },
    { id: 'java', name: 'Java 21', runtime: 'Java 21', previewPort: null },
    { id: 'cpp', name: 'C++ 20', runtime: 'GCC 13', previewPort: null },
  ],
};

export default function InstructorWorkspaceBuilder({
  lessonId,
  courseId,
  initialWorkspace = null,
  accessToken,
  onSave,
}) {
  const [enabled, setEnabled] = useState(initialWorkspace?.enabled || false);
  const [envType, setEnvType] = useState(initialWorkspace?.type || 'CLOUD_IDE');
  const [templateId, setTemplateId] = useState(initialWorkspace?.templateId || 'react');
  const [hardware, setHardware] = useState(initialWorkspace?.hardware || 'cpu');
  const [resourceProfile, setResourceProfile] = useState(initialWorkspace?.resourceProfile || 'STANDARD');

  // Starter Files state
  const [starterFiles, setStarterFiles] = useState(
    initialWorkspace?.starterFiles && initialWorkspace.starterFiles.length > 0
      ? initialWorkspace.starterFiles
      : [
          {
            path: 'src/App.jsx',
            permission: 'editable',
            content: '// Student implementation starter code\nexport default function App() {\n  return <div>Welcome to the assignment!</div>;\n}',
          },
          {
            path: 'README.md',
            permission: 'readonly',
            content: '# Project Assignment\nFollow the instructions in the course notes to complete the implementation.',
          },
          {
            path: 'tests/evaluation.test.js',
            permission: 'hidden',
            content: '// Hidden automated test suite\ndescribe("Evaluation", () => {\n  it("verifies component output", () => {});\n});',
          },
        ]
  );

  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Test Suite state
  const [tests, setTests] = useState(
    initialWorkspace?.tests && initialWorkspace.tests.length > 0
      ? initialWorkspace.tests
      : [
          {
            name: 'Basic Component Render',
            description: 'Ensure component exports without throwing',
            type: 'UNIT',
            isHidden: false,
            expected: 'passed',
          },
          {
            name: 'State Verification Logic',
            description: 'Verify state mutation and event handling',
            type: 'UNIT',
            isHidden: true,
            expected: 'passed',
          },
        ]
  );

  // Preview as Student modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewWorkspace, setPreviewWorkspace] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Available technologies for active environment
  const availableTechs = TECHNOLOGIES_BY_ENV[envType] || [];

  useEffect(() => {
    if (availableTechs.length > 0 && !availableTechs.some((t) => t.id === templateId)) {
      setTemplateId(availableTechs[0].id);
    }
  }, [envType]);

  // Add new starter file
  const handleAddFile = () => {
    const newPath = prompt('Enter relative file path (e.g. src/components/Button.jsx):');
    if (!newPath) return;
    const newFile = {
      path: newPath.trim(),
      permission: 'editable',
      content: '// Starter template\n',
    };
    setStarterFiles((prev) => [...prev, newFile]);
    setActiveFileIndex(starterFiles.length);
  };

  const handleDeleteFile = (index) => {
    if (starterFiles.length <= 1) return;
    const updated = starterFiles.filter((_, i) => i !== index);
    setStarterFiles(updated);
    setActiveFileIndex(Math.max(0, index - 1));
  };

  // Add new test
  const handleAddTest = () => {
    setTests((prev) => [
      ...prev,
      {
        name: `Test Case ${prev.length + 1}`,
        description: 'Verify expected output',
        type: 'UNIT',
        isHidden: false,
        expected: 'passed',
      },
    ]);
  };

  const handleDeleteTest = (index) => {
    setTests((prev) => prev.filter((_, i) => i !== index));
  };

  // Save workspace configuration to lesson
  const handleSaveConfig = async () => {
    const payload = {
      enabled,
      type: envType,
      templateId,
      hardware,
      resourceProfile,
      starterFiles,
      tests,
      inactivityTimeoutMinutes: 30,
    };

    try {
      const res = await fetch(`/api/v1/instructor/lessons/${lessonId}/workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert('Learning workspace configuration saved successfully!');
        if (onSave) onSave(payload);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  // Launch "Preview as Student"
  const handlePreviewAsStudent = async () => {
    setIsPreviewLoading(true);
    setShowPreviewModal(true);

    try {
      const res = await fetch('/api/v1/instructor/workspaces/preview-as-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          lessonId,
          courseId,
          templateId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewWorkspace(data.data.workspace);
      } else {
        alert(`Failed to launch preview: ${data.message}`);
      }
    } catch (err) {
      alert(`Preview error: ${err.message}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const activeFile = starterFiles[activeFileIndex] || starterFiles[0];

  return (
    <div className="space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
      {/* 1. HEADER & ENABLEMENT TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Learning Environment & Cloud IDE Studio</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400 border border-teal-500/30">
              V2 Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure realistic project workspaces, starter files, file permissions, and automated hidden test evaluation suites for your learners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 relative"></div>
            <span className="text-xs font-bold text-white">
              {enabled ? 'Environment Enabled' : 'Disabled'}
            </span>
          </label>

          <button
            onClick={handlePreviewAsStudent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition"
            title="Experience the student workspace in an isolated sandbox clone"
          >
            <Eye className="w-3.5 h-3.5 text-teal-400" />
            <span>Preview as Student</span>
          </button>

          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Workspace</span>
          </button>
        </div>
      </div>

      {enabled && (
        <div className="space-y-8">
          {/* 2. ENVIRONMENT TYPE SELECTION */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Select Learning Environment Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ENVIRONMENT_TYPES.map((env) => {
                const isSelected = envType === env.id;
                return (
                  <div
                    key={env.id}
                    onClick={() => setEnvType(env.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition select-none flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{env.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{env.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. TECHNOLOGY & RUNTIME SELECTION */}
          {availableTechs.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Technology & Framework Capability
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {availableTechs.map((tech) => {
                  const isSelected = templateId === tech.id;
                  return (
                    <div
                      key={tech.id}
                      onClick={() => setTemplateId(tech.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-teal-600/15 border-teal-500 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{tech.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Runtime: {tech.runtime}</span>
                        {tech.previewPort && <span>• Port: {tech.previewPort}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. RESOURCE PROFILE & HARDWARE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Resource Allocation Profile
              </label>
              <select
                value={resourceProfile}
                onChange={(e) => setResourceProfile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="BASIC">BASIC (0.5 vCPU, 512MB RAM, 1GB Disk)</option>
                <option value="STANDARD">STANDARD (1.5 vCPU, 2GB RAM, 5GB Disk)</option>
                <option value="ML">ML (4 vCPU, 8GB RAM, 20GB Disk)</option>
                <option value="GPU">GPU (NVIDIA T4 / A10G, 16GB VRAM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hardware Accelerator
              </label>
              <select
                value={hardware}
                onChange={(e) => setHardware(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="cpu">Standard Cloud CPU</option>
                <option value="gpu">Dedicated GPU Worker (Queued)</option>
              </select>
            </div>
          </div>

          {/* 5. STARTER PROJECT FILES & PERMISSIONS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  3. Starter Project & File-Level Permissions
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Design starter code. Tag files as Student Editable, Read-Only, or Hidden from students.
                </p>
              </div>

              <button
                onClick={handleAddFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add File</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 rounded-2xl bg-slate-950 border border-slate-800 p-4">
              {/* File List */}
              <div className="space-y-1.5 lg:border-r lg:border-slate-800 lg:pr-4">
                {starterFiles.map((file, idx) => {
                  const isActive = idx === activeFileIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition select-none ${
                        isActive
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </div>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                          file.permission === 'editable'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : file.permission === 'readonly'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {file.permission}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* File Editor & Settings */}
              {activeFile && (
                <div className="lg:col-span-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{activeFile.path}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400 text-[11px]">Permission:</span>
                        <select
                          value={activeFile.permission}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStarterFiles((prev) =>
                              prev.map((f, i) => (i === activeFileIndex ? { ...f, permission: val } : f))
                            );
                          }}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                        >
                          <option value="editable">Student Editable</option>
                          <option value="readonly">Student Read-Only</option>
                          <option value="hidden">Hidden from Student</option>
                          <option value="instructor">Instructor Only</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleDeleteFile(activeFileIndex)}
                        className="p-1 rounded-lg hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={activeFile.content}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStarterFiles((prev) =>
                        prev.map((f, i) => (i === activeFileIndex ? { ...f, content: val } : f))
                      );
                    }}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
                    placeholder="Enter starter code..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* 6. AUTOMATED TEST SUITE BUILDER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  4. Automated Evaluation Tests (Visible & Hidden)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hidden tests evaluate student submissions secretly without revealing test inputs or code.
                </p>
              </div>

              <button
                onClick={handleAddTest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test</span>
              </button>
            </div>

            <div className="space-y-3">
              {tests.map((test, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={test.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTests((prev) =>
                            prev.map((t, i) => (i === idx ? { ...t, name: val } : t))
                          );
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
                      />

                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={test.isHidden}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setTests((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, isHidden: val } : t))
                            );
                          }}
                          className="rounded border-slate-700"
                        />
                        <span className={test.isHidden ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {test.isHidden ? 'Hidden Test (Quarantined)' : 'Visible to Student'}
                        </span>
                      </label>
                    </div>

                    <input
                      type="text"
                      value={test.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTests((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, description: val } : t))
                        );
                      }}
                      placeholder="Test description or requirement..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteTest(idx)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* "PREVIEW AS STUDENT" MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl h-[650px] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Student Experience Preview Mode</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Temporary Sandbox Clone (Master Protected)
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              {isPreviewLoading ? (
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Spinning up student sandbox environment...</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-md">
                  <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Isolated Preview Ready</h4>
                  <p className="text-xs text-slate-400">
                    Template: <strong className="text-white">{templateId}</strong> • Starter files deployed • Hidden tests quarantined.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    You can test the full student workflow: editing allowed files, running visible test cases, and viewing live preview output.
                  </p>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    Done Testing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
