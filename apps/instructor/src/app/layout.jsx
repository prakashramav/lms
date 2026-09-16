import './globals.css';
import { ShieldCheck } from 'lucide-react';
import { AuthProvider } from '../context/AuthContext';
import NavHeader from '../components/NavHeader';

export const metadata = {
  title: 'ApexLearn Instructor Portal | Curriculum & Pedagogy',
  description: 'Design courses, manage coding sandboxes, monitor student progress and grade assignments.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
        <AuthProvider>
          <NavHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-slate-500">
              <span>© {new Date().getFullYear()} ApexLearn Instructor Suite</span>
              <span className="inline-flex items-center gap-1.5 text-teal-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Role: INSTRUCTOR (RBAC Enforced)
              </span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
