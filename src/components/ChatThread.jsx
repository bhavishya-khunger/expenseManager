import React, { useEffect, useMemo, useRef, useState, useContext, createContext } from 'react';
import { ChevronLeft, Plus, Bell, QrCode, ArrowRightLeft, Check, X, Receipt, Calendar, Mail, CreditCard, Copy, Trash2 } from 'lucide-react';
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
    deleteTransaction,
  } = useApp();

  const [showProfile, setShowProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- MERGED HISTORY LOGIC (Fixes the double counting) ---
  const history = useMemo(() => {
    // 1. Get relevant standard transactions
    const relevantTx = transactions.filter(t => {
      const iPaid = t.payer_id === user.id;
      const friendPaid = t.payer_id === friend.user_id;

      if (iPaid) return t.involved.includes(friend.user_id);
      if (friendPaid) return t.involved.includes(user.id);
      return false;
    });

    // 2. Get relevant ACCEPTED settlements and format them as transactions
    // This allows us to see "Settled Up" in chat without adding a duplicate DB row
    const relevantSettlements = settlementRequests
      .filter(s => 
        s.status === 'accepted' && 
        ((s.lender_id === user.id && s.borrower_id === friend.user_id) ||
         (s.borrower_id === user.id && s.lender_id === friend.user_id))
      )
      .map(s => ({
        id: `settlement-${s.id}`, // Unique ID for key
        payer_id: s.borrower_id, // The person who owed money PAID it
        amount: s.amount,
        description: 'Settled Up',
        involved: [s.lender_id, s.borrower_id],
        created_at: s.updated_at || s.created_at, // Use the time it was accepted
        isSettlement: true // Flag to style differently if needed
      }));

    // 3. Combine and Sort
    return [...relevantTx, ...relevantSettlements]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [transactions, settlementRequests, friend, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const myPendingAsBorrower = settlementRequests.find(
    s => s.status === 'pending' && s.borrower_id === user.id && s.lender_id === friend.user_id
  );
  const myPendingAsLender = settlementRequests.find(
    s => s.status === 'pending' && s.lender_id === user.id && s.borrower_id === friend.user_id
  );

  // --- Handlers ---

  const handleSettleUp = () => {
    // If balance is 0 or positive (friend owes me), I might be requesting money, 
    // but typically "Settle Up" button appears when *I* owe money or friend owes me.
    // logic simplified for demo:
    const amt = Math.abs(friend.balance);
    const note = `Settle up with ${friend.full_name}`;

    // Create the Request
    // In a real app, if *I* am paying, it might just be a direct transaction.
    // But sticking to your Request flow:
    requestSettlement({
      lenderId: friend.user_id, // Friend is the lender (I owe them)
      borrowerId: user.id,      // I am the borrower
      amount: Math.round(amt),
      note: note,
    });
  };

  const handleRespondSettlement = async () => {
    if (!myPendingAsLender) return;
    // Just approve the request. 
    // The history logic above will automatically show this as a transaction card.
    respondSettlement(myPendingAsLender.id, true);
  };

  const handleDelete = (txId) => {
    // Prevent deleting settlements from here since they aren't in the transactions table
    if (txId.toString().startsWith('settlement-')) return; 

    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(txId);
    }
  };

  const handleRemind = () => {
    if (friend.balance <= 0) return;
    const amt = Math.round(friend.balance);
    createReminder({
      receiverId: friend.user_id,
      amount: amt,
      message: `Please pay ₹${amt}`,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    });
  };

  const handleShareUPI = () => {
    if (!friend.upi_id) return;
    const amt = Math.round(Math.max(friend.balance, 0));
    console.log(`Open UPI for ${amt}`);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#F8F9FA] h-screen flex flex-col relative font-sans">

      {/* 1. Header */}
      <div className="absolute top-0 w-full z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm transition-all">
        <div className="px-4 pt-12 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 group rounded-xl p-1 -ml-1 hover:bg-gray-100/80 transition-all"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 border border-white shadow-sm flex items-center justify-center font-bold text-indigo-600 text-sm">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    friend.full_name?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex flex-col items-start">
                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                  {friend.full_name}
                </h3>
                <span className={`text-[11px] font-semibold tracking-wide ${friend.balance === 0 ? 'text-gray-400' :
                  friend.balance > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                  {friend.balance === 0
                    ? 'All settled up'
                    : friend.balance > 0
                      ? `Owes you ₹${friend.balance.toFixed(0)}`
                      : `You owe ₹${Math.abs(friend.balance).toFixed(0)}`}
                </span>
              </div>
            </button>
          </div>

          <button
            onClick={onAdd}
            className="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-800 hover:shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- PROFILE MODAL --- */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowProfile(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-24 h-24 rounded-full p-1 bg-white border-2 border-gray-100 shadow-lg mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-indigo-50 flex items-center justify-center text-2xl font-bold text-indigo-500">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    friend.full_name?.substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900">{friend.full_name}</h2>
              <p className="text-sm text-gray-500 font-medium mb-6">Expense Buddy</p>

              <div className="w-full space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Email</p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {friend.email || 'No email added'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">UPI ID</p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {friend.upi_id || 'Not available'}
                    </p>
                  </div>
                  {friend.upi_id && (
                    <button
                      onClick={() => copyToClipboard(friend.upi_id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-indigo-600"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-400">
                Member since {friend.created_at ? new Date(friend.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Pending Request Banners */}
      <div className="absolute top-[120px] w-full z-10 px-4 space-y-2 pointer-events-none">
        {myPendingAsLender && (
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-emerald-500 shadow-lg rounded-2xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="text-xs text-gray-700">
                <span className="font-bold text-gray-900">₹{myPendingAsLender.amount}</span> settlement?
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => respondSettlement(myPendingAsLender.id, false)} className="p-1.5 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
              <button onClick={handleRespondSettlement} className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md transition-colors">
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {myPendingAsBorrower && (
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg rounded-2xl p-3 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xs text-gray-600">
              Waiting for approval to settle <span className="font-bold text-gray-900">₹{myPendingAsBorrower.amount}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Chat Area */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-28 pb-28 space-y-6"
        style={{
          backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-indigo-200" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No expenses yet</p>
            <p className="text-xs text-gray-300 mt-1">Tap + to add a new expense</p>
          </div>
        )}

        {history.map((t, i) => {
          const isMe = t.payer_id === user.id;
          const date = new Date(t.created_at);

          // For settlements, we render simple values
          let relevantAmount = 0;
          if (t.isSettlement) {
             // For a settlement where I paid (payer=me), I lent 0 (paid debt). 
             // Logic simplified: If it's a settlement, show the full amount cleanly.
             relevantAmount = 0; 
          } else if (t.splits) {
            relevantAmount = isMe ? (t.splits[friend.user_id] || 0) : (t.splits[user.id] || 0);
          } else {
            relevantAmount = t.amount / (t.involved.length || 1);
          }

          const showDate = i === 0 || new Date(history[i - 1].created_at).getDate() !== date.getDate();

          return (
            <React.Fragment key={t.id}>
              {showDate && (
                <div className="flex justify-center sticky top-2 z-0">
                  <span className="bg-gray-200/60 backdrop-blur-sm text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`
                  relative max-w-[80%] rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md
                  ${isMe
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-transparent rounded-tr-none'
                    : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
                  }
                  ${t.isSettlement ? 'border-emerald-200 ring-2 ring-emerald-100/50' : ''}
                `}>
                  {/* Delete Button - Only for my transactions AND NOT SETTLEMENTS */}
                  {isMe && !t.isSettlement && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-rose-600"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {t.isSettlement ? 'Settlement' : (isMe ? 'You Paid' : `${friend.full_name?.split(' ')[0]} Paid`)}
                    </span>
                    <span className={`text-[10px] font-medium opacity-60 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-sm font-medium ${isMe ? 'text-indigo-100' : 'text-gray-500'}`}>₹</span>
                      <span className="text-3xl font-bold tracking-tight">{t.amount}</span>
                    </div>
                    <div className={`text-sm font-medium leading-tight mt-0.5 ${isMe ? 'text-white' : 'text-gray-900'}`}>
                      {t.description}
                    </div>
                  </div>

                  {relevantAmount > 0 && !t.isSettlement && (
                    <div className={`
                      rounded-xl px-3 py-2 flex items-center justify-between gap-3
                      ${isMe ? 'bg-indigo-900/30' : 'bg-gray-50'}
                    `}>
                      <span className={`text-[11px] font-medium ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {isMe ? `You lent ${friend.full_name.split(' ')[0]}` : `You borrowed`}
                      </span>
                      <span className={`text-xs font-bold ${isMe ? 'text-white' : 'text-gray-900'}`}>
                        ₹{Math.round(relevantAmount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Visual flair for settlements */}
                  {t.isSettlement && (
                     <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 ${isMe ? 'bg-indigo-800/40 text-indigo-100' : 'bg-emerald-50 text-emerald-600'}`}>
                        <Check className="w-3 h-3" /> Payment Recorded
                     </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* 4. Action Bar */}
      <div className="absolute bottom-25 left-4 right-4 z-30">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 flex items-center gap-2">

          {friend.balance > 0 ? (
            // THEY OWE YOU
            <>
              <button
                onClick={handleRemind}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="mt-0.5">Remind</span>
              </button>
              <button
                onClick={handleShareUPI}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all active:scale-[0.98]"
              >
                <QrCode className="w-4 h-4" />
                <span className="mt-0.5">QR Code</span>
              </button>
            </>
          ) : friend.balance < 0 ? (
            // YOU OWE THEM
            <button
              onClick={handleSettleUp}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98]"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="mt-0.5">Settle Up ₹{Math.abs(friend.balance)}</span>
            </button>
          ) : (
            // SETTLED
            <div className="flex-1 h-10 flex items-center justify-center text-xs font-medium text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No pending balances
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default ChatThread;