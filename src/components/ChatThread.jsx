// src/components/ChatThread.jsx
import React, { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, Plus, Bell, QrCode, ArrowRightLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';

const ChatThread = ({ friend, onBack, onAdd }) => {
  const scrollRef = useRef(null);
  const {
    user,
    transactions,
    settlementRequests,
    requestSettlement,
    createReminder,
    respondSettlement,
    allUsers,
  } = useApp();

  const history = useMemo(() => {
    return transactions
      .filter(t => {
        const iPaid = t.payer_id === user.id;
        const friendPaid = t.payer_id === friend.user_id;

        if (iPaid) return t.involved.includes(friend.user_id);
        if (friendPaid) return t.involved.includes(user.id);
        return false;
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [transactions, friend, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const getName = uid => {
    if (uid === user.id) return 'You';
    const u = allUsers.find(au => au.user_id === uid);
    return u ? u.full_name?.split(' ')[0] : 'Unknown';
  };

  const myPendingAsBorrower = settlementRequests.find(
    s =>
      s.status === 'pending' &&
      s.borrower_id === user.id &&
      s.lender_id === friend.user_id
  );
  const myPendingAsLender = settlementRequests.find(
    s =>
      s.status === 'pending' &&
      s.lender_id === user.id &&
      s.borrower_id === friend.user_id
  );

  const handleSettleUp = () => {
    if (friend.balance >= 0) return;
    if (myPendingAsBorrower) {
      toast.info('Settlement already requested.');
      return;
    }
    const amt = Math.abs(friend.balance);
    requestSettlement({
      lenderId: friend.user_id,
      borrowerId: user.id,
      amount: Math.round(amt),
      note: `Settle up with ${friend.full_name}`,
    });
  };

  const handleRemind = () => {
    if (friend.balance <= 0) return;
    const amt = Math.round(friend.balance);
    const message = `Please pay ₹${amt} you owe me on ExpenseCentral.`;
    const due = new Date();
    due.setDate(due.getDate() + 3);
    const dueDateStr = due.toISOString().slice(0, 10);

    createReminder({
      receiverId: friend.user_id,
      amount: amt,
      message,
      dueDate: dueDateStr,
    });
  };

  const handleShareUPI = () => {
    if (!friend.upi_id) {
      toast.info('Friend has no UPI ID saved.');
      return;
    }
    const amt = Math.round(Math.max(friend.balance, 0));
    const base = `upi://pay?pa=${encodeURIComponent(
      friend.upi_id
    )}&pn=${encodeURIComponent(friend.full_name || '')}`;
    const url = amt > 0 ? `${base}&am=${amt}` : base;
    window.location.href = url;
  };

  return (
    <div className="bg-slate-50 h-screen flex flex-col pb-0 relative">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 pt-12 pb-3 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              friend.full_name?.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-bold leading-none text-slate-800">
              {friend.full_name}
            </h3>
            <span
              className={`text-[10px] font-medium ${
                friend.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {friend.balance === 0
                ? 'All settled'
                : friend.balance > 0
                ? `Owes you ₹${friend.balance.toFixed(0)}`
                : `You owe ₹${Math.abs(friend.balance).toFixed(0)}`}
            </span>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="bg-indigo-600 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {(myPendingAsBorrower || myPendingAsLender) && (
        <div className="px-4 pt-3">
          {myPendingAsLender && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 text-xs flex items-center justify-between gap-2">
              <div className="text-emerald-800">
                <span className="font-bold">
                  ₹{myPendingAsLender.amount.toFixed(0)}
                </span>{' '}
                settlement requested.
              </div>
              <div className="flex gap-1">
                <button
                  className="text-[11px] px-2 py-1 rounded-xl bg-white text-rose-500"
                  onClick={() => respondSettlement(myPendingAsLender.id, false)}
                >
                  Reject
                </button>
                <button
                  className="text-[11px] px-2 py-1 rounded-xl bg-emerald-600 text-white"
                  onClick={() => respondSettlement(myPendingAsLender.id, true)}
                >
                  Approve
                </button>
              </div>
            </div>
          )}
          {myPendingAsBorrower && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700 mt-2">
              Settlement of{' '}
              <span className="font-bold">
                ₹{myPendingAsBorrower.amount.toFixed(0)}
              </span>{' '}
              is pending approval.
            </div>
          )}
        </div>
      )}

      <div
        className="flex-1 p-4 space-y-6 overflow-y-auto pb-32 scrollbar-hide"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {history.length === 0 && (
          <div className="flex justify-center mt-10">
            <div className="bg-white/60 backdrop-blur-sm text-slate-500 px-6 py-3 rounded-2xl text-xs font-medium shadow-sm border border-white/50">
              No transactions yet. Tap{' '}
              <span className="font-bold text-indigo-600">+</span> to split a
              bill!
            </div>
          </div>
        )}

        {history.map((t, i) => {
          const isMe = t.payer_id === user.id;
          const date = new Date(t.created_at);

          let relevantAmount = 0;
          if (t.splits) {
            relevantAmount = isMe
              ? t.splits[friend.user_id] || 0
              : t.splits[user.id] || 0;
          } else {
            relevantAmount = t.amount / (t.involved.length || 1);
          }

          let breakdownText = '';
          const splitsArr = [];
          if (t.splits) {
            Object.entries(t.splits).forEach(([uid, amt]) => {
              splitsArr.push(`${getName(uid)} (${amt})`);
            });
          } else {
            const share = Math.round(t.amount / t.involved.length);
            t.involved.forEach(uid => {
              splitsArr.push(`${getName(uid)} (${share})`);
            });
          }
          breakdownText = splitsArr.join(', ');

          const showDate =
            i === 0 ||
            new Date(history[i - 1].created_at).getDate() !== date.getDate();

          return (
            <React.Fragment key={t.id}>
              {showDate && (
                <div className="flex justify-center mb-4 sticky top-2 z-10 opacity-80 pointer-events-none">
                  <span className="bg-slate-200/80 backdrop-blur-sm text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                    {date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl shadow-sm relative p-1 transition-all hover:shadow-md ${
                    isMe
                      ? 'bg-indigo-600 rounded-tr-none text-white'
                      : 'bg-white rounded-tl-none text-slate-800'
                  }`}
                >
                  <div
                    className={`pl-3 pr-3 py-2 rounded-xl mb-1 ${
                      isMe
                        ? 'bg-indigo-500/30 border-l-2 border-indigo-300'
                        : 'bg-slate-50 border-l-2 border-slate-300'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                        isMe ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {isMe ? 'You Paid' : `${friend.full_name?.split(' ')[0]} Paid`}
                    </div>
                    <div className="text-sm font-bold leading-tight mb-1">
                      {t.description}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black">₹{t.amount}</span>
                      {relevantAmount > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isMe
                              ? 'bg-indigo-700/50 text-indigo-100'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isMe ? 'Lent' : 'Borrowed'} ₹
                          {Math.round(relevantAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-2 pb-1 flex justify-between items-end gap-4">
                    <div
                      className={`text-[9px] leading-snug italic line-clamp-1 ${
                        isMe ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {breakdownText}
                    </div>
                    <div
                      className={`text-[9px] font-medium whitespace-nowrap ${
                        isMe ? 'text-indigo-300' : 'text-slate-300'
                      }`}
                    >
                      {date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Action Bar */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center gap-2 sticky bottom-0 z-30">
        {friend.balance > 0 && (
          <>
            <button
              onClick={handleRemind}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200"
            >
              <Bell className="w-3 h-3" /> Remind
            </button>
            <button
              onClick={handleShareUPI}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-xl bg-slate-900 text-white"
            >
              <QrCode className="w-3 h-3" /> Pay via UPI
            </button>
          </>
        )}
        {friend.balance < 0 && (
          <button
            onClick={handleSettleUp}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-xl bg-emerald-600 text-white"
          >
            <ArrowRightLeft className="w-3 h-3" /> Settle Up
          </button>
        )}
        {friend.balance === 0 && (
          <span className="text-[11px] text-slate-400 mx-auto">
            You are already settled 🎉
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatThread;
