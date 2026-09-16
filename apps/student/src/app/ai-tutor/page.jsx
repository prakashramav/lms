'use client';

import { Sparkles } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function AITutorPage() {
  return (
    <PlaceholderPage
      title="RAG-Powered AI Technical Tutor"
      subtitle="Context-aware AI tutor trained on complete platform curriculums with 5 levels of pedagogical assistance."
      icon={Sparkles}
      phaseNumber="Phase 12"
      features={[
        'Vector search RAG over platform course modules and syntax guides',
        'Multi-level hints: Concept -> Approach -> Pseudo-code -> Code Review',
        'Interactive code debugging & tailored practice problem generation',
        'Conversational memory scoped to your active lesson and struggles',
      ]}
    />
  );
}
