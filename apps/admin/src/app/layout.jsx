import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'ApexEd Admin Console | Platform Governance & Operations',
  description: 'Enterprise administration, role-based access management, platform telemetry, and curriculum oversight.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
