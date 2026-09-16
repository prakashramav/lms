'use client';

import { Layers } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      title="Real-World Milestone Projects"
      subtitle="Architect production-grade applications from scratch with requirement specs, milestone verification, and AI code reviews."
      icon={Layers}
      phaseNumber="Phase 11"
      features={[
        'Full-stack project specifications & starter templates',
        'Milestone deliverables with GitHub repository integration',
        'Deployment URL verification & live health checking',
        'Automated AI architecture review & rubric scoring',
      ]}
    />
  );
}
