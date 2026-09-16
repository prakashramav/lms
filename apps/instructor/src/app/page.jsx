import Link from 'next/link';
import { BookPlus, Code2, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export default function InstructorHomePage() {
  const capabilities = [
    {
      title: 'Structured Course Architect',
      desc: 'Build deep hierarchies: Course → Level → Module → Chapter → Lesson → Coding Problem.',
      icon: BookPlus,
    },
    {
      title: 'Coding Sandbox Designer',
      desc: 'Craft test suites with visible & hidden test cases, memory limits, and starter templates.',
      icon: Code2,
    },
    {
      title: 'Cohort Analytics & Telemetry',
      desc: 'Track completion rates, code pass percentages, quiz averages, and student struggles.',
      icon: BarChart3,
    },
    {
      title: 'Student Doubt & Feedback Desk',
      desc: 'Answer assignment doubts, review GitHub project submissions, and provide guidance.',
      icon: Users,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          Faculty Command Center
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Empower Next-Gen Tech Talent Through{' '}
          <span className="text-teal-600">World-Class Curriculum</span>
        </h1>
        <p className="text-slate-600 text-lg">
          Author interactive lessons, create automated coding test suites, and mentor engineers to career breakthroughs.
        </p>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 transition"
          >
            Access Instructor Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
