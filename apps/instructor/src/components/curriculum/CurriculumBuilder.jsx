'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  Video,
  Code2,
  FileQuestion,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  addModule,
  updateModule,
  deleteModule,
  reorderModules,
  addLesson,
  deleteLesson,
  reorderLessons,
} from '../../services/instructorService';

export default function CurriculumBuilder({ course, accessToken, onRefresh }) {
  const [expandedModules, setExpandedModules] = useState(() => {
    const initial = {};
    if (course.modules && course.modules.length > 0) {
      course.modules.forEach((m) => {
        initial[m._id] = true;
      });
    }
    return initial;
  });

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');

  const [addingLessonModuleId, setAddingLessonModuleId] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('ARTICLE');

  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  // Module actions
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await addModule(accessToken, course._id, {
        title: newModuleTitle.trim(),
        description: newModuleDescription.trim(),
        order: (course.modules?.length || 0) + 1,
      });
      setNewModuleTitle('');
      setNewModuleDescription('');
      setIsAddingModule(false);
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to add module');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateModule = async (moduleId) => {
    if (!editModuleTitle.trim()) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await updateModule(accessToken, moduleId, { title: editModuleTitle.trim() });
      setEditingModuleId(null);
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to update module');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module and its lessons?')) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await deleteModule(accessToken, moduleId);
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to delete module');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMoveModule = async (index, direction) => {
    const modules = [...(course.modules || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const [moved] = modules.splice(index, 1);
    modules.splice(targetIndex, 0, moved);

    setLoadingAction(true);
    setActionError(null);
    try {
      await reorderModules(accessToken, course._id, modules.map((m) => m._id));
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to reorder modules');
    } finally {
      setLoadingAction(false);
    }
  };

  // Lesson actions
  const handleAddLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      const moduleObj = course.modules.find((m) => m._id === moduleId);
      const order = (moduleObj?.lessons?.length || 0) + 1;

      await addLesson(accessToken, moduleId, {
        title: newLessonTitle.trim(),
        type: newLessonType,
        order,
      });

      setNewLessonTitle('');
      setAddingLessonModuleId(null);
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to add lesson');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await deleteLesson(accessToken, lessonId);
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to delete lesson');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMoveLesson = async (moduleObj, lessonIndex, direction) => {
    const lessons = [...(moduleObj.lessons || [])];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const [moved] = lessons.splice(lessonIndex, 1);
    lessons.splice(targetIndex, 0, moved);

    setLoadingAction(true);
    setActionError(null);
    try {
      await reorderLessons(accessToken, moduleObj._id, lessons.map((l) => l._id));
      await onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to reorder lessons');
    } finally {
      setLoadingAction(false);
    }
  };

  const modules = course.modules || [];

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-teal-400" />
            <span>Curriculum Hierarchy</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {modules.length} Modules •{' '}
            {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Lessons
          </p>
        </div>

        <button
          onClick={() => setIsAddingModule(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Module</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
          {actionError}
        </div>
      )}

      {/* ADD MODULE INLINE FORM */}
      {isAddingModule && (
        <form
          onSubmit={handleAddModule}
          className="p-5 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Create New Curriculum Module
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingModule(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              required
              placeholder="e.g. Module 1: Foundations & Architecture Setup"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <input
              type="text"
              placeholder="Module description / learning outcomes (optional)"
              value={newModuleDescription}
              onChange={(e) => setNewModuleDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingModule(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingAction}
              className="px-4 py-1.5 rounded-lg bg-teal-600 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {loadingAction ? 'Adding...' : 'Save Module'}
            </button>
          </div>
        </form>
      )}

      {/* MODULES TREE */}
      {modules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">Your curriculum is empty</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Start structuring your course by adding your first module, then populate it with interactive lessons, quizzes, or coding problems.
          </p>
          <button
            onClick={() => setIsAddingModule(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Module</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((moduleObj, modIdx) => {
            const isExpanded = !!expandedModules[moduleObj._id];
            const isEditing = editingModuleId === moduleObj._id;
            const lessons = moduleObj.lessons || [];

            return (
              <div
                key={moduleObj._id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition"
              >
                {/* MODULE HEADER ROW */}
                <div className="p-4 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleModule(moduleObj._id)}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-teal-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editModuleTitle}
                            onChange={(e) => setEditModuleTitle(e.target.value)}
                            className="px-3 py-1 bg-slate-950 border border-teal-500 rounded-lg text-sm text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleUpdateModule(moduleObj._id)}
                            className="px-2 py-1 bg-teal-600 rounded text-xs text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingModuleId(null)}
                            className="px-2 py-1 text-xs text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                            M{modIdx + 1}:
                          </span>
                          <h4 className="text-sm font-bold text-white truncate">{moduleObj.title}</h4>
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            {lessons.length} lessons
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MODULE CONTROLS */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Move Up/Down */}
                    <button
                      disabled={modIdx === 0 || loadingAction}
                      onClick={() => handleMoveModule(modIdx, 'up')}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move Module Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={modIdx === modules.length - 1 || loadingAction}
                      onClick={() => handleMoveModule(modIdx, 'down')}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move Module Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingModuleId(moduleObj._id);
                        setEditModuleTitle(moduleObj.title);
                      }}
                      className="p-1.5 text-slate-400 hover:text-teal-400 rounded hover:bg-slate-800"
                      title="Rename Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteModule(moduleObj._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setAddingLessonModuleId(moduleObj._id);
                        setExpandedModules((prev) => ({ ...prev, [moduleObj._id]: true }));
                      }}
                      className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Lesson</span>
                    </button>
                  </div>
                </div>

                {/* LESSONS LIST (COLLAPSIBLE) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/40 space-y-3">
                    {/* ADD LESSON INLINE CARD */}
                    {addingLessonModuleId === moduleObj._id && (
                      <div className="p-3 bg-slate-900 border border-teal-500/30 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs text-teal-400 font-semibold">
                          <span>New Lesson</span>
                          <button
                            onClick={() => setAddingLessonModuleId(null)}
                            className="text-slate-400 hover:text-white text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Lesson Title..."
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                          <select
                            value={newLessonType}
                            onChange={(e) => setNewLessonType(e.target.value)}
                            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="ARTICLE">Article / Text</option>
                            <option value="VIDEO">Video Tutorial</option>
                            <option value="QUIZ">Quiz / Assessment</option>
                            <option value="CODE">Coding Sandbox</option>
                          </select>
                          <button
                            onClick={() => handleAddLesson(moduleObj._id)}
                            disabled={loadingAction}
                            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {lessons.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        No lessons in this module yet.{' '}
                        <button
                          onClick={() => setAddingLessonModuleId(moduleObj._id)}
                          className="text-teal-400 hover:underline font-semibold"
                        >
                          Add the first lesson
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {lessons.map((lesson, lesIdx) => (
                          <div
                            key={lesson._id}
                            className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 rounded-xl flex items-center justify-between gap-3 transition"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                                {lesson.type === 'VIDEO' ? (
                                  <Video className="w-3.5 h-3.5" />
                                ) : lesson.type === 'CODE' ? (
                                  <Code2 className="w-3.5 h-3.5" />
                                ) : lesson.type === 'QUIZ' ? (
                                  <FileQuestion className="w-3.5 h-3.5" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-slate-200 truncate">
                                  {lesIdx + 1}. {lesson.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <span className="capitalize">{lesson.type?.toLowerCase() || 'lesson'}</span>
                                  {lesson.duration ? <span>• {lesson.duration}m</span> : null}
                                </div>
                              </div>
                            </div>

                            {/* LESSON ACTIONS */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                disabled={lesIdx === 0 || loadingAction}
                                onClick={() => handleMoveLesson(moduleObj, lesIdx, 'up')}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                disabled={lesIdx === lessons.length - 1 || loadingAction}
                                onClick={() => handleMoveLesson(moduleObj, lesIdx, 'down')}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              <Link
                                href={`/courses/${course._id}/lessons/${lesson._id}/edit`}
                                className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-semibold border border-teal-500/30 transition flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </Link>

                              <button
                                onClick={() => handleDeleteLesson(lesson._id)}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
