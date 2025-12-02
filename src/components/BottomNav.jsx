// src/components/BottomNav.jsx
import React from 'react';
import { Home, MessageCircle, PlusCircle, PieChart, User, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const BottomNav = ({ currentPage, setPage }) => {
  const { friendRequests, reminders, settlementRequests } = useApp();

  const pendingReminders = reminders.filter(
    r => r.status === 'pending' && r.receiver_id
  );
  const pendingSettlements = settlementRequests.filter(
    s => s.status === 'pending'
  );

  const hasAnyNotifications =
    friendRequests.length > 0 ||
    pendingReminders.length > 0 ||
    pendingSettlements.length > 0;

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'activity', icon: MessageCircle, label: 'Chat' },
    { id: 'add', icon: PlusCircle, label: 'Add', isMain: true },
    { id: 'stats', icon: PieChart, label: 'Stats' },
    { id: 'profile', icon: User, label: 'Profile', badge: hasAnyNotifications },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-end z-50 max-w-md mx-auto">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setPage(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
            item.isMain ? '-top-6' : 'py-3'
          }`}
        >
          {item.isMain ? (
            <div
              className={`p-4 rounded-full shadow-xl shadow-indigo-200 transition-transform ${
                currentPage === 'add'
                  ? 'bg-indigo-600 scale-110'
                  : 'bg-slate-900 hover:scale-105'
              }`}
            >
              <Plus className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          ) : (
            <>
              <div className="relative">
                <item.icon
                  className={`w-6 h-6 ${
                    currentPage === item.id
                      ? 'text-indigo-600 fill-indigo-50'
                      : 'text-slate-300'
                  }`}
                  strokeWidth={currentPage === item.id ? 2.5 : 2}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              {currentPage === item.id && (
                <span className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </>
          )}
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
