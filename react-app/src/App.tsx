import * as React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './layout/sidebar';
import { Header } from './layout/header';
import { Home } from './pages/home';
import { Exams } from './pages/exams/exams';
import { ExamsNew } from './pages/exams/new';
import { Submissions } from './pages/submissions/submissions';
import { SubmissionsNew } from './pages/submissions/new';
import { Graph } from './pages/graph';
import { Statistics } from './pages/statistics';
import { Students } from './pages/students/students';
import { StudentsNew } from './pages/students/new';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const location = useLocation();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v5_startTransition: false }}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar location={location} />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/exams/new" element={<ExamsNew />} />
                <Route path="/students" element={<Students />} />
                <Route path="/students/new" element={<StudentsNew />} />
                <Route path="/submissions" element={<Submissions />} />
                <Route path="/submissions/new" element={<SubmissionsNew />} />
                <Route path="/graph" element={<Graph />} />
                <Route path="/statistics" element={<Statistics />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
