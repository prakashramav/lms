'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';
import { aiService } from '../../services/aiService';

import ChatMessage from '../../components/ai/ChatMessage';
import ChatInput from '../../components/ai/ChatInput';
import ConversationList from '../../components/ai/ConversationList';
import ContextBadge from '../../components/ai/ContextBadge';
import LearningModeSelector from '../../components/ai/LearningModeSelector';
import SuggestedPrompts from '../../components/ai/SuggestedPrompts';
import TypingIndicator from '../../components/ai/TypingIndicator';

import { Sparkles, Menu, X, AlertCircle } from 'lucide-react';

function AITutorContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();

  // URL context params
  const courseIdParam = searchParams.get('courseId');
  const lessonIdParam = searchParams.get('lessonId');
  const problemIdParam = searchParams.get('problemId');

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [learningMode, setLearningMode] = useState('GUIDED');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Load conversations on mount
  useEffect(() => {
    if (!accessToken) return;

    const init = async () => {
      try {
        setLoading(true);
        const res = await aiService.getConversations(accessToken);
        const convs = res.data?.conversations || [];
        setConversations(convs);

        // Initial context from query params if present
        let initContext = null;
        if (courseIdParam || lessonIdParam || problemIdParam) {
          initContext = {
            courseId: courseIdParam || null,
            lessonId: lessonIdParam || null,
            problemId: problemIdParam || null,
          };
          setContext(initContext);
        }

        if (convs.length > 0) {
          // Select most recent conversation
          await selectConversation(convs[0]._id);
        } else {
          // Create initial conversation
          await handleNewConversation(initContext);
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize AI Tutor');
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Select conversation
  const selectConversation = async (convId) => {
    try {
      setActiveConversationId(convId);
      setIsMobileDrawerOpen(false);
      const res = await aiService.getConversationById(accessToken, convId);
      setMessages(res.data?.messages || []);
      const conv = res.data?.conversation;
      if (conv) {
        setLearningMode(conv.mode || 'GUIDED');
        if (conv.context) {
          setContext(conv.context);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversation messages');
    }
  };

  // Create new conversation
  const handleNewConversation = async (customContext = null) => {
    try {
      const activeCtx = customContext || context || {};
      const res = await aiService.createConversation(accessToken, {
        title: 'New Learning Chat',
        mode: learningMode,
        context: activeCtx,
      });

      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv._id);
      setMessages([]);
      setIsMobileDrawerOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to create new conversation');
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId) => {
    try {
      await aiService.deleteConversation(accessToken, convId);
      const remaining = conversations.filter((c) => c._id !== convId);
      setConversations(remaining);

      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          await selectConversation(remaining[0]._id);
        } else {
          await handleNewConversation();
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  // Send message
  const handleSendMessage = async (text) => {
    if (!text.trim() || !activeConversationId || isGenerating) return;

    // Optimistic user message append
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsGenerating(true);
    setError(null);

    // Prepare assistant streaming placeholder
    let streamedContent = '';
    const tempAssistantId = `temp-assist-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        _id: tempAssistantId,
        role: 'ASSISTANT',
        content: '',
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      await aiService.streamMessage(
        accessToken,
        activeConversationId,
        {
          message: text,
          context,
          mode: learningMode,
        },
        {
          onToken: (token) => {
            streamedContent += token;
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempAssistantId ? { ...msg, content: streamedContent } : msg
              )
            );
          },
          onDone: (data) => {
            setIsGenerating(false);
            if (data?.messageId) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempAssistantId ? { ...msg, _id: data.messageId } : msg
                )
              );
            }
            // Refresh conversation title if it was first message
            aiService.getConversations(accessToken).then((r) => {
              if (r.data?.conversations) setConversations(r.data.conversations);
            });
          },
          onError: async (err) => {
            // Fallback to synchronous message send
            try {
              const res = await aiService.sendMessage(accessToken, activeConversationId, {
                message: text,
                context,
                mode: learningMode,
              });

              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempAssistantId
                    ? {
                        ...msg,
                        _id: res.data.assistantMessage._id,
                        content: res.data.assistantMessage.content,
                      }
                    : msg
                )
              );
            } catch (fallbackErr) {
              setError(fallbackErr.message || 'AI generation failed');
              setMessages((prev) => prev.filter((m) => m._id !== tempAssistantId));
            } finally {
              setIsGenerating(false);
            }
          },
        }
      );
    } catch (err) {
      setError(err.message || 'Error communicating with AI service');
      setIsGenerating(false);
    }
  };

  // Feedback handler
  const handleFeedback = async (messageId, rating) => {
    try {
      await aiService.submitFeedback(accessToken, messageId, { rating });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, feedback: { rating } } : m))
      );
    } catch {}
  };

  // Clear context
  const handleClearContext = () => {
    setContext(null);
  };

  return (
    <StudentLayout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-100 dark:bg-slate-950">
        {/* Desktop Sidebar: Conversation List */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0 h-full">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={() => handleNewConversation()}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="relative w-80 max-w-[80%] h-full bg-white dark:bg-slate-900 z-10 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversations</span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={selectConversation}
                  onNewConversation={() => handleNewConversation()}
                  onDeleteConversation={handleDeleteConversation}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Workspace */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
          {/* Chat Workspace Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Open Chats Drawer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  AI Technical Tutor
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Context-aware Socratic mentor & code companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LearningModeSelector mode={learningMode} onSelectMode={setLearningMode} />
            </div>
          </div>

          {/* Context Banner (If Attached) */}
          {context && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
              <ContextBadge context={context} onClearContext={handleClearContext} />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="m-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="font-semibold underline ml-2">
                Dismiss
              </button>
            </div>
          )}

          {/* Messages Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {messages.length === 0 ? (
              <div className="max-w-xl mx-auto py-10 space-y-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    How can I assist your learning today?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Ask questions about your current curriculum, request progressive hints for coding problems, or review technical concepts.
                  </p>
                </div>

                <SuggestedPrompts context={context} onSelectPrompt={handleSendMessage} />
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={msg._id || index}
                    message={msg}
                    onFeedback={handleFeedback}
                    onRetry={() => handleSendMessage(messages[messages.length - 2]?.content)}
                    isLatest={index === messages.length - 1}
                  />
                ))}

                {isGenerating && !messages.some((m) => m._id.startsWith('temp-assist') && m.content) && (
                  <TypingIndicator />
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isGenerating}
                placeholder={
                  context?.lessonTitle
                    ? `Ask anything about "${context.lessonTitle}"...`
                    : context?.problemTitle
                    ? `Ask about problem "${context.problemTitle}"...`
                    : 'Ask anything about full-stack engineering, algorithms, or concepts...'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default function AITutorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <Sparkles className="w-5 h-5 text-blue-500 animate-spin" />
            <span>Loading AI Tutor workspace...</span>
          </div>
        </div>
      }
    >
      <AITutorContent />
    </Suspense>
  );
}
