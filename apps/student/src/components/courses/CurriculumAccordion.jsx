'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  PlayCircle,
  FileText,
  BookOpen,
  Lock,
  CheckCircle2,
  Eye,
  Clock,
} from 'lucide-react';

export default function CurriculumAccordion({
  modules = [],
  activeLessonId = null,
  completedLessonIds = [],
  onSelectLesson = null,
  isEnrolled = false,
}) {
  // By default, expand all modules or at least the one with the active lesson
  const [expandedModuleIds, setExpandedModuleIds] = useState(() => {
    return new Set(modules.map((m) => m._id));
  });

  const toggleModule = (moduleId) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'VIDEO':
        return PlayCircle;
      case 'ARTICLE':
      case 'READING':
        return FileText;
      case 'RESOURCE':
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-3">
      {modules.map((mod, moduleIdx) => {
        const isExpanded = expandedModuleIds.has(mod._id);
        const lessons = mod.lessons || [];
        const completedCount = lessons.filter((l) => completedLessonIds.includes(l._id)).length;

        return (
          <div
            key={mod._id}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden shadow-sm"
          >
            {/* Module Accordion Header */}
            <button
              type="button"
              onClick={() => toggleModule(mod._id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/70 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-750 transition-colors"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg text-slate-400 dark:text-slate-500">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    Module {mod.order || moduleIdx + 1}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {mod.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {completedCount}/{lessons.length} completed
                </span>
              </div>
            </button>

            {/* Module Lessons List */}
            {isExpanded && (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 border-t border-slate-200 dark:border-slate-700">
                {lessons.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">
                    No lessons published in this module yet.
                  </div>
                ) : (
                  lessons.map((lesson, lessonIdx) => {
                    const isCompleted = completedLessonIds.includes(lesson._id);
                    const isActive = activeLessonId === lesson._id;
                    const isLocked = !isEnrolled && !lesson.isPreview;
                    const IconComponent = getLessonIcon(lesson.type);

                    const canClick = isEnrolled || lesson.isPreview || !!onSelectLesson;

                    return (
                      <div
                        key={lesson._id}
                        onClick={() => {
                          if (canClick && onSelectLesson) {
                            onSelectLesson(lesson);
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 sm:px-5 sm:py-4 transition-colors ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : isLocked
                            ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        } ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* State Indicator */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4 text-slate-400" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full border-2 border-brand-600 dark:border-brand-400 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                              </div>
                            ) : (
                              <IconComponent className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          {/* Lesson Title & Order */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {mod.order || moduleIdx + 1}.{lesson.order || lessonIdx + 1}
                              </span>
                              <p
                                className={`text-xs sm:text-sm font-medium truncate ${
                                  isActive
                                    ? 'text-brand-700 dark:text-brand-300 font-bold'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {lesson.title}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Badges: Preview / Duration / Locked status */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {lesson.isPreview && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Eye className="w-3 h-3" />
                              Preview
                            </span>
                          )}

                          {isLocked && !lesson.isPreview && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700">
                              <Lock className="w-2.5 h-2.5" />
                              Locked
                            </span>
                          )}

                          {lesson.duration && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
