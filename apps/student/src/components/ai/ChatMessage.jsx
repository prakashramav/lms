'use client';

import { useState } from 'react';
import { Sparkles, User, Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';

/**
 * Parses markdown into structured elements (headers, code blocks, lists, bold)
 */
function renderMarkdownContent(content, onCopy) {
  if (!content) return null;

  const parts = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines = [];
  let blockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeLines.join('\n');
        parts.push(
          <div key={`code-${blockKey++}`} className="my-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 text-xs sm:text-sm font-mono text-slate-200">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[11px] text-slate-400">
              <span className="font-semibold uppercase">{codeLanguage || 'code'}</span>
              <button
                type="button"
                onClick={() => onCopy(codeText)}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Copy Code"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed">{codeText}</pre>
          </div>
        );
        inCodeBlock = false;
        codeLines = [];
        codeLanguage = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      parts.push(
        <h4 key={`h4-${i}`} className="font-bold text-slate-900 dark:text-white mt-3 mb-1 text-sm sm:text-base">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('#### ')) {
      parts.push(
        <h5 key={`h5-${i}`} className="font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1 text-xs sm:text-sm">
          {line.slice(5)}
        </h5>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      parts.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-slate-300 my-0.5">
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      parts.push(
        <li key={`nli-${i}`} className="ml-4 list-decimal text-xs sm:text-sm text-slate-700 dark:text-slate-300 my-0.5">
          {formatInline(line.replace(/^\d+\.\s/, ''))}
        </li>
      );
    } else if (line.trim() === '') {
      parts.push(<div key={`empty-${i}`} className="h-2" />);
    } else {
      parts.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {formatInline(line)}
        </p>
      );
    }
  }

  return parts;
}

/**
 * Handles basic inline bold **text** and inline `code`
 */
function formatInline(str) {
  const chunks = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIdx = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      chunks.push(str.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      chunks.push(
        <strong key={`b-${key++}`} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      chunks.push(
        <code
          key={`c-${key++}`}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < str.length) {
    chunks.push(str.slice(lastIdx));
  }

  return chunks;
}

export default function ChatMessage({ message, onFeedback, onRetry, isLatest }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'USER';

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 my-4 group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/70 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="space-y-1">
              {renderMarkdownContent(message.content, handleCopy)}
            </div>
          )}
        </div>

        {/* Action Controls & AI Transparency Banner */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-slate-400">
            <span>AI-generated • Verify important details</span>

            <div className="flex items-center gap-1 ml-auto opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleCopy(message.content)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Copy entire response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {onFeedback && (
                <>
                  <button
                    type="button"
                    onClick={() => onFeedback(message._id, 'HELPFUL')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      message.feedback?.rating === 'HELPFUL' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback(message._id, 'UNHELPFUL')}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      message.feedback?.rating === 'UNHELPFUL' ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Not Helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {onRetry && isLatest && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Regenerate response"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
