'use client';

import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Plus,
  BookOpen,
  UserCheck,
  Code2,
  CheckCircle2,
  Layers,
  Sparkles,
  Save
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function InstructorCareerPage() {
  const { accessToken } = useAuth();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  // Question Creation Form
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('TECHNICAL');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [role, setRole] = useState('Full Stack Developer');
  const [expectedTopics, setExpectedTopics] = useState('');
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/career/paths`);
        const json = await res.json();
        setPaths(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/interview/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          question,
          category,
          difficulty,
          role,
          expectedTopics: expectedTopics.split(',').map((t) => t.trim()).filter(Boolean),
          explanation,
        }),
      });

      if (!res.ok) throw new Error('Failed to create question');

      setSuccess(true);
      setQuestion('');
      setExpectedTopics('');
      setExplanation('');
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      alert(err.message || 'Error publishing question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" /> Industry Placement &amp; Alignment
          </div>
          <h1 className="text-3xl font-extrabold text-white">Career Programs &amp; Content</h1>
          <p className="text-sm text-slate-400 mt-1">
            Author technical interview questions, calibrate role competencies, and connect courses to placement tracks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Create Interview Question (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Publish Interview Practice Material
            </h2>
            <p className="text-xs text-slate-400">
              Contribute verified screening questions and architectural evaluations to the student interview simulator.
            </p>

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Interview question published to student bank!
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Explain how MongoDB handles document concurrency and write conflicts under replica set elections."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="TECHNICAL">Technical Architecture</option>
                    <option value="SYSTEM_DESIGN">System Design</option>
                    <option value="BEHAVIORAL">Behavioral (STAR)</option>
                    <option value="HR">Culture &amp; HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expected Concepts (comma-separated for automated coverage grading)
                </label>
                <input
                  type="text"
                  value={expectedTopics}
                  onChange={(e) => setExpectedTopics(e.target.value)}
                  placeholder="e.g. WiredTiger, two-phase commits, optimistic concurrency, write concern"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Model Answer Breakdown &amp; Explanation
                </label>
                <textarea
                  rows={4}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide reference points, invariants, and trade-offs students should touch upon..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Publishing...' : 'Publish to Question Bank'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Platform Career Paths (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Active Platform Career Paths
            </h2>

            {loading ? (
              <div className="text-slate-500 text-xs">Loading career tracks...</div>
            ) : (
              <div className="space-y-3">
                {paths.map((p) => (
                  <div key={p._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-400">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{p.description}</p>
                    <div className="text-[10px] text-slate-500">
                      Required Skills: {p.requiredSkills?.length || 0} • Roadmap Stages: {p.roadmapStages?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
