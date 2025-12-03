import React, { useMemo, useState } from 'react';
import { ChevronRight, Search, Users, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ChatThread from '../components/ChatThread';

const ActivityPage = ({ setPage, setInitialFriendId }) => {
  const { friends, transactions, user, reminders, settlementRequests } = useApp();
  const [activeChat, setActiveChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Logic for calculating balances (Preserved exactly as is) ---
  const friendBalances = useMemo(() => {
    let bal = {};

    transactions.forEach(t => {
      let myShare = 0;
      if (t.splits) {
        myShare = t.splits[user.id] || 0;
      } else {
        myShare = t.amount / (t.involved?.length || 1);
      }

      if (t.payer_id === user.id) {
        if (t.splits) {
          Object.keys(t.splits).forEach(uid => {
            if (uid !== user.id) {
              bal[uid] = (bal[uid] || 0) + t.splits[uid];
            }
          });
        } else {
          t.involved?.forEach(u => {
            if (u !== user.id) {
              bal[u] = (bal[u] || 0) + myShare;
            }
          });
        }
      } else if (t.involved?.includes(user.id)) {
        bal[t.payer_id] = (bal[t.payer_id] || 0) - myShare;
      }
    });

    const accepted = settlementRequests.filter(s => s.status === 'accepted');
    accepted.forEach(s => {
      if (s.lender_id === user.id) {
        bal[s.borrower_id] = (bal[s.borrower_id] || 0) - s.amount;
      } else if (s.borrower_id === user.id) {
        bal[s.lender_id] = (bal[s.lender_id] || 0) + s.amount;
      }
    });

    const today = new Date().getDate();

    return friends.map(f => {
      const hasRecent = transactions.some(
        t =>
          t.payer_id === f.user_id &&
          t.involved.includes(user.id) &&
          new Date(t.created_at).getDate() === today
      );

      const hasPendingSettlement = settlementRequests.some(
        s =>
          s.status === 'pending' &&
          ((s.lender_id === user.id && s.borrower_id === f.user_id) ||
            (s.borrower_id === user.id && s.lender_id === f.user_id))
      );

      const hasPendingReminder = reminders.some(
        r =>
          r.status === 'pending' &&
          ((r.sender_id === user.id && r.receiver_id === f.user_id) ||
            (r.receiver_id === user.id && r.sender_id === f.user_id))
      );

      return {
        ...f,
        balance: bal[f.user_id] || 0,
        hasNotification: hasRecent || hasPendingSettlement || hasPendingReminder,
      };
    });
  }, [friends, transactions, user, reminders, settlementRequests]);

  // Filter friends based on search
  const filteredFriends = friendBalances.filter(f => 
    f.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Active Chat ---
  if (activeChat) {
    return (
      <ChatThread
        friend={activeChat}
        onBack={() => setActiveChat(null)}
        onAdd={() => {
          setInitialFriendId(activeChat.user_id);
          setPage('add');
        }}
      />
    );
  }

  // --- Render List UI ---
  return (
    <div className="bg-gray-50 min-h-screen pb-32 font-sans">
      
      {/* Sticky Header with Backdrop Blur */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Friends & Activity</h2>
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
              {friendBalances.length} Contacts
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-3">
        {/* Empty State */}
        {filteredFriends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">No friends found</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {searchTerm ? "Try searching for a different name." : "Start by adding friends from your profile to split bills with!"}
            </p>
          </div>
        )}

        {/* Friend Cards */}
        {filteredFriends.map(f => {
          const isOwed = f.balance > 0;
          const isDebt = f.balance < 0;
          const isSettled = f.balance === 0;

          return (
            <button
              key={f.user_id}
              onClick={() => setActiveChat(f)}
              className="w-full bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-indigo-100 hover:shadow-md transition-all duration-200 active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                
                {/* Left Side: Avatar & Name */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border border-gray-100 flex items-center justify-center font-bold text-indigo-600 text-lg shadow-inner">
                      {f.avatar_url ? (
                        <img
                          src={f.avatar_url}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        f.full_name?.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    {/* Notification Dot with Pulse */}
                    {f.hasNotification && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>

                  <div className="text-left">
                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {f.full_name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isSettled ? (
                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> All settled up
                        </span>
                      ) : isOwed ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Owes you
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3" /> You owe
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Balance Amount & Arrow */}
                <div className="flex items-center gap-3">
                  {!isSettled && (
                    <div className="text-right">
                      <div className={`text-sm font-bold tracking-tight ${
                        isOwed ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        ₹{Math.abs(f.balance).toFixed(0)}
                      </div>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>

              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityPage;