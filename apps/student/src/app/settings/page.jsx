'use client';

import { Settings } from 'lucide-react';
import PlaceholderPage from '../../components/common/PlaceholderPage';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Account, Security & Notification Preferences"
      subtitle="Manage your authentication credentials, multi-factor security, session devices, and communication preferences."
      icon={Settings}
      phaseNumber="Phase 21"
      features={[
        'Password change and active login session management',
        'Email notification and daily goal reminder preferences',
        'Coding editor Monaco keybinding customization (Vim / Emacs / Default)',
        'Theme configuration & accessibility contrast settings',
      ]}
    />
  );
}
