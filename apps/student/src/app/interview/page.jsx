'use client';

import { Cpu } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function InterviewPage() {
  return (
    <PlaceholderPage
      title="AI Technical & Behavioral Mock Interviews"
      subtitle="Realistic simulated interviews covering Frontend, Backend, Full Stack, and System Design with detailed scorecards."
      icon={Cpu}
      phaseNumber="Phase 13"
      features={[
        'Interactive speech & text technical interview sessions',
        'Live coding whiteboard challenges with evaluation',
        'STAR method behavioral interview assessments',
        'Comprehensive scorecard with strengths, weaknesses & practice plans',
      ]}
    />
  );
}
