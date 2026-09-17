'use client';

import { useState, useEffect } from 'react';
import { Layers, Sparkles, Heart, ExternalLink, Github, Plus, Tag, CheckCircle2 } from 'lucide-react';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('RECOMMENDED'); // RECOMMENDED | SHOWCASE | PUBLISH
  const [projects, setProjects] = useState([]);
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states for publishing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  useEffect(() => {
    // Initial recommended projects
    setProjects([
      {
        id: 'proj-1',
        title: 'Real-Time Collaborative Code Editor',
        description: 'Build a multi-user in-browser code editor with WebSockets and code execution sandbox integration.',
        techStack: ['React', 'Node.js', 'WebSockets', 'Tailwind CSS'],
        difficulty: 'INTERMEDIATE',
        estimatedHours: 12,
        reason: 'Recommended because you are building full-stack skills and do not yet have a real-time application in your portfolio.',
      },
      {
        id: 'proj-2',
        title: 'AI-Powered Career Intelligence Assistant',
        description: 'Create an intelligent dashboard matching user competencies against industry hiring criteria.',
        techStack: ['Next.js', 'Express', 'MongoDB', 'AI Embeddings'],
        difficulty: 'ADVANCED',
        estimatedHours: 16,
        reason: 'Recommended because AI-integrated full stack applications demonstrate high-demand production competencies.',
      },
      {
        id: 'proj-3',
        title: 'Enterprise RBAC User Management System',
        description: 'Develop a multi-tenant authentication portal with granular permissions, audit logs, and security headers.',
        techStack: ['Express.js', 'JWT', 'MongoDB', 'React'],
        difficulty: 'INTERMEDIATE',
        estimatedHours: 8,
        reason: 'Recommended to validate enterprise backend security fundamentals.',
      },
    ]);

    // Initial community showcases
    setShowcases([
      {
        _id: 'sc-1',
        studentName: 'Alex Rivera',
        title: 'Cloud Cost Optimizer CLI',
        description: 'Command line utility analyzing AWS ECS task utilization and recommending rightsized Fargate instances.',
        techStack: ['Node.js', 'AWS SDK', 'Docker'],
        githubUrl: 'https://github.com/example/cloud-opt',
        demoUrl: 'https://cloud-opt.example.com',
        likesCount: 24,
      },
      {
        _id: 'sc-2',
        studentName: 'Priya Sharma',
        title: 'Distributed Event Streaming Engine',
        description: 'Lightweight in-memory publish-subscribe broker supporting consumer groups and message replay.',
        techStack: ['TypeScript', 'Express', 'Redis'],
        githubUrl: 'https://github.com/example/stream-engine',
        demoUrl: '',
        likesCount: 38,
      },
    ]);
  }, []);

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title || !description) return;

    const newShowcase = {
      _id: `sc-${Date.now()}`,
      studentName: 'You',
      title,
      description,
      techStack: techStack.split(',').map((s) => s.trim()).filter(Boolean),
      githubUrl,
      demoUrl,
      likesCount: 1,
    };

    setShowcases([newShowcase, ...showcases]);
    setPublishedSuccess(true);
    setTitle('');
    setDescription('');
    setTechStack('');
    setGithubUrl('');
    setDemoUrl('');
    setTimeout(() => {
      setPublishedSuccess(false);
      setActiveTab('SHOWCASE');
    }, 1500);
  };

  const handleLike = (id) => {
    setShowcases(
      showcases.map((s) => (s._id === id ? { ...s, likesCount: s.likesCount + 1 } : s))
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-400" /> Milestone Projects & Community Showcase
          </h1>
          <p className="text-slate-400 text-sm">
            Applied project engineering with personalized recommendations and peer showcase.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('RECOMMENDED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'RECOMMENDED'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recommended For You
          </button>
          <button
            onClick={() => setActiveTab('SHOWCASE')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'SHOWCASE'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Community Showcase
          </button>
          <button
            onClick={() => setActiveTab('PUBLISH')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'PUBLISH'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Publish Project
          </button>
        </div>
      </div>

      {/* Tab 1: Recommended Projects */}
      {activeTab === 'RECOMMENDED' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 flex flex-col justify-between transition group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {proj.difficulty}
                  </span>
                  <span className="text-xs text-slate-500">{proj.estimatedHours} hrs</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition mb-2">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 mb-4">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {proj.techStack.map((tech, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-indigo-300/80 italic mb-3 flex items-start gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{proj.reason}</span>
                </div>
                <button
                  onClick={() => setActiveTab('PUBLISH')}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  Start Project Specification
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Community Showcase */}
      {activeTab === 'SHOWCASE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showcases.map((sc) => (
            <div
              key={sc._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-400">By {sc.studentName}</span>
                  <button
                    onClick={() => handleLike(sc._id)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-full transition"
                  >
                    <Heart className="w-3 h-3 fill-rose-500" /> {sc.likesCount}
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{sc.title}</h3>
                <p className="text-xs text-slate-400 mb-4">{sc.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sc.techStack.map((tech, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800 text-xs">
                {sc.githubUrl && (
                  <a
                    href={sc.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition"
                  >
                    <Github className="w-3.5 h-3.5" /> Source Code
                  </a>
                )}
                {sc.demoUrl && (
                  <a
                    href={sc.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Publish Project */}
      {activeTab === 'PUBLISH' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Publish to Community Showcase</h2>
          <p className="text-slate-400 text-xs mb-4">
            Showcase your completed application to peers, instructors, and hiring partners.
          </p>

          {publishedSuccess && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Project published successfully to showcase!
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Task Queue Dashboard"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Description & Impact</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem solved, architecture choices, and features..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Technologies (comma separated)</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. React, Next.js, Redis, MongoDB"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">GitHub Repository URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Live Demo URL</label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-indigo-600/20"
            >
              Publish to Community
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
