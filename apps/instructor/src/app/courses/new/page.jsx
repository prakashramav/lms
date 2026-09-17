'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InstructorLayout from '../../../components/layout/InstructorLayout';
import { useAuth } from '../../../context/AuthContext';
import { createCourse } from '../../../services/instructorService';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Save,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Layers,
  Globe,
  Clock,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES = [
  'Full Stack Development',
  'Frontend Engineering',
  'Backend Engineering',
  'Data Structures & Algorithms',
  'Artificial Intelligence & ML',
  'DevOps & Cloud',
  'System Design',
  'Cybersecurity',
  'Mobile Development',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function CreateCoursePage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    category: CATEGORIES[0],
    level: 'Beginner',
    language: 'English',
    thumbnail: '',
    banner: '',
    learningObjectivesText: '',
    prerequisitesText: '',
    durationHours: 12,
    tagsText: '',
  });

  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Auto-slug generator
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !isSlugCustomized
        ? title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : prev.slug,
    }));
  };

  const handleSlugChange = (e) => {
    setIsSlugCustomized(true);
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation checks
    if (!formData.title.trim()) {
      setErrorMessage('Course title is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setErrorMessage('Course URL slug is required.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Full course description is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        shortDescription: formData.shortDescription.trim() || formData.title,
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        language: formData.language,
        thumbnail: formData.thumbnail.trim() || undefined,
        banner: formData.banner.trim() || undefined,
        estimatedDuration: Number(formData.durationHours) || 10,
        learningObjectives: formData.learningObjectivesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        prerequisites: formData.prerequisitesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        tags: formData.tagsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        status: 'DRAFT',
      };

      const newCourse = await createCourse(accessToken, payload);
      router.push(`/courses/${newCourse._id}/edit`);
    } catch (err) {
      console.error('Course creation failed:', err);
      setErrorMessage(err.message || 'Failed to initialize course blueprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Step 1: Course Blueprint
          </span>
        </div>

        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Course Blueprint
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define metadata, prerequisites, and goals. You will build modules and interactive lessons next.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GENERAL INFO CARD */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>General Information</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Course Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Full-Stack Web Architecture with Next.js & Node"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>URL Slug <span className="text-rose-400">*</span></span>
                  <span className="text-[11px] text-slate-500 normal-case">
                    URL: /courses/{formData.slug || 'your-slug'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. modern-fullstack-architecture"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Short Tagline / Teaser
                </label>
                <input
                  type="text"
                  placeholder="One sentence summary shown on course cards"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Course Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Comprehensive description of the syllabus, outcomes, and project deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* CLASSIFICATION & METRICS CARD */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Classification & Metadata</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Estimated Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Instruction Language
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="JavaScript, React, Node.js, Architecture"
                value={formData.tagsText}
                onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* MEDIA CARD */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Media & Visual Assets</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.banner}
                  onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* PEDAGOGY OBJECTIVES */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pedagogy & Prerequisites</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Learning Objectives (1 per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Master React Server Components&#10;Implement distributed Redis caching&#10;Pass live coding challenges"
                  value={formData.learningObjectivesText}
                  onChange={(e) => setFormData({ ...formData, learningObjectivesText: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Prerequisites (1 per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Basic JavaScript knowledge&#10;Familiarity with terminal commands"
                  value={formData.prerequisitesText}
                  onChange={(e) => setFormData({ ...formData, prerequisitesText: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/25 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Blueprint...' : 'Create Course & Enter Studio'}</span>
            </button>
          </div>
        </form>
      </div>
    </InstructorLayout>
  );
}
