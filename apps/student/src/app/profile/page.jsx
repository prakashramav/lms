'use client';

import { User } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function ProfilePage() {
  return (
    <PlaceholderPage
      title="Student Portfolio & Resume Studio"
      subtitle="Craft an ATS-optimized software engineer resume backed by verified coding problems, projects, and certifications."
      icon={User}
      phaseNumber="Phase 22"
      features={[
        'Interactive resume builder with education, skills, and projects',
        'Verified code submission badges and live GitHub repository links',
        'Keyword ATS optimization suggestions based on target roles',
        'Exportable PDF resume with verified credential QR codes',
      ]}
    />
  );
}
