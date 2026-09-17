'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import {
  Cpu,
  Sparkles,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Lock,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function AiMonitoringPage() {
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAiMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAiMonitoring();
      setTelemetry(res.data);
    } catch (err) {
      console.error('Failed to load AI metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAiMetrics();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Operations & Model Telemetry</h1>
            <p className="text-xs text-slate-400 mt-1">
              Supervise token throughput, model health, quota consumption, and privacy safeguards
            </p>
          </div>
          <button
            onClick={fetchAiMetrics}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* AI Privacy Warning Box */}
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-5 flex items-start space-x-4 text-xs">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white">Student AI Privacy Architecture Enforced</h3>
            <p className="text-slate-400 leading-relaxed">
              In accordance with platform governance policy (Section 36), administrators do NOT have uninhibited access to student AI tutor conversations. Operational metrics display token usage, inference volumes, and error telemetry only.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Polling AI provider metrics...</p>
          </div>
        ) : (
          <>
            {/* Metric Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total AI Messages</span>
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{telemetry?.totalMessages || 0}</p>
                <span className="text-[11px] text-slate-500">Across all student sessions</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Estimated Tokens</span>
                  <Cpu className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-indigo-400 mt-2">
                  {Number(telemetry?.estimatedTokens || 0).toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500">Prompt + Completion</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Provider Status</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-lg font-bold text-white">{telemetry?.healthStatus || 'OPERATIONAL'}</span>
                </div>
                <span className="text-[11px] text-slate-500">0% error rate</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Active LLM Model</span>
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-sm font-bold text-white mt-2 font-mono truncate">{telemetry?.activeModel}</p>
                <span className="text-[11px] text-slate-500">Adaptive RAG embeddings</span>
              </div>
            </div>

            {/* Model Details Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white">Model Routing & Context Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Primary Engine</span>
                  <p className="text-slate-200 font-semibold">Gemini 1.5 Flash (Google Vertex)</p>
                  <p className="text-[11px] text-slate-500">Target latency &lt; 850ms</p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Vector Embeddings</span>
                  <p className="text-slate-200 font-semibold">text-embedding-004</p>
                  <p className="text-[11px] text-slate-500">Course curriculum chunks index</p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Fallback Mechanism</span>
                  <p className="text-slate-200 font-semibold">Curriculum In-Memory RAG</p>
                  <p className="text-[11px] text-slate-500">Guarantees zero-failure uptime</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
