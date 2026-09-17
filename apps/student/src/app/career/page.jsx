'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCareerPaths,
  fetchCareerProfile,
  fetchSkillGaps,
  updateTargetCareer,
  fetchCareerPlan,
  toggleCareerMilestone
} from '../../services/careerService';
import {
  Compass,
  Briefcase,
  FileText,
  UserCheck,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  Code,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function CareerPage() {
  const { user, accessToken } = useAuth();
  const [paths, setPaths] = useState([]);
  const [profile, setProfile] = useState(null);
  const [skillGaps, setSkillGaps] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathsData, profileData, gapsData, planData] = await Promise.all([
        fetchCareerPaths(accessToken),
        accessToken ? fetchCareerProfile(accessToken) : null,
        accessToken ? fetchSkillGaps(accessToken) : null,
        accessToken ? fetchCareerPlan(accessToken) : null,
      ]);

      setPaths(pathsData || []);
      setProfile(profileData);
      setSkillGaps(gapsData);
      setPlan(planData);
    } catch (err) {
      setError(err.message || 'Failed to load career hub data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPath = async (careerPathId) => {
    if (!accessToken) return;
    setUpdating(true);
    try {
      const updatedProfile = await updateTargetCareer(accessToken, careerPathId);
      setProfile(updatedProfile);
      const updatedGaps = await fetchSkillGaps(accessToken, careerPathId);
      setSkillGaps(updatedGaps);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMilestone = async (index, currentVal) => {
    if (!accessToken) return;
    try {
      const updatedPlan = await toggleCareerMilestone(accessToken, index, !currentVal);
      setPlan(updatedPlan);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-8 sm:p-10 shadow-xl border border-indigo-500/20">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-500/30">
              <Compass className="w-3.5 h-3.5" />
              Career Intelligence Ecosystem
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Your Pathway from Learning to Industry Placement
            </h1>
            <p className="text-indigo-200 text-base sm:text-lg leading-relaxed mb-6">
              Connect platform skills, coding challenges, and capstone projects to verified job opportunities. Transparent indicators keep your preparation on track.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/career/roadmap"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Layers className="w-4 h-4" />
                View Interactive Roadmap
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors backdrop-blur-sm border border-white/15"
              >
                <Briefcase className="w-4 h-4" />
                Explore Job Board
              </Link>
              <Link
                href="/resume"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors backdrop-blur-sm border border-white/15"
              >
                <FileText className="w-4 h-4" />
                Resume Builder
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Roadmap', href: '/career/roadmap', icon: Layers, desc: 'Step-by-step path' },
            { label: 'Job Board', href: '/jobs', icon: Briefcase, desc: 'Verified openings' },
            { label: 'Applications', href: '/applications', icon: TrendingUp, desc: 'Track pipeline' },
            { label: 'Resume', href: '/resume', icon: FileText, desc: 'ATS-ready builder' },
            { label: 'Portfolio', href: '/portfolio', icon: Code, desc: 'Showcase projects' },
            { label: 'Interview Prep', href: '/interview-prep', icon: UserCheck, desc: 'Mock questions' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center mb-2">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-white">{item.label}</span>
              <span className="text-xs text-slate-400 mt-0.5">{item.desc}</span>
            </Link>
          ))}
        </div>

        {/* Readiness Scorecard & Breakdown */}
        {profile && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Current Focus</span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Target Role: <span className="text-indigo-300">{profile.targetRole || 'Full Stack Developer'}</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Based on your verified completed courses, portfolio projects, and mock interviews.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-slate-800/60 px-6 py-4 rounded-xl border border-slate-700/60">
                <div className="text-right">
                  <div className="text-3xl font-black text-white">{profile.readinessScore || 0}%</div>
                  <div className="text-xs font-medium text-slate-400">Readiness Metric</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {profile.readinessScore || 0}%
                </div>
              </div>
            </div>

            {/* Breakdown Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
              {[
                { title: 'Skills Match', score: profile.readinessBreakdown?.skills || 0, max: 30, icon: Sparkles },
                { title: 'Projects', score: profile.readinessBreakdown?.projects || 0, max: 25, icon: Code },
                { title: 'Resume', score: profile.readinessBreakdown?.resume || 0, max: 15, icon: FileText },
                { title: 'Portfolio', score: profile.readinessBreakdown?.portfolio || 0, max: 15, icon: Award },
                { title: 'Interviews', score: profile.readinessBreakdown?.interview || 0, max: 15, icon: UserCheck },
              ].map((pillar) => (
                <div key={pillar.title} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                    <pillar.icon className="w-3.5 h-3.5 text-indigo-400" />
                    {pillar.title}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {pillar.score} <span className="text-xs text-slate-500 font-normal">/ {pillar.max} pts</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(pillar.score / pillar.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              *Readiness is an explainable composite indicator and does not represent a guaranteed employment outcome.
            </p>
          </div>
        )}

        {/* Skill Gap Analysis Matrix */}
        {skillGaps && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Skill Gap Analysis</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Comparing your current platform progress against required competencies for {skillGaps.careerPath?.name || 'this role'}.
                </p>
              </div>
              {skillGaps.recommendedNext && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Recommended Next: {skillGaps.recommendedNext.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Already Practicing */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Already Practicing
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    {skillGaps.alreadyPracticing.length}
                  </span>
                </div>
                {skillGaps.alreadyPracticing.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No skills completed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {skillGaps.alreadyPracticing.map((s) => (
                      <div key={s._id} className="p-2.5 rounded-lg bg-slate-800/60 text-xs text-slate-200 flex items-center justify-between">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase">{s.masteryLevel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Needs Practice */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Needs Practice
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    {skillGaps.needsPractice.length}
                  </span>
                </div>
                {skillGaps.needsPractice.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No revision areas pending.</p>
                ) : (
                  <div className="space-y-2">
                    {skillGaps.needsPractice.map((s) => (
                      <div key={s._id} className="p-2.5 rounded-lg bg-slate-800/60 text-xs text-slate-200 flex items-center justify-between">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-amber-400 font-semibold uppercase">{s.masteryLevel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Not Started */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Circle className="w-4 h-4" /> Not Started
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {skillGaps.notStarted.length}
                  </span>
                </div>
                {skillGaps.notStarted.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">All required skills initiated!</p>
                ) : (
                  <div className="space-y-2">
                    {skillGaps.notStarted.map((s) => (
                      <div key={s._id} className="p-2.5 rounded-lg bg-slate-800/60 text-xs text-slate-300 flex items-center justify-between">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{s.difficulty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Personal Career Plan & Milestones */}
        {plan && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Personal Career Plan</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Targeted milestones to complete before applying to competitive software engineering roles.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">{plan.weeklyTime} hrs/week committed</span>
                <div className="text-sm font-bold text-indigo-400">{plan.progress}% Complete</div>
              </div>
            </div>

            <div className="space-y-3">
              {plan.milestones?.map((m, idx) => (
                <div
                  key={m.title}
                  onClick={() => handleToggleMilestone(idx, m.completed)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    m.completed
                      ? 'bg-slate-800/30 border-emerald-500/30 text-slate-300'
                      : 'bg-slate-800/60 border-slate-800 text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${m.completed ? 'line-through text-slate-500' : ''}`}>
                      {m.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {m.completed ? 'Completed' : 'Tap to complete'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Career Paths */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Explore Industry Career Paths</h3>
          <p className="text-sm text-slate-400 mb-6">
            Select a career track to align your course recommendations, project goals, and interview practice.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paths.map((path) => {
              const isSelected = profile?.careerPathId?._id === path._id;
              return (
                <div
                  key={path._id}
                  className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                        {path.category}
                      </span>
                      <span className="text-xs text-slate-400">{path.difficulty}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{path.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{path.description}</p>

                    {path.resumeKeywords && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {path.resumeKeywords.slice(0, 5).map((kw) => (
                          <span key={kw} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleSelectPath(path._id)}
                      disabled={updating || isSelected}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isSelected ? 'Current Target' : 'Set as Target'}
                    </button>
                    <Link
                      href={`/career/roadmap?path=${path._id}`}
                      className="text-xs font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1"
                    >
                      Roadmap <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
