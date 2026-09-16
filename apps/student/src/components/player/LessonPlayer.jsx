'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export default function LessonPlayer({
  lesson,
  progress = null,
  isBookmarked = false,
  onToggleBookmark = null,
  onUpdatePosition = null,
  onMarkComplete = null,
  isCompleted = false,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Resume playback position
  useEffect(() => {
    if (lesson?.type === 'VIDEO' && videoRef.current) {
      const initialPos = progress?.lastPosition || 0;
      if (initialPos > 0) {
        videoRef.current.currentTime = initialPos;
        setCurrentTime(initialPos);
      }
    }
  }, [lesson?._id, lesson?.type, progress?.lastPosition]);

  // Periodic debounced position sync (every 5 seconds while playing)
  useEffect(() => {
    if (!isPlaying || !onUpdatePosition || lesson?.type !== 'VIDEO') return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const pos = Math.floor(videoRef.current.currentTime);
        onUpdatePosition(pos);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, onUpdatePosition, lesson?.type]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // If >= 90% watched and not marked complete yet, trigger completion recommendation
    if (duration > 0 && curr / duration >= 0.9 && !isCompleted && onMarkComplete) {
      // Auto-suggest or mark
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    if (onUpdatePosition) {
      onUpdatePosition(Math.floor(target));
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 1;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedSelect = (spd) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!lesson) {
    return (
      <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <p className="text-sm">Select a lesson to begin learning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Box / Article Container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl"
      >
        {lesson.type === 'VIDEO' ? (
          <div className="relative group aspect-video w-full flex items-center justify-center bg-black">
            {lesson.videoUrl ? (
              <video
                ref={videoRef}
                src={lesson.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                  setIsPlaying(false);
                  if (onMarkComplete && !isCompleted) onMarkComplete();
                }}
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="text-center p-8 text-slate-400">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Video preview stream not available.</p>
              </div>
            )}

            {/* Video Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none">
              {/* Top Bar: Title & Bookmark */}
              <div className="flex items-center justify-between pointer-events-auto">
                <h4 className="text-sm font-semibold text-white truncate max-w-md drop-shadow">
                  {lesson.title}
                </h4>
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={onToggleBookmark}
                    className={`p-2 rounded-xl backdrop-blur-md transition ${
                      isBookmarked
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Lesson'}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>

              {/* Bottom Controls Bar */}
              <div className="space-y-2 pointer-events-auto">
                {/* Seek Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />

                <div className="flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="p-2 rounded-lg hover:bg-white/20 transition text-white"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>

                    <span className="text-white/80 font-mono text-[11px]">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 relative">
                    {/* Speed Selector */}
                    <button
                      type="button"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-2 py-1 rounded-md text-xs font-semibold bg-white/15 hover:bg-white/25 transition"
                    >
                      {playbackSpeed}x
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-9 right-8 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-xl flex flex-col gap-1 z-30">
                        {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => handleSpeedSelect(spd)}
                            className={`px-3 py-1 text-left text-xs rounded-lg transition ${
                              playbackSpeed === spd
                                ? 'bg-brand-600 text-white font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Article / Reading Mode */
          <div className="p-6 sm:p-10 bg-white dark:bg-slate-900 min-h-[360px] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                <FileText className="w-4 h-4" />
                <span>{lesson.type} LESSON</span>
              </div>
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={onToggleBookmark}
                  className={`p-2 rounded-xl transition ${
                    isBookmarked
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>

            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {lesson.title}
              </h2>
              {lesson.content ? (
                <div className="whitespace-pre-line text-sm sm:text-base space-y-4">
                  {lesson.content}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  {lesson.description || 'Lesson study content.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Details & Completion Action */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {lesson.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {lesson.description || 'Complete this lesson to advance your course curriculum.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onMarkComplete && (
            <button
              type="button"
              onClick={onMarkComplete}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </button>
          )}
        </div>
      </div>

      {/* Lesson Resources Section */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Lesson Resources & Reference Materials
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lesson.resources.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {res.title}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {res.type || 'DOCUMENT'}
                    </span>
                  </div>
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
