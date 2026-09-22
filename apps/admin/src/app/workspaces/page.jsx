'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  HardDrive,
  Sparkles,
  RefreshCw,
  Power,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Filter,
  DollarSign,
  Clock,
  ChevronRight,
  Shield,
} from 'lucide-react';

export default function AdminWorkspacesPage() {
  const [metrics, setMetrics] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch metrics
      const metricsRes = await fetch('/api/v1/admin/workspaces/metrics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      // 2. Fetch active workspaces
      const wsRes = await fetch(`/api/v1/admin/workspaces?limit=50${filterStatus ? `&status=${filterStatus}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const wsData = await wsRes.json();
      if (wsData.success) {
        setWorkspaces(wsData.data || []);
      }

      // 3. Fetch template registry
      const tplRes = await fetch('/api/v1/workspaces/templates');
      const tplData = await tplRes.json();
      if (tplData.success) {
        setTemplates(tplData.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, [filterStatus]);

  // Toggle template status
  const handleToggleTemplate = async (templateId, currentDisabled) => {
    try {
      const res = await fetch(`/api/v1/admin/workspaces/templates/${templateId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ enabled: Boolean(currentDisabled) }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, disabled: !currentDisabled } : t))
        );
      }
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  // Force terminate rogue workspace
  const handleForceTerminate = async (workspaceId) => {
    if (!confirm('Are you sure you want to force-terminate this workspace?')) return;
    try {
      const res = await fetch(`/api/v1/admin/workspaces/${workspaceId}/terminate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaces((prev) =>
          prev.map((w) => (w._id === workspaceId ? { ...w, status: 'STOPPED' } : w))
        );
      }
    } catch (err) {
      alert(`Termination failed: ${err.message}`);
    }
  };

  const filteredWorkspaces = workspaces.filter((w) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.userId?.name?.toLowerCase().includes(q) ||
      w.userId?.email?.toLowerCase().includes(q) ||
      w.templateId?.toLowerCase().includes(q) ||
      w._id?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Cloud Workspace Governance</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Orchestrator
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monitor active student environments, allocate resource profiles, track GPU and token costs, and manage runtime templates.
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* 1. TELEMETRY STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Workspaces</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {metrics?.activeWorkspaces ?? '--'}
            </div>
            <div className="text-[11px] text-slate-500">
              Total Managed: {metrics?.totalWorkspaces ?? '--'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>GPU Utilization</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {metrics?.gpuMinutesTotal ?? 0} <span className="text-xs font-normal text-slate-400">mins</span>
            </div>
            <div className="text-[11px] text-purple-400">
              Dedicated GPU Workers Scheduled
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Storage Allocated</span>
              <HardDrive className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {metrics?.storageEstimateMB ? Math.round(metrics.storageEstimateMB / 1024) : 0} <span className="text-xs font-normal text-slate-400">GB</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Persistent Disk Volumes (ext4/mounts)
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>AI Gateway Tokens</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {metrics?.aiTokenUsageTotal ? (metrics.aiTokenUsageTotal / 1000).toFixed(1) + 'k' : '0'}
            </div>
            <div className="text-[11px] text-amber-400">
              Est. Cost: ${metrics?.estimatedCloudCostUSD?.toFixed(4) || '0.0000'}
            </div>
          </div>
        </div>

        {/* 2. TEMPLATE REGISTRY & RUNTIMES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Workspace Template Registry</h2>
              <p className="text-xs text-slate-400">Manage framework versions, base images, and runtime availability.</p>
            </div>
            <span className="text-xs font-mono text-teal-400">{templates.length} Registered Templates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{tpl.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-slate-900 text-slate-300 border border-slate-800">
                      {tpl.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Runtime: {tpl.runtime?.version || tpl.runtime?.language} • Profile: {tpl.resourceProfile}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleTemplate(tpl.id, tpl.disabled)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    tpl.disabled
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {tpl.disabled ? 'Disabled' : 'Active'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ACTIVE WORKSPACES TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Active & Recent Workspaces</h2>
              <p className="text-xs text-slate-400">Real-time instance status and student volume allocation.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, template, ID..."
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="RUNNING">Running</option>
                <option value="STOPPED">Stopped</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Profile</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredWorkspaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No matching workspaces found.
                    </td>
                  </tr>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <tr key={ws._id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white font-sans">{ws.userId?.name || 'Unknown User'}</div>
                        <div className="text-[10px] text-slate-500">{ws.userId?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-teal-400 font-bold">{ws.templateId}</span>
                        <div className="text-[10px] text-slate-500 font-sans">{ws.workspaceType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ws.status === 'RUNNING'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ws.status === 'STOPPED'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ws.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-300">
                        {ws.resourceProfile} ({ws.hardware || 'cpu'})
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400 font-sans">
                        {new Date(ws.lastActiveAt || ws.updatedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ws.status === 'RUNNING' && (
                          <button
                            onClick={() => handleForceTerminate(ws._id)}
                            className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-800/80 transition"
                            title="Force Terminate"
                          >
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
