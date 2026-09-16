'use client';

import { Briefcase } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function JobsPage() {
  return (
    <PlaceholderPage
      title="Curated Engineering Opportunities & Job Board"
      subtitle="Discover technology opportunities matching your verified code scorecards, projects, and interview readiness index."
      icon={Briefcase}
      phaseNumber="Phase 15"
      features={[
        'Direct company job listings with verified salary ranges',
        'One-click verified profile applications with coding artifacts',
        'End-to-end application lifecycle tracking (Applied → Screening → Offer)',
        'Company hiring insights & tech stack compatibility scores',
      ]}
    />
  );
}
