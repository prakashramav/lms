'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import InstructorLayout from '../../../../../../components/layout/InstructorLayout';
import { useAuth } from '../../../../../../context/AuthContext';
import {
  fetchCourseDetail,
  updateLesson,
  uploadFile,
  attachResource,
  deleteResource,
} from '../../../../../../services/instructorService';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  RotateCw,
  Eye,
  FileText,
  Video,
  Code2,
  Paperclip,
  Upload,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Sparkles,
  Play,
  Copy,
} from 'lucide-react';

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'video', 'code', 'resources'
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'

  // Editable fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('ARTICLE');
  const [duration, setDuration] = useState(15);
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoProvider, setVideoProvider] = useState('YOUTUBE');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeSnippet, setCodeSnippet] = useState('// Write your demonstration code here\nfunction calculateMetrics(items) {\n  return items.reduce((acc, item) => acc + item.value, 0);\n}');
  const [resources, setResources] = useState([]);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Load lesson & course details
  const loadLessonData = async () => {
    if (!accessToken || !courseId || !lessonId) return;
    setIsLoading(true);
    try {
      const c = await fetchCourseDetail(accessToken, courseId);
      setCourse(c);

      // Locate lesson inside course modules
      let foundLesson = null;
      if (c.modules) {
        for (const mod of c.modules) {
          const l = (mod.lessons || []).find((item) => item._id === lessonId);
          if (l) {
            foundLesson = l;
            break;
          }
        }
      }

      if (foundLesson) {
        setLesson(foundLesson);
        setTitle(foundLesson.title || '');
        setType(foundLesson.type || 'ARTICLE');
        setDuration(foundLesson.duration || 15);
        setContent(foundLesson.content || '');
        setVideoUrl(foundLesson.videoUrl || '');
        setVideoProvider(foundLesson.videoProvider || 'YOUTUBE');
        setCodeLanguage(foundLesson.codeLanguage || 'javascript');
        if (foundLesson.codeSnippet) setCodeSnippet(foundLesson.codeSnippet);
        setResources(foundLesson.resources || []);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error loading lesson:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessonData();
  }, [accessToken, courseId, lessonId]);

  // Autosave with debounce
  useEffect(() => {
    if (isLoading || !lesson) return;
    setSaveStatus('unsaved');

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateLesson(accessToken, lessonId, {
          title,
          type,
          duration: Number(duration) || 10,
          content,
          videoUrl,
          videoProvider,
          codeLanguage,
          codeSnippet,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, type, duration, content, videoUrl, videoProvider, codeLanguage, codeSnippet]);

  // File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds max allowed size of 25MB');
      return;
    }

    setUploadingFile(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const uploadRes = await uploadFile(accessToken, {
          name: file.name,
          data: base64Data,
          mimeType: file.type || 'application/octet-stream',
          folder: 'course-resources',
        });

        // Attach resource to lesson
        const attached = await attachResource(accessToken, lessonId, {
          name: file.name,
          type: file.type.includes('pdf') ? 'PDF' : 'DOCUMENT',
          url: uploadRes.url,
          key: uploadRes.key,
          size: file.size,
          mimeType: file.type,
          courseId,
        });

        setResources((prev) => [...prev, attached]);
      } catch (err) {
        setUploadError(err.message || 'File upload failed');
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await deleteResource(accessToken, resourceId);
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  if (isLoading) {
    return (
      <InstructorLayout>
        <div className="h-96 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${courseId}/edit`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Return to Curriculum"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md">
                  {title || 'Untitled Lesson'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {type}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Course: <span className="text-slate-200">{course?.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Autosave Status */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <span className="text-slate-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 animate-spin text-teal-400" />
                  Autosaving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Unsaved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Save error
                </span>
              )}
            </div>

            {/* Preview Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                previewMode
                  ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? 'Exit Preview' : 'Student Preview'}</span>
            </button>
          </div>
        </div>

        {/* PREVIEW VIEWPORT IF ACTIVE */}
        {previewMode ? (
          <div className="space-y-4">
            {/* VIEWPORT RESIZE CONTROLS */}
            <div className="flex items-center justify-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 max-w-xs mx-auto">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  previewDevice === 'desktop' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  previewDevice === 'tablet' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span>Tablet</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  previewDevice === 'mobile' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex justify-center">
              <div
                className={`rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl transition-all ${
                  previewDevice === 'desktop'
                    ? 'w-full max-w-4xl'
                    : previewDevice === 'tablet'
                    ? 'w-[768px]'
                    : 'w-[390px]'
                }`}
              >
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold uppercase tracking-wider">
                    <span>{course?.title}</span>
                    <span>•</span>
                    <span>{duration} min estimated</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-white">{title}</h1>
                </div>

                {/* Video Preview */}
                {videoUrl && (
                  <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-slate-800 flex items-center justify-center">
                    {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={videoUrl.replace('watch?v=', 'embed/')}
                        title="Video Preview"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <video src={videoUrl} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                {/* Text Content */}
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {content || 'No text content provided for this lesson.'}
                </div>

                {/* Code Block Preview */}
                {codeSnippet && (
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden space-y-0">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-teal-400">{codeLanguage}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(codeSnippet)}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
                      <code>{codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Attached Resources */}
                {resources.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Downloadable Resources
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {resources.map((r) => (
                        <a
                          key={r._id}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200 hover:border-teal-500/50 transition"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-teal-400" />
                            <span className="truncate">{r.name}</span>
                          </div>
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EDITOR TABS & FORMS */
          <div className="space-y-6">
            {/* GENERAL PROPERTIES BAR */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Understanding Event Loop & Async Microtasks"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1 border-b border-slate-800">
              {[
                { id: 'content', label: 'Written Content', icon: FileText },
                { id: 'video', label: 'Video Resource', icon: Video },
                { id: 'code', label: 'Code Sandbox & Snippet', icon: Code2 },
                { id: 'resources', label: 'File Attachments', icon: Paperclip },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition ${
                      isActive
                        ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: WRITTEN CONTENT */}
            {activeTab === 'content' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Lesson Markdown & Narrative</h3>
                  <span className="text-xs text-slate-500">Supports full markdown syntax</span>
                </div>
                <textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="## Architectural Overview&#10;&#10;Write lesson content here... Use headers, bullet points, callout quotes, and code blocks."
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            )}

            {/* TAB CONTENT: VIDEO RESOURCE */}
            {activeTab === 'video' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-2xl">
                <h3 className="text-sm font-bold text-white">Attached Video Content</h3>
                <p className="text-xs text-slate-400">
                  Embed video lectures hosted on YouTube, Vimeo, Cloudinary, or any direct MP4 CDN stream. Large files are abstracted away from database storage.
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Video Stream URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or https://cdn.example.com/lecture.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Provider
                    </label>
                    <select
                      value={videoProvider}
                      onChange={(e) => setVideoProvider(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="YOUTUBE">YouTube</option>
                      <option value="VIMEO">Vimeo</option>
                      <option value="CLOUDINARY">Cloudinary Video</option>
                      <option value="DIRECT">Direct MP4 CDN</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CODE SNIPPET */}
            {activeTab === 'code' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Live Code Demonstration</h3>
                    <p className="text-xs text-slate-400">
                      Executable or syntax-highlighted code sample for students to study and test
                    </p>
                  </div>

                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-teal-400 font-mono focus:outline-none"
                  >
                    <option value="javascript">JavaScript (Node/ESM)</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python 3</option>
                    <option value="java">Java 21</option>
                    <option value="cpp">C++ 20</option>
                    <option value="html">HTML / CSS</option>
                  </select>
                </div>

                <textarea
                  rows={14}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            )}

            {/* TAB CONTENT: RESOURCES & ATTACHMENTS */}
            {activeTab === 'resources' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-white">Course Materials & Downloads</h3>
                  <p className="text-xs text-slate-400">
                    Upload slide decks (PDF/PPTX), starter boilerplates (ZIP), cheat sheets, or data files.
                  </p>
                </div>

                {uploadError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                    {uploadError}
                  </div>
                )}

                {/* UPLOAD TRIGGER */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-teal-500/50 transition text-center space-y-3">
                  <Upload className="w-8 h-8 text-teal-400 mx-auto" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Upload PDF, Presentation, or Archive
                    </p>
                    <p className="text-[11px] text-slate-500">Max file size 25MB</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.tar.gz,.png,.jpg"
                  />
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                  >
                    {uploadingFile ? 'Uploading...' : 'Browse & Attach File'}
                  </button>
                </div>

                {/* ATTACHED LIST */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Attached Files ({resources.length})
                  </h4>

                  {resources.length === 0 ? (
                    <p className="text-xs text-slate-500">No resources attached to this lesson yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {resources.map((r) => (
                        <div
                          key={r._id}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="text-slate-200 truncate">{r.name}</span>
                            {r.size && (
                              <span className="text-[10px] text-slate-500">
                                ({Math.round(r.size / 1024)} KB)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-white"
                              title="Download / View"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteResource(r._id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Remove Resource"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
