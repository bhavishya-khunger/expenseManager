// src/App.jsx
import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';

import AuthScreen from './pages/AuthScreen';
import HomePage from './pages/HomePage';
import AddPage from './pages/AddPage';
import StatsPage from './pages/StatsPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';

const AppShell = ({ currentPage, setCurrentPage, initialFriendId, setInitialFriendId }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setPage={setCurrentPage} />;
      case 'add':
        return (
          <AddPage
            setPage={setCurrentPage}
            initialFriendId={initialFriendId}
          />
        );
      case 'stats':
        return <StatsPage />;
      case 'activity':
        return (
          <ActivityPage
            setPage={setCurrentPage}
            setInitialFriendId={setInitialFriendId}
          />
        );
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage setPage={setCurrentPage} />;
    }
  };

  return (
    <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
        {renderPage()}
        <BottomNav currentPage={currentPage} setPage={setCurrentPage} />
      </div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [initialFriendId, setInitialFriendId] = useState(null);

  return (
    <AppProvider>
      <AppShell
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        initialFriendId={initialFriendId}
        setInitialFriendId={setInitialFriendId}
      />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </AppProvider>
  );
}
