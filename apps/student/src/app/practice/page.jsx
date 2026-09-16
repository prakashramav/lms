'use client';

import { Terminal } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function PracticePage() {
  return (
    <PlaceholderPage
      title="Live Coding Practice Sandbox"
      subtitle="Isolated Monaco editor environment with automated unit tests for JavaScript, React, Node.js, and Express."
      icon={Terminal}
      phaseNumber="Phase 10"
      features={[
        'Full Monaco Editor with syntax highlighting & autocompletion',
        'Sandboxed browser iframe live preview for HTML/CSS/JS and React',
        'Remote Docker sandbox runner for Node.js & Express REST endpoints',
        'Visible and hidden test case evaluation with memory/CPU limits',
      ]}
    />
  );
}
