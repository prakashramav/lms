'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, Plus, MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('TECHNICAL');
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial mock tickets if offline
    setTickets([
      {
        ticketId: 'TCK-A904F',
        subject: 'Sandbox timeout on exercise 4',
        category: 'TECHNICAL',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        messages: [
          { senderRole: 'STUDENT', message: 'The test runner timed out after 5 seconds on the recursive problem.', timestamp: new Date() },
          { senderRole: 'INSTRUCTOR', message: 'Hello! Check if your base case terminates properly for empty arrays.', timestamp: new Date() },
        ],
      },
      {
        ticketId: 'TCK-B102C',
        subject: 'Career roadmap milestone approval',
        category: 'CAREER',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        messages: [
          { senderRole: 'STUDENT', message: 'Completed all prerequisite full stack courses. Ready for review.', timestamp: new Date() },
          { senderRole: 'ADMIN', message: 'Congratulations! Your milestone is verified and unlocked.', timestamp: new Date() },
        ],
      },
    ]);
  }, []);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!subject || !message) return;

    const newTicket = {
      ticketId: `TCK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      subject,
      category,
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      messages: [{ senderRole: 'STUDENT', message, timestamp: new Date() }],
    };

    setTickets([newTicket, ...tickets]);
    setSelectedTicket(newTicket);
    setIsCreating(false);
    setSubject('');
    setMessage('');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyMessage || !selectedTicket) return;

    const updated = {
      ...selectedTicket,
      messages: [
        ...selectedTicket.messages,
        { senderRole: 'STUDENT', message: replyMessage, timestamp: new Date() },
      ],
    };

    setTickets(tickets.map((t) => (t.ticketId === selectedTicket.ticketId ? updated : t)));
    setSelectedTicket(updated);
    setReplyMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-indigo-400" /> Student Support & Helpdesk
          </h1>
          <p className="text-slate-400 text-sm">
            AI-assisted triage with direct escalation to platform instructors and administrators.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> New Support Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Your Tickets ({tickets.length})</h2>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.ticketId}
                onClick={() => { setSelectedTicket(t); setIsCreating(false); }}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedTicket?.ticketId === t.ticketId
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-indigo-400">{t.ticketId}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="text-sm font-semibold truncate">{t.subject}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>{t.category}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket View or Creation Modal */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[450px] flex flex-col justify-between">
          {isCreating ? (
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <h2 className="text-lg font-bold text-white">Create Support Ticket</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="TECHNICAL">Technical Issue / Bug</option>
                  <option value="COURSE">Curriculum / Lesson Question</option>
                  <option value="ACCOUNT">Account & Access</option>
                  <option value="CAREER">Career & Job Support</option>
                  <option value="OTHER">Other Query</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Detailed Explanation</label>
                <textarea
                  rows={5}
                  placeholder="Describe what happened and any steps to reproduce..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition"
                >
                  Submit Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : selectedTicket ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-semibold">{selectedTicket.ticketId}</span>
                    <h2 className="text-lg font-bold text-white mt-0.5">{selectedTicket.subject}</h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                    {selectedTicket.category}
                  </span>
                </div>

                <div className="py-4 space-y-3 max-h-[280px] overflow-y-auto pr-2">
                  {selectedTicket.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl text-sm ${
                        m.senderRole === 'STUDENT'
                          ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 ml-8'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-300 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold">{m.senderRole === 'STUDENT' ? 'You' : `${m.senderRole} Support`}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div>{m.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendReply} className="flex gap-2 pt-4 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Type a message or response..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a ticket to view conversation or create a new support inquiry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
