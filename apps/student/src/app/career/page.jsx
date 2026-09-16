'use client';

import { Compass } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function CareerPage() {
  return (
    <PlaceholderPage
      title="Dynamic Career Roadmap & Skill Gap Analyzer"
      subtitle="Map your target role, discover required industry competencies, and track your progression from novice to staff engineer."
      icon={Compass}
      phaseNumber="Phase 14"
      features={[
        'Target role calibration (Frontend, Backend, Full Stack, AI/ML)',
        'Automated skill gap matrix comparing your code history to job specs',
        'Personalized project & assessment preparation schedule',
        'Interactive roadmap with milestone badges and readiness indicators',
      ]}
    />
  );
}
