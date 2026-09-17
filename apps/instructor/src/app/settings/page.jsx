'use client';

import { useState } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  User,
  Shield,
  Bell,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
} from 'lucide-react';

export default function InstructorSettingsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('Senior Faculty Member specializing in Modern Distributed Systems.');
  const [expertise, setExpertise] = useState('Full-Stack Development, React, Node.js, Systems Architecture');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setFeedback({ type: 'success', message: 'Instructor profile saved.' });
  };

  return (
    <InstructorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Faculty Settings</h1>
          <p className="text-sm text-slate-400">
            Manage your instructor profile, security credentials, and platform preferences
          </p>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-2 border-b border-slate-800">
          {[
            { id: 'profile', label: 'Faculty Profile', icon: User },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'notifications', label: 'Preferences', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition ${
                  isActive
                    ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Public Faculty Profile</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1">
                  Institutional Email (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'instructor@example.com'}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1">Bio & Credentials</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-300 mb-1">Domain Expertise</label>
                <input
                  type="text"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Security &amp; Permissions Governance</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Platform Role:</span>
                <span className="font-bold text-teal-400 font-mono">ROLE_INSTRUCTOR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Access Scope:</span>
                <span className="text-slate-300">Authoring, Student Cohort Telemetry, Sandboxes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Admin Elevation:</span>
                <span className="text-rose-400 font-semibold">Strictly Prohibited (RBAC Enforced)</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-slate-400">
                Password changes or two-factor reset keys are issued through platform governance administrators.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PREFERENCES */}
        {activeTab === 'notifications' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Event Notification Preferences</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <span>Receive email alert upon new student course enrollment</span>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <span>Receive alert on automated coding sandbox test run completions</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
