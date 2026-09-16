import Link from 'next/link';
import { Sparkles, Terminal, Code2, Cpu, CheckCircle2, ArrowRight, BookOpen, Layers, Laptop } from 'lucide-react';

export default function StudentHomePage() {
  const steps = [
    { title: 'LEARN', desc: 'Curated structured courses from foundational to system design.', icon: BookOpen },
    { title: 'PRACTICE', desc: 'Browser-based Monaco playground for HTML, CSS, JS, React & Node.', icon: Terminal },
    { title: 'BUILD', desc: 'Real-world production projects with milestone deliverables.', icon: Layers },
    { title: 'ASSESS', desc: 'Instant automated test runners and comprehensive quizzes.', icon: CheckCircle2 },
    { title: 'IMPROVE', desc: 'AI hints with 5 assistance levels from concept to code review.', icon: Sparkles },
    { title: 'INTERVIEW', desc: 'Full-stack AI mock technical and behavioral interviews.', icon: Cpu },
    { title: 'CAREER', desc: 'Tailored ATS resume insights, portfolios, and direct job match.', icon: Laptop },
  ];

  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          The AI-Powered Career Learning Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          From First Line of Code to{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600">
            Hired Software Engineer
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Master development with isolated code sandboxes, intelligent AI tutoring, automated evaluation, and realistic mock interview simulations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-600/20 transition flex items-center justify-center gap-2"
          >
            Start Learning Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#pathway"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            Explore Curriculum
          </a>
        </div>
      </section>

      {/* 7-Stage Career Pathway */}
      <section id="pathway" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            The Complete Career Flywheel
          </h2>
          <p className="text-slate-600">
            Engineered around the proven progressive methodology for technology mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="group relative p-6 bg-white rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center text-slate-700 group-hover:text-brand-600 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
