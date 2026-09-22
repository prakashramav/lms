'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Terminal as TerminalIcon,
  Eye,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  Save,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Lock,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Database,
  Cpu,
  Smartphone,
  Tablet,
  Laptop,
  Layers,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

// Dynamically load Monaco Editor without SSR
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function WorkspaceIDE({
  workspaceId: initialWorkspaceId,
  courseId,
  lessonId,
  assignmentId,
  defaultTemplateId = 'react',
  accessToken,
}) {
  const [workspace, setWorkspace] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // File tree and active files
  const [files, setFiles] = useState([]);
  const [openTabs, setOpenTabs] = useState([]); // [{ path, content, permission }]
  const [activeTabPath, setActiveTabPath] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'

  // Bottom / Right Panels
  const [activeBottomPanel, setActiveBottomPanel] = useState('terminal'); // 'terminal', 'preview', 'tests', 'database', 'ai'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState([
    '⚡ Learning Workspace Initialized',
    'Type commands below or use action buttons above.',
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isRunningCommand, setIsRunningCommand] = useState(false);

  // Preview state
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [previewKey, setPreviewKey] = useState(0);

  // Testing & Evaluation state
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Database Lab state
  const [dbQuery, setDbQuery] = useState('SELECT * FROM customers;');
  const [dbResults, setDbResults] = useState(null);
  const [isRunningDbQuery, setIsRunningDbQuery] = useState(false);

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponses, setAiResponses] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 1. Provision or load workspace
  const initWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          assignmentId,
          templateId: defaultTemplateId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to provision workspace');
      }

      setWorkspace(data.data.workspace);
      setTemplate(data.data.template);

      // Load files
      await loadFiles(data.data.workspace._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      initWorkspace();
    }
  }, [courseId, lessonId, assignmentId, accessToken]);

  // 2. Load files
  const loadFiles = async (wsId) => {
    try {
      const res = await fetch(`/api/v1/workspaces/${wsId}/files`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.data || []);

        // Pick first editable file to open
        const firstFile = findFirstFile(data.data || []);
        if (firstFile) {
          openFile(wsId, firstFile.path);
        }
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  };

  const findFirstFile = (tree) => {
    for (const item of tree) {
      if (item.type === 'file') return item;
      if (item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Open file in editor tab
  const openFile = async (wsId, filePath) => {
    const existing = openTabs.find((t) => t.path === filePath);
    if (existing) {
      setActiveTabPath(filePath);
      return;
    }

    try {
      const res = await fetch(`/api/v1/workspaces/${wsId}/files/content?path=${encodeURIComponent(filePath)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        const newTab = {
          path: data.data.path,
          content: data.data.content,
          permission: data.data.permission,
        };
        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabPath(data.data.path);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const closeTab = (e, path) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t.path !== path);
    setOpenTabs(remaining);
    if (activeTabPath === path) {
      setActiveTabPath(remaining.length > 0 ? remaining[remaining.length - 1].path : '');
    }
  };

  const currentTab = openTabs.find((t) => t.path === activeTabPath) || null;

  // Handle code change in editor
  const handleEditorChange = (newCode) => {
    if (!currentTab || currentTab.permission === 'readonly') return;
    setSaveStatus('unsaved');
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === activeTabPath ? { ...t, content: newCode } : t))
    );
  };

  // Save current active file
  const saveActiveFile = async () => {
    if (!workspace || !currentTab || currentTab.permission === 'readonly') return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/files/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          path: currentTab.path,
          content: currentTab.content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        setPreviewKey((k) => k + 1); // Refresh preview
      } else {
        setSaveStatus('unsaved');
      }
    } catch {
      setSaveStatus('unsaved');
    }
  };

  // Auto-save on delay
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = setTimeout(() => {
      saveActiveFile();
    }, 1500);
    return () => clearTimeout(timer);
  }, [saveStatus, currentTab?.content]);

  // Execute terminal command
  const executeTerminal = async (cmdToRun) => {
    const cmd = cmdToRun || terminalInput;
    if (!cmd.trim() || isRunningCommand || !workspace) return;

    setIsRunningCommand(true);
    setTerminalHistory((prev) => [...prev, `$ ${cmd}`]);
    setTerminalInput('');

    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (data.success) {
        const out = data.data.stdout || data.data.stderr || '(command executed with no output)';
        setTerminalHistory((prev) => [...prev, out]);
      } else {
        setTerminalHistory((prev) => [...prev, `Error: ${data.message}`]);
      }
    } catch (err) {
      setTerminalHistory((prev) => [...prev, `Execution error: ${err.message}`]);
    } finally {
      setIsRunningCommand(false);
    }
  };

  // Run visible tests
  const handleRunTests = async () => {
    if (!workspace || isRunningTests) return;
    setIsRunningTests(true);
    setActiveBottomPanel('tests');

    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setTestResults(data.data);
      }
    } catch (err) {
      console.error('Test run failed:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit workspace for final evaluation
  const handleSubmitWorkspace = async () => {
    if (!workspace || isSubmitting) return;
    setIsSubmitting(true);
    setActiveBottomPanel('tests');

    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubmissionResult(data.data);
        setTestResults(data.data);
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset workspace
  const handleResetWorkspace = async () => {
    if (!workspace) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setShowResetModal(false);
        setOpenTabs([]);
        setActiveTabPath('');
        setTerminalHistory(['⚡ Workspace cleanly reset to starter template files.']);
        await loadFiles(workspace._id);
      }
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Execute Database Query
  const handleRunDbQuery = async () => {
    if (!workspace || isRunningDbQuery) return;
    setIsRunningDbQuery(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type: 'SQL', query: dbQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setDbResults(data.data);
      }
    } catch (err) {
      alert(`Query failed: ${err.message}`);
    } finally {
      setIsRunningDbQuery(false);
    }
  };

  // AI Gateway Chat
  const handleSendAiPrompt = async () => {
    if (!aiPrompt.trim() || isAiLoading || !workspace) return;
    const prompt = aiPrompt;
    setAiPrompt('');
    setIsAiLoading(true);
    setAiResponses((prev) => [...prev, { sender: 'user', text: prompt }]);

    try {
      const res = await fetch(`/api/v1/workspaces/${workspace._id}/ai-gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResponses((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.data.response,
            tokens: data.data.usage?.totalTokens,
          },
        ]);
      }
    } catch (err) {
      setAiResponses((prev) => [...prev, { sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Language mapping for Monaco
  const getLanguage = (fileName = '') => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) return 'javascript';
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.sql')) return 'sql';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  if (loading) {
    return (
      <div className="h-[650px] w-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4 p-8">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center animate-pulse">
            <Cpu className="w-6 h-6 text-teal-400" />
          </div>
          <RefreshCw className="w-5 h-5 text-teal-400 animate-spin absolute -top-1 -right-1" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-white tracking-wide">Provisioning Isolated Workspace...</p>
          <p className="text-xs text-slate-400">Attaching persistent volume, mounting starter files, configuring runtime.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] w-full rounded-2xl bg-slate-950 border border-rose-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="text-base font-bold text-white">Workspace Initialization Error</h3>
        <p className="text-xs text-rose-300 max-w-md">{error}</p>
        <button
          onClick={initWorkspace}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[750px] w-full'
      }`}
    >
      {/* 1. TOP TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {template?.name || 'Workspace'}
            </span>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-teal-300 border border-teal-500/30">
            {workspace?.status || 'RUNNING'}
          </span>

          {saveStatus === 'saving' && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-teal-400" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-[11px] text-amber-400">● Unsaved</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Run Tests Button */}
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Run Visible Test Suite"
          >
            <Play className="w-3.5 h-3.5 text-teal-400 fill-current" />
            <span>{isRunningTests ? 'Testing...' : 'Run Tests'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setShowResetModal(true)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
            title="Reset Workspace to Starter State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmitWorkspace}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Grading...' : 'Submit'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition ml-1"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKBENCH BODY (Split into Sidebar + Editor + Lower Panel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* FILE EXPLORER SIDEBAR */}
        <div className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-900 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Explorer
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
            {files.map((item) => (
              <FileTreeNode
                key={item.path}
                item={item}
                activePath={activeTabPath}
                onSelect={(p) => openFile(workspace._id, p)}
              />
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: CODE EDITOR & TABS */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
          {/* EDITOR TABS BAR */}
          <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto">
            {openTabs.map((tab) => {
              const isActive = tab.path === activeTabPath;
              return (
                <div
                  key={tab.path}
                  onClick={() => setActiveTabPath(tab.path)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border-r border-slate-800 cursor-pointer transition select-none ${
                    isActive
                      ? 'bg-slate-900 text-teal-400 border-t-2 border-t-teal-500'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-teal-400" />
                  <span>{tab.path.split('/').pop()}</span>
                  {tab.permission === 'readonly' && (
                    <Lock className="w-3 h-3 text-slate-500" title="Read Only" />
                  )}
                  <button
                    onClick={(e) => closeTab(e, tab.path)}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* MONACO CODE EDITOR */}
          <div className="flex-1 relative overflow-hidden bg-slate-950">
            {currentTab ? (
              <Editor
                height="100%"
                path={currentTab.path}
                language={getLanguage(currentTab.path)}
                value={currentTab.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  readOnly: currentTab.permission === 'readonly',
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  tabSize: 2,
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                <FileCode className="w-8 h-8 opacity-40" />
                <p className="text-xs font-mono">Select a file from the explorer to begin editing</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / COLLAPSIBLE PANEL (PREVIEW, TERMINAL, TESTS, DATABASE, AI) */}
        <div className="w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
          {/* TAB HEADER */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/70 p-1 gap-1 overflow-x-auto text-[11px] font-semibold">
            {[
              { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
              { id: 'preview', label: 'Preview', icon: Eye },
              { id: 'tests', label: 'Tests', icon: CheckCircle2 },
              ...(workspace?.templateId === 'sql-postgresql' || workspace?.templateId === 'mongodb' || workspace?.templateId === 'redis'
                ? [{ id: 'database', label: 'Query', icon: Database }]
                : []),
              { id: 'ai', label: 'AI Tutor', icon: Sparkles },
            ].map((p) => {
              const Icon = p.icon;
              const isActive = activeBottomPanel === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveBottomPanel(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* PANEL CONTENT */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* TERMINAL PANEL */}
            {activeBottomPanel === 'terminal' && (
              <div className="h-full flex flex-col font-mono text-xs">
                <div className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                  {terminalHistory.map((line, idx) => (
                    <div
                      key={idx}
                      className={`whitespace-pre-wrap ${
                        line.startsWith('$') ? 'text-teal-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeTerminal();
                  }}
                  className="mt-2 flex items-center gap-2 border-t border-slate-800 pt-2"
                >
                  <span className="text-teal-400 font-bold">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="npm test, node app.js..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={isRunningCommand}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                  >
                    Run
                  </button>
                </form>
              </div>
            )}

            {/* LIVE PREVIEW PANEL */}
            {activeBottomPanel === 'preview' && (
              <div className="h-full flex flex-col space-y-2">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('tablet')}
                      className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Reload Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 bg-white">
                  <iframe
                    key={previewKey}
                    src={`/api/v1/workspaces/${workspace._id}/preview`}
                    className="w-full h-full border-0"
                    title="Workspace Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              </div>
            )}

            {/* TESTS & EVALUATION PANEL */}
            {activeBottomPanel === 'tests' && (
              <div className="h-full flex flex-col space-y-3 font-mono text-xs">
                {testResults ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <div className="text-sm font-bold text-white">Score: {testResults.score}%</div>
                        <div className="text-[11px] text-slate-400">
                          Passed: {testResults.passed} / {testResults.totalTests} tests
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          testResults.success
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {testResults.verdict}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {testResults.tests.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border ${
                            t.passed
                              ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-900/50 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{t.name}</span>
                            <span>{t.passed ? 'PASSED' : 'FAILED'}</span>
                          </div>
                          {t.description && (
                            <p className="text-[10px] text-slate-400 mt-1">{t.description}</p>
                          )}
                          {!t.passed && !t.isHidden && t.actual && (
                            <div className="text-[10px] mt-1 text-rose-400 bg-rose-950/40 p-1.5 rounded">
                              Actual: {t.actual}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 opacity-40" />
                    <p>No test results yet.</p>
                    <button
                      onClick={handleRunTests}
                      className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold"
                    >
                      Run Tests Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DATABASE QUERY LAB PANEL */}
            {activeBottomPanel === 'database' && (
              <div className="h-full flex flex-col space-y-3 font-mono text-xs">
                <textarea
                  rows={4}
                  value={dbQuery}
                  onChange={(e) => setDbQuery(e.target.value)}
                  placeholder="Enter SQL or MQL query..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleRunDbQuery}
                  disabled={isRunningDbQuery}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isRunningDbQuery ? 'Executing...' : 'Execute Query'}</span>
                </button>

                {dbResults && (
                  <div className="flex-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-2">
                    {dbResults.rows ? (
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-teal-400">
                            {dbResults.columns.map((col) => (
                              <th key={col} className="p-1.5 font-bold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dbResults.rows.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-950 text-slate-300">
                              {dbResults.columns.map((col) => (
                                <td key={col} className="p-1.5">
                                  {row[col]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <pre className="text-slate-300 text-[10px]">
                        {JSON.stringify(dbResults.result, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI TUTOR PANEL */}
            {activeBottomPanel === 'ai' && (
              <div className="h-full flex flex-col font-mono text-xs">
                <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                  {aiResponses.length === 0 ? (
                    <div className="text-center text-slate-500 p-4">
                      <Sparkles className="w-6 h-6 mx-auto text-teal-500 mb-2 opacity-50" />
                      <p>Ask questions about this code or error logs without leaving your editor.</p>
                    </div>
                  ) : (
                    aiResponses.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl ${
                          msg.sender === 'user'
                            ? 'bg-teal-950/40 border border-teal-900/50 text-teal-200 ml-4'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">
                          {msg.sender === 'user' ? 'You' : 'AI Tutor'}
                        </span>
                        {msg.text}
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiPrompt();
                  }}
                  className="flex items-center gap-2 border-t border-slate-800 pt-2"
                >
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask AI Tutor for guidance..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading}
                    className="p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset Workspace?</h3>
            <p className="text-xs text-slate-400">
              Your current file edits will be reverted back to the assignment starter state. Saved test submissions will remain untouched.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleResetWorkspace}
                disabled={isResetting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Recursive File Tree Item Component
 */
function FileTreeNode({ item, activePath, onSelect }) {
  const [isOpen, setIsOpen] = useState(true);

  if (item.type === 'directory') {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-200 cursor-pointer select-none"
        >
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-teal-400" /> : <Folder className="w-3.5 h-3.5 text-teal-400" />}
          <span>{item.name}</span>
        </div>
        {isOpen && item.children && (
          <div className="ml-3 border-l border-slate-900 pl-1 space-y-0.5">
            {item.children.map((child) => (
              <FileTreeNode
                key={child.path}
                item={child}
                activePath={activePath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = item.path === activePath;
  return (
    <div
      onClick={() => onSelect(item.path)}
      className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer select-none transition ${
        isActive ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-1.5 truncate">
        <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="truncate">{item.name}</span>
      </div>
      {item.permission === 'readonly' && (
        <Lock className="w-2.5 h-2.5 text-slate-600 shrink-0 ml-1" />
      )}
    </div>
  );
}
