import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateNotePage } from './pages/CreateNotePage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { HistoryPage } from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#070b18] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <DisclaimerBanner />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create" element={<CreateNotePage />} />
            <Route path="/records/:recordId" element={<RecordDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;

