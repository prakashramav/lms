'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Bookmark, ArrowRight, Code2 } from 'lucide-react';
import { practiceService } from '@/services/practiceService';

export default function ProblemCard({ problem, onBookmarkToggle }) {
  const [isBookmarked, setIsBookmarked] = useState(problem.isBookmarked || false);
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoadingBookmark(true);
    try {
      const res = await practiceService.toggleBookmark(problem._id);
      setIsBookmarked(res.data.isBookmarked);
      if (onBookmarkToggle) {
        onBookmarkToggle(problem._id, res.data.isBookmarked);
      }
    } catch {
      // Revert optimistic state on error
      setIsBookmarked(!isBookmarked);
    } finally {
      setIsLoadingBookmark(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Easy
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Medium
          </span>
        );
      case 'HARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'JAVASCRIPT':
        return 'JavaScript';
      case 'HTML_CSS':
        return 'HTML & CSS';
      case 'REACT':
        return 'React';
      case 'NODE':
        return 'Node.js';
      case 'EXPRESS':
        return 'Express.js';
      default:
        return category;
    }
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getDifficultyBadge(problem.difficulty)}
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {getCategoryLabel(problem.category)}
            </span>
            {problem.isSolved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Solved
              </span>
            )}
          </div>

          <button
            onClick={handleBookmark}
            disabled={isLoadingBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bookmark
              className={`w-4 h-4 ${
                isBookmarked
                  ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400'
                  : ''
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <Link href={`/practice/problems/${problem.slug}`}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {problem.title}
          </h3>
        </Link>

        {/* Description snippet */}
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {problem.description?.replace(/```[\s\S]*?```/g, '').replace(/`.*?`/g, '')}
        </p>

        {/* Topics Tags */}
        {problem.topics && problem.topics.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {problem.topics.slice(0, 3).map((topic, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
              >
                {topic}
              </span>
            ))}
            {problem.topics.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium">
                +{problem.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <Code2 className="w-3.5 h-3.5" />
          <span>
            {problem.acceptanceRate !== undefined ? `${problem.acceptanceRate}% acceptance` : 'Ready'}
          </span>
        </div>

        <Link
          href={`/practice/problems/${problem.slug}`}
          className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:translate-x-0.5 transition-all"
        >
          {problem.isSolved ? 'Solve Again' : 'Solve Problem'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
