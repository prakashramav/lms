'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchPortfolio, updatePortfolio } from '../../services/careerService';
import {
  Code,
  Globe,
  Lock,
  Save,
  Plus,
  ExternalLink,
  Github,
  CheckCircle2,
  Share2,
  Eye,
  Trash2,
  Sparkles
} from 'lucide-react';

export default function PortfolioBuilderPage() {
  const { accessToken } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchPortfolio(accessToken);
      setPortfolio(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!accessToken || !portfolio) return;
    setSaving(true);
    try {
      const updated = await updatePortfolio(accessToken, portfolio);
      setPortfolio(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to update portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = () => {
    setPortfolio({
      ...portfolio,
      projects: [
        ...(portfolio.projects || []),
        {
          title: 'New Showcase Project',
          description: 'Engineered a scalable web application...',
          technologies: ['React', 'Node.js', 'MongoDB'],
          githubUrl: 'https://github.com/',
          liveUrl: 'https://',
          status: 'SHOWCASE',
        },
      ],
    });
  };

  const handleRemoveProject = (index) => {
    const list = [...(portfolio.projects || [])];
    list.splice(index, 1);
    setPortfolio({ ...portfolio, projects: list });
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="py-20 text-center text-slate-400 text-sm">Loading portfolio showcase...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Code className="w-3.5 h-3.5" /> Engineer Portfolio Showcase
            </div>
            <h1 className="text-3xl font-extrabold text-white">Portfolio Builder</h1>
            <p className="text-sm text-slate-400 mt-1">
              Curate your open-source repositories, live deployments, and achievements for industry recruiters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {portfolio?.username && (
              <a
                href={`/portfolio/${portfolio.username}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> View Public Page
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Portfolio'}
            </button>
          </div>
        </div>

        {/* Visibility & URL Settings */}
        {portfolio && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white">Public Handle &amp; Privacy Controls</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Portfolio Username / Slug</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                  <span className="px-3 text-xs text-slate-500 bg-slate-900 border-r border-slate-800">/portfolio/</span>
                  <input
                    type="text"
                    value={portfolio.username || ''}
                    onChange={(e) => setPortfolio({ ...portfolio, username: e.target.value })}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Showcase Visibility</label>
                <select
                  value={portfolio.visibility || 'PUBLIC'}
                  onChange={(e) => setPortfolio({ ...portfolio, visibility: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="PUBLIC">Public (Visible to everyone and employers)</option>
                  <option value="UNLISTED">Unlisted (Accessible only via direct link)</option>
                  <option value="PRIVATE">Private (Accessible only by you)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Headline</label>
                <input
                  type="text"
                  value={portfolio.headline || ''}
                  onChange={(e) => setPortfolio({ ...portfolio, headline: e.target.value })}
                  placeholder="e.g. Full Stack Developer & Systems Craftsman"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={portfolio.contactEmail || ''}
                  onChange={(e) => setPortfolio({ ...portfolio, contactEmail: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">About Me</label>
              <textarea
                rows={3}
                value={portfolio.about || ''}
                onChange={(e) => setPortfolio({ ...portfolio, about: e.target.value })}
                placeholder="Share your engineering background, favorite tech stack, and what you love building..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Project Showcase Section */}
        {portfolio && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Showcase Projects</h2>
                <p className="text-xs text-slate-400 mt-0.5">Feature your best platform capstones and repositories.</p>
              </div>
              <button
                onClick={handleAddProject}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {(portfolio.projects || []).map((proj, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 relative group">
                  <button
                    onClick={() => handleRemoveProject(idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title || ''}
                        onChange={(e) => {
                          const list = [...portfolio.projects];
                          list[idx].title = e.target.value;
                          setPortfolio({ ...portfolio, projects: list });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Technologies (comma-separated)</label>
                      <input
                        type="text"
                        value={(proj.technologies || []).join(', ')}
                        onChange={(e) => {
                          const list = [...portfolio.projects];
                          list[idx].technologies = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          setPortfolio({ ...portfolio, projects: list });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">GitHub Repo URL</label>
                      <input
                        type="text"
                        value={proj.githubUrl || ''}
                        onChange={(e) => {
                          const list = [...portfolio.projects];
                          list[idx].githubUrl = e.target.value;
                          setPortfolio({ ...portfolio, projects: list });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Live Demo URL</label>
                      <input
                        type="text"
                        value={proj.liveUrl || ''}
                        onChange={(e) => {
                          const list = [...portfolio.projects];
                          list[idx].liveUrl = e.target.value;
                          setPortfolio({ ...portfolio, projects: list });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Project Description &amp; Architecture</label>
                    <textarea
                      rows={2}
                      value={proj.description || ''}
                      onChange={(e) => {
                        const list = [...portfolio.projects];
                        list[idx].description = e.target.value;
                        setPortfolio({ ...portfolio, projects: list });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
