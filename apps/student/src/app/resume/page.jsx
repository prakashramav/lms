'use client';

import { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchResumes,
  fetchResumeById,
  createResume,
  updateResume,
  deleteResume,
  analyzeResume
} from '../../services/careerService';
import {
  FileText,
  Plus,
  Save,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  Code,
  Briefcase,
  GraduationCap,
  Layers,
  X
} from 'lucide-react';

export default function ResumeBuilderPage() {
  const { accessToken } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // personal, summary, experience, education, skills, projects, preview

  // AI Analysis Modal
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadResumes = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const list = await fetchResumes(accessToken);
      setResumes(list || []);
      if (list && list.length > 0) {
        const fullResume = await fetchResumeById(accessToken, list[0]._id);
        setActiveResume(fullResume);
      } else {
        // Initialize first resume
        const newResume = await createResume(accessToken, {
          title: 'Full Stack Engineer Resume',
          template: 'MODERN',
          summary: 'Software developer with focus on React, Node.js, and scalable web architecture.',
        });
        setResumes([newResume]);
        setActiveResume(newResume);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleSelectResume = async (resumeId) => {
    try {
      const full = await fetchResumeById(accessToken, resumeId);
      setActiveResume(full);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewResume = async () => {
    const title = prompt('Enter a title for your new resume (e.g. Frontend Developer Resume):');
    if (!title) return;
    try {
      const created = await createResume(accessToken, { title, template: 'MODERN' });
      setResumes([created, ...resumes]);
      setActiveResume(created);
    } catch (err) {
      alert(err.message || 'Failed to create resume');
    }
  };

  const handleSave = async () => {
    if (!accessToken || !activeResume) return;
    setSaving(true);
    try {
      const updated = await updateResume(accessToken, activeResume._id, activeResume);
      setActiveResume(updated);
      alert('Resume saved successfully! Version incremented.');
    } catch (err) {
      alert(err.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!accessToken || !activeResume) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeResume(accessToken, activeResume._id, 'Full Stack Developer');
      setAnalysisResult(analysis);
    } catch (err) {
      alert(err.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="py-20 text-center text-slate-400 text-sm">Loading resume workspace...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5" /> Professional Resume System
            </div>
            <h1 className="text-3xl font-extrabold text-white">Resume Builder &amp; ATS Audit</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create tailored resumes for specific roles with version history and keyword coverage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Analyzing...' : 'AI ATS Review'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print / Export
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Version'}
            </button>
          </div>
        </div>

        {/* Resumes Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {resumes.map((r) => (
            <button
              key={r._id}
              onClick={() => handleSelectResume(r._id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                activeResume?._id === r._id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {r.title}
              <span className="text-[10px] opacity-75">v{r.version || 1}</span>
            </button>
          ))}
          <button
            onClick={handleCreateNewResume}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-semibold border border-dashed border-slate-700 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Resume
          </button>
        </div>

        {/* Editor & Preview Layout */}
        {activeResume && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Editor (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                {[
                  { key: 'personal', label: 'Contact' },
                  { key: 'summary', label: 'Summary' },
                  { key: 'skills', label: 'Skills' },
                  { key: 'experience', label: 'Experience' },
                  { key: 'projects', label: 'Projects' },
                  { key: 'education', label: 'Education' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === tab.key
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Content */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact &amp; Identification</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo?.fullName || ''}
                          onChange={(e) =>
                            setActiveResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, fullName: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={activeResume.personalInfo?.email || ''}
                          onChange={(e) =>
                            setActiveResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, email: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo?.phone || ''}
                          onChange={(e) =>
                            setActiveResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, phone: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo?.location || ''}
                          onChange={(e) =>
                            setActiveResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, location: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">GitHub URL</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo?.github || ''}
                          onChange={(e) =>
                            setActiveResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, github: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn URL</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo?.linkedin || ''}
                          onChange={(e) =>
                            setActiveResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, linkedin: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Professional Technical Summary</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Write a concise 2-3 sentence overview highlighting your core strengths, languages, and career trajectory.
                    </p>
                    <textarea
                      rows={5}
                      value={activeResume.summary || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, summary: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Technical Skills</h3>
                    <p className="text-xs text-slate-400">
                      Comma-separated list of technical skills (e.g. JavaScript, React, Node.js, Express, MongoDB, Git).
                    </p>
                    <input
                      type="text"
                      placeholder="React, Next.js, TypeScript, Node.js, MongoDB"
                      value={(activeResume.skills || []).map((s) => s.name).join(', ')}
                      onChange={(e) => {
                        const names = e.target.value.split(',').map((n) => n.trim()).filter(Boolean);
                        setActiveResume({
                          ...activeResume,
                          skills: names.map((name) => ({ name, level: 'Proficient', category: 'General' })),
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
                    />
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Work &amp; Internship Experience</h3>
                    {(activeResume.experience || []).map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={exp.company || ''}
                            onChange={(e) => {
                              const expList = [...activeResume.experience];
                              expList[idx].company = e.target.value;
                              setActiveResume({ ...activeResume, experience: expList });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Role / Title"
                            value={exp.role || ''}
                            onChange={(e) => {
                              const expList = [...activeResume.experience];
                              expList[idx].role = e.target.value;
                              setActiveResume({ ...activeResume, experience: expList });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Accomplished [X] as measured by [Y] by doing [Z]..."
                          value={exp.description || ''}
                          onChange={(e) => {
                            const expList = [...activeResume.experience];
                            expList[idx].description = e.target.value;
                            setActiveResume({ ...activeResume, experience: expList });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setActiveResume({
                          ...activeResume,
                          experience: [
                            ...(activeResume.experience || []),
                            { company: '', role: '', description: '' },
                          ],
                        })
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Experience Entry
                    </button>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Showcase Projects</h3>
                    {(activeResume.projects || []).map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Project Title"
                            value={proj.title || ''}
                            onChange={(e) => {
                              const list = [...activeResume.projects];
                              list[idx].title = e.target.value;
                              setActiveResume({ ...activeResume, projects: list });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="GitHub Link"
                            value={proj.githubUrl || ''}
                            onChange={(e) => {
                              const list = [...activeResume.projects];
                              list[idx].githubUrl = e.target.value;
                              setActiveResume({ ...activeResume, projects: list });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Project description, architecture, and impact..."
                          value={proj.description || ''}
                          onChange={(e) => {
                            const list = [...activeResume.projects];
                            list[idx].description = e.target.value;
                            setActiveResume({ ...activeResume, projects: list });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setActiveResume({
                          ...activeResume,
                          projects: [
                            ...(activeResume.projects || []),
                            { title: '', description: '', githubUrl: '' },
                          ],
                        })
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Project
                    </button>
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Education</h3>
                    {(activeResume.education || []).map((edu, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Institution"
                          value={edu.institution || ''}
                          onChange={(e) => {
                            const list = [...activeResume.education];
                            list[idx].institution = e.target.value;
                            setActiveResume({ ...activeResume, education: list });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Degree / Field"
                          value={edu.degree || ''}
                          onChange={(e) => {
                            const list = [...activeResume.education];
                            list[idx].degree = e.target.value;
                            setActiveResume({ ...activeResume, education: list });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setActiveResume({
                          ...activeResume,
                          education: [
                            ...(activeResume.education || []),
                            { institution: '', degree: '' },
                          ],
                        })
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Education
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live ATS Preview (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-6 bg-white text-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 text-[11px] leading-relaxed space-y-4 print:shadow-none print:border-none">
                {/* Contact Header */}
                <div className="border-b border-slate-300 pb-3 text-center">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
                    {activeResume.personalInfo?.fullName || 'Candidate Name'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-600 mt-1">
                    {activeResume.personalInfo?.email && <span>{activeResume.personalInfo.email}</span>}
                    {activeResume.personalInfo?.phone && <span>• {activeResume.personalInfo.phone}</span>}
                    {activeResume.personalInfo?.location && <span>• {activeResume.personalInfo.location}</span>}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-indigo-700 mt-0.5 font-medium">
                    {activeResume.personalInfo?.github && <span>GitHub: {activeResume.personalInfo.github}</span>}
                    {activeResume.personalInfo?.linkedin && <span>• LinkedIn: {activeResume.personalInfo.linkedin}</span>}
                  </div>
                </div>

                {/* Summary */}
                {activeResume.summary && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5">
                      Professional Summary
                    </h3>
                    <p className="text-slate-700">{activeResume.summary}</p>
                  </div>
                )}

                {/* Skills */}
                {activeResume.skills && activeResume.skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5">
                      Technical Skills
                    </h3>
                    <p className="text-slate-700 font-medium">
                      {activeResume.skills.map((s) => s.name).join(', ')}
                    </p>
                  </div>
                )}

                {/* Projects */}
                {activeResume.projects && activeResume.projects.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5">
                      Technical Projects
                    </h3>
                    <div className="space-y-2">
                      {activeResume.projects.map((p, idx) => (
                        <div key={idx}>
                          <div className="font-bold text-slate-800">{p.title || 'Project'}</div>
                          <p className="text-slate-600 text-[10px]">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {activeResume.experience && activeResume.experience.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5">
                      Experience
                    </h3>
                    <div className="space-y-2">
                      {activeResume.experience.map((e, idx) => (
                        <div key={idx}>
                          <div className="font-bold text-slate-800">{e.role} — {e.company}</div>
                          <p className="text-slate-600 text-[10px]">{e.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {activeResume.education && activeResume.education.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5">
                      Education
                    </h3>
                    <div className="space-y-1">
                      {activeResume.education.map((edu, idx) => (
                        <div key={idx} className="text-slate-700">
                          <span className="font-bold">{edu.institution}</span> — {edu.degree}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI ANALYSIS MODAL */}
        {analysisResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 relative">
              <button
                onClick={() => setAnalysisResult(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">AI ATS Keyword Audit</h3>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="text-xs text-slate-400">Target Role Calibration:</div>
                <div className="text-base font-bold text-white">{analysisResult.targetRole}</div>
                <div className="text-xs text-indigo-400 mt-1">
                  Completeness Index: {analysisResult.completenessScore}%
                </div>
              </div>

              {/* Keyword Coverage */}
              {analysisResult.keywordAnalysis && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">Keyword Alignment:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.keywordAnalysis.matched.map((kw) => (
                      <span key={kw} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ {kw}
                      </span>
                    ))}
                    {analysisResult.keywordAnalysis.missing.map((kw) => (
                      <span key={kw} className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        — {kw} (Consider Adding)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-300 mb-1">Recommended Adjustments:</div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {analysisResult.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-800">
                {analysisResult.disclaimer}
              </p>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
