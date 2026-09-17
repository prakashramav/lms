'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import StudentLayout from '../../../components/layout/StudentLayout';
import { useAuth } from '../../../context/AuthContext';
import { fetchCareerRoadmap, fetchCareerPaths } from '../../../services/careerService';
import {
  Layers,
  CheckCircle2,
  Circle,
  ArrowDown,
  Compass,
  Briefcase,
  ChevronLeft,
  Sparkles,
  BookOpen
} from 'lucide-react';

function CareerRoadmapContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const pathParam = searchParams.get('path');

  const [paths, setPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState(pathParam || '');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRoadmap = useCallback(async (pathId) => {
    setLoading(true);
    try {
      const data = await fetchCareerRoadmap(pathId, accessToken);
      setRoadmap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    async function init() {
      try {
        const availablePaths = await fetchCareerPaths(accessToken);
        setPaths(availablePaths || []);
        const defaultId = pathParam || (availablePaths && availablePaths[0]?._id) || '';
        setSelectedPathId(defaultId);
        if (defaultId) {
          loadRoadmap(defaultId);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, [accessToken, pathParam, loadRoadmap]);

  const handleSelectPath = (e) => {
    const id = e.target.value;
    setSelectedPathId(id);
    loadRoadmap(id);
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/career"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Career Hub
          </Link>
          <div className="flex items-center gap-3">
            <label htmlFor="path-select" className="text-xs text-slate-400 font-medium">
              Career Track:
            </label>
            <select
              id="path-select"
              value={selectedPathId}
              onChange={handleSelectPath}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {paths.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Roadmap Title Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            Configured Progression Roadmap
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {roadmap ? `${roadmap.pathName} Roadmap` : 'Career Progression Roadmap'}
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            {roadmap?.description || 'Follow this staged curriculum from foundational logic to production-ready deployments and placement.'}
          </p>
        </div>

        {/* Roadmap Stages Timeline */}
        {roadmap && (
          <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-10 py-4">
            {roadmap.stages?.map((stage, index) => (
              <div key={stage.stageNumber || index} className="relative group">
                {/* Node indicator */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 text-indigo-400 flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {stage.stageNumber || index + 1}
                </div>

                {/* Stage Content Card */}
                <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Stage {stage.stageNumber || index + 1}
                    </span>
                    <span className="text-xs text-slate-500">Core Industry Standard</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">{stage.title}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{stage.description}</p>

                  {/* Skills badges */}
                  {stage.skills && stage.skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2">Required Skills &amp; Competencies:</span>
                      <div className="flex flex-wrap gap-2">
                        {stage.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Footer */}
        <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Ready to validate these skills?</h3>
            <p className="text-xs text-slate-400 mt-0.5">Explore open roles matching this roadmap or take a mock interview.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/jobs"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Browse Matching Jobs
            </Link>
            <Link
              href="/interview-prep"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
            >
              Practice Interview Questions
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default function CareerRoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading roadmap...
        </div>
      }
    >
      <CareerRoadmapContent />
    </Suspense>
  );
}

