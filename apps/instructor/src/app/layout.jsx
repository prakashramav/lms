import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'ApexLearn Instructor Studio | Curriculum & Pedagogy',
  description: 'Design courses, manage coding sandboxes, monitor student progress and mentor cohorts.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
