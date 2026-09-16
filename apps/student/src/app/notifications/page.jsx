'use client';

import { Bell } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      title="Notification & Communications Center"
      subtitle="View all platform alerts, code submission evaluations, instructor feedback, and job match notifications."
      icon={Bell}
      phaseNumber="Phase 8"
      features={[
        'Real-time WebSocket alerts for automated test completions',
        'Instructor feedback on project milestones and assignments',
        'Daily learning streak alerts and goal celebration milestones',
        'Direct employer application status updates and interview invites',
      ]}
    />
  );
}
