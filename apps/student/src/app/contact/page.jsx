'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle2, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Support',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate user-facing inquiry submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Platform
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Mail className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold tracking-tight text-white">Support & Contact</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Need assistance with an enrollment, assessment, or platform inquiry? Reach out below.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-semibold text-white">Inquiry Received</h3>
              <p className="text-slate-300 text-sm max-w-md mx-auto">
                Thank you for contacting ApexLearn support. Our team will review your ticket and reply to{' '}
                <strong className="text-white">{formData.email}</strong> within 24 business hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Inquiry Category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General Support">General Support</option>
                  <option value="Course Enrollment">Course Enrollment Issue</option>
                  <option value="Assessment Issue">Assessment / Grading Question</option>
                  <option value="Sandbox Practice">Coding Sandbox Bug</option>
                  <option value="Data Privacy">Data Privacy / GDPR Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your issue or feedback in detail..."
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
