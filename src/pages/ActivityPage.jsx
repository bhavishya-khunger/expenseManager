// src/pages/ActivityPage.jsx
import React, { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ChatThread from '../components/ChatThread';

const ActivityPage = ({ setPage, setInitialFriendId }) => {
  const { friends, transactions, user, reminders, settlementRequests } = useApp();
  const [activeChat, setActiveChat] = useState(null);

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

  return (
    <div className="bg-slate-50 min-h-screen pb-28">
      <div className="px-6 pt-12 pb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Chat & Friends</h2>
        <div className="space-y-3">
          {friendBalances.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No friends yet. Go to Profile to add one!
            </div>
          )}
          {friendBalances.map(f => (
            <button
              key={f.user_id}
              onClick={() => setActiveChat(f)}
              className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-lg">
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
                  {f.hasNotification && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800">{f.full_name}</div>
                  <div
                    className={`text-xs font-bold ${
                      f.balance === 0
                        ? 'text-slate-400'
                        : f.balance > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {f.balance === 0
                      ? 'Settled'
                      : f.balance > 0
                      ? `Owes you ₹${f.balance.toFixed(0)}`
                      : `You owe ₹${Math.abs(f.balance).toFixed(0)}`}
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-indigo-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
