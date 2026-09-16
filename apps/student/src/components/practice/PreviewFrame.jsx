'use client';

import React, { useMemo } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

export default function PreviewFrame({ code, language = 'html_css' }) {
  // Generate HTML document bundle for iframe srcDoc
  const previewHtml = useMemo(() => {
    if (!code) return '<!DOCTYPE html><html><body></body></html>';

    if (language === 'html_css') {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; margin: 0; color: #1e293b; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  ${code}
</body>
</html>
`;
    }

    if (language === 'react') {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; margin: 0; color: #1e293b; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}

    // Auto-mount component named Counter, ToggleSwitch, Component, etc.
    try {
      const targetComponent = typeof Counter !== 'undefined' ? Counter :
                              typeof ToggleSwitch !== 'undefined' ? ToggleSwitch :
                              typeof SearchFilter !== 'undefined' ? SearchFilter :
                              typeof AccordionItem !== 'undefined' ? AccordionItem :
                              typeof StarRating !== 'undefined' ? StarRating :
                              typeof Stopwatch !== 'undefined' ? Stopwatch :
                              typeof App !== 'undefined' ? App : null;
      if (targetComponent) {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(targetComponent));
      }
    } catch (e) {
      console.error(e);
    }
  </script>
</body>
</html>
`;
    }

    return code;
  }, [code, language]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">Live Preview</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px]">Sandboxed</span>
        </div>
      </div>
      <div className="flex-1 min-h-[300px] relative bg-white">
        <iframe
          title="Sandbox Preview"
          srcDoc={previewHtml}
          sandbox="allow-scripts"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}
