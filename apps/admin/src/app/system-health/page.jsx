'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import {
  Activity,
  Database,
  Server,
  Cpu,
  Terminal,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSystemHealth();
      setHealth(res.data);
    } catch (err) {
      console.error('Health fetch failed:', err);
      setError(err.message || 'Failed to poll system health probe');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Health & Infrastructure</h1>
            <p className="text-xs text-slate-400 mt-1">
              Active probes and health checks across database, microservice sandbox runners, and cloud providers
            </p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Poll Cluster</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && !health ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Executing cluster diagnostic probe...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Status Banner */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between ${
              health?.status === 'OPERATIONAL'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  health?.status === 'OPERATIONAL' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                }`}></div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Platform Status: {health?.status}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Response time: {health?.responseTimeMs || 4} ms • Probe timestamp: {health?.timestamp}
                  </p>
                </div>
              </div>
            </div>

            {/* Component Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Backend Service */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Server className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Backend Node Process</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    {health?.components.backend.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="text-slate-200 font-mono">{Math.round((health?.components.backend.uptimeSeconds || 0) / 60)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory (Heap):</span>
                    <span className="text-slate-200 font-mono">{health?.components.backend.memoryUsageMb.heapUsed} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node Runtime:</span>
                    <span className="text-slate-200 font-mono">{health?.components.backend.nodeVersion}</span>
                  </div>
                </div>
              </div>

              {/* Database Service */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white">MongoDB Persistence</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    {health?.components.database.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Ping Latency:</span>
                    <span className="text-emerald-400 font-mono font-semibold">{health?.components.database.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection State:</span>
                    <span className="text-slate-200 font-mono">{health?.components.database.connectionState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Replication / Shard:</span>
                    <span className="text-slate-200 font-mono">Standalone / Replica</span>
                  </div>
                </div>
              </div>

              {/* Online Judge Sandboxes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Online Judge Engine</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    {health?.components.onlineJudge.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Runners:</span>
                    <span className="text-slate-200 font-mono">JavaScript, Python</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Isolation:</span>
                    <span className="text-slate-200 font-mono">Process-Isolated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeout Ceiling:</span>
                    <span className="text-slate-200 font-mono">5000 ms</span>
                  </div>
                </div>
              </div>

              {/* AI Provider */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white">AI Provider Infrastructure</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    {health?.components.aiProvider.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Active Mode:</span>
                    <span className="text-slate-200 font-mono">{health?.components.aiProvider.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="text-slate-200 font-mono">Gemini 1.5 Flash</span>
                  </div>
                </div>
              </div>

              {/* Storage Driver */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Media & Asset Storage</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    {health?.components.storage.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Driver:</span>
                    <span className="text-slate-200 font-mono">{health?.components.storage.driver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MIME Validation:</span>
                    <span className="text-slate-200 font-mono">Strict Enforced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
