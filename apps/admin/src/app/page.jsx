import Link from 'next/link';
import { Shield, Users, Database, Activity, Lock, ArrowRight } from 'lucide-react';

export default function AdminHomePage() {
  const systems = [
    {
      title: 'Identity & Access Management',
      desc: 'Enforce RBAC policies, assign instructor permissions, and handle user lockouts.',
      icon: Users,
    },
    {
      title: 'Execution Engine Oversight',
      desc: 'Monitor Judge0 sandbox worker queues, container timeouts, and memory utilization.',
      icon: Activity,
    },
    {
      title: 'Curriculum & Content Governance',
      desc: 'Moderate courses, assess problem difficulty calibration, and inspect hidden test cases.',
      icon: Database,
    },
    {
      title: 'Compliance & Audit Trails',
      desc: 'Immutable logging for authentication events, role escalations, and financial records.',
      icon: Shield,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800">
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          Restricted Platform Administration
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Total Infrastructure & Platform Governance
        </h1>
        <p className="text-slate-400 text-lg">
          Oversee courses, manage secure sandboxes, enforce security policies, and evaluate platform telemetry.
        </p>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/25 transition"
          >
            Authenticate into Console <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {systems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="p-8 bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
