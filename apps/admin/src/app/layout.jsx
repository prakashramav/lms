import './globals.css';
import { Server } from 'lucide-react';
import { AuthProvider } from '../context/AuthContext';
import NavHeader from '../components/NavHeader';

export const metadata = {
  title: 'ApexLearn Admin Console | Platform Governance',
  description: 'Enterprise administration, role-based access management, platform telemetry and financial oversight.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-purple-600 selection:text-white">
        <AuthProvider>
          <NavHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-800 bg-slate-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-slate-500">
              <span>© {new Date().getFullYear()} ApexLearn Platform Security & Governance</span>
              <span className="inline-flex items-center gap-1.5 text-purple-400 font-mono">
                <Server className="w-3.5 h-3.5" />
                Node: Production | RBAC: Enforced
              </span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
