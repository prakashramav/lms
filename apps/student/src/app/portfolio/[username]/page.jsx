'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicPortfolio } from '../../../services/careerService';
import {
  Code,
  Github,
  ExternalLink,
  Mail,
  Lock,
  Sparkles,
  Layers,
  Award,
  ChevronLeft
} from 'lucide-react';

export default function PublicPortfolioPage() {
  const params = useParams();
  const username = params.username;

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicPortfolio(username);
      setPortfolio(data);
    } catch (err) {
      setError(err.message || 'Portfolio not found');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-sm text-slate-400">Loading portfolio...</div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-4">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <h1 className="text-xl font-bold text-white">Portfolio is Private or Not Found</h1>
          <p className="text-xs text-slate-400">
            {error || 'This portfolio is either marked private by the owner or does not exist.'}
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Explore Platform
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-sm tracking-tight text-white">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs">
              &lt;/&gt;
            </span>
            {portfolio.owner?.name || portfolio.username}
          </div>
          {portfolio.contactEmail && (
            <a
              href={`mailto:${portfolio.contactEmail}`}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> Get in Touch
            </a>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
        {/* Profile Hero */}
        <div className="bg-gradient-to-b from-indigo-950/20 to-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500/60 mx-auto flex items-center justify-center text-2xl font-bold text-indigo-400 overflow-hidden shadow-xl shadow-indigo-500/10">
              {portfolio.owner?.avatar ? (
                <img src={portfolio.owner.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (portfolio.owner?.name || portfolio.username)[0]?.toUpperCase()
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {portfolio.owner?.name || portfolio.username}
              </h1>
              <p className="text-base text-indigo-400 font-medium mt-1">
                {portfolio.headline || 'Full Stack Software Engineer'}
              </p>
            </div>

            {portfolio.about && (
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
                {portfolio.about}
              </p>
            )}

            {/* Tech Stack Pills */}
            {portfolio.skills && portfolio.skills.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {portfolio.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Showcase Projects Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Showcase Projects</h2>
              <p className="text-xs text-slate-400 mt-0.5">Production codebases and distributed architecture.</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {portfolio.projects?.length || 0} Projects Published
            </span>
          </div>

          {portfolio.projects && portfolio.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolio.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-white">{proj.title}</h3>
                      <div className="flex items-center gap-2">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="GitHub Repository"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                            title="Live Demo"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>

                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No showcase projects published yet.
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center pt-12 border-t border-slate-800/80 text-xs text-slate-500">
          Built and hosted on the EdTech Career Platform • Certified Engineering Portfolio
        </footer>
      </main>
    </div>
  );
}
