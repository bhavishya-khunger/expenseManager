// src/pages/HomePage.jsx
import React, { useMemo, useState } from 'react';
import {
    Bell,
    Check,
    Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const HomePage = ({ setPage }) => {
    const {
        user,
        friends,
        transactions,
        personalExpenses,
        friendRequests,
        settlementRequests,
        reminders,
    } = useApp();

    const [showNotifications, setShowNotifications] = useState(false);

    const balances = useMemo(() => {
        let bal = {};
        const myId = user.id;

        transactions.forEach(t => {
            const isPayer = t.payer_id === myId;
            const amInvolved = t.involved?.includes(myId);

            if (t.splits) {
                if (isPayer) {
                    Object.entries(t.splits).forEach(([uid, amount]) => {
                        if (uid !== myId) {
                            bal[uid] = (bal[uid] || 0) + amount;
                        }
                    });
                } else if (amInvolved) {
                    const myShare = t.splits[myId] || 0;
                    if (myShare > 0) {
                        bal[t.payer_id] = (bal[t.payer_id] || 0) - myShare;
                    }
                }
            }
        });

        const accepted = settlementRequests.filter(s => s.status === 'accepted');
        accepted.forEach(s => {
            if (s.lender_id === myId) {
                bal[s.borrower_id] = (bal[s.borrower_id] || 0) - s.amount;
            } else if (s.borrower_id === myId) {
                bal[s.lender_id] = (bal[s.lender_id] || 0) + s.amount;
            }
        });

        return bal;
    }, [transactions, settlementRequests, user]);

    const netBalance = Object.values(balances).reduce((a, b) => a + b, 0);

    const monthlySpending = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const personalSum = personalExpenses
            .filter(e => new Date(e.created_at) >= startOfMonth)
            .reduce((sum, e) => sum + e.amount, 0);

        const splitSum = transactions
            .filter(
                t =>
                    new Date(t.created_at) >= startOfMonth &&
                    t.involved?.includes(user.id)
            )
            .reduce((sum, t) => {
                let myShare = 0;
                if (t.splits) {
                    myShare = t.splits[user.id] || 0;
                } else {
                    myShare = t.amount / (t.involved?.length || 1);
                }
                return sum + myShare;
            }, 0);

        return personalSum + splitSum;
    }, [personalExpenses, transactions, user]);

    const pendingSettlementsIncoming = settlementRequests.filter(
        s => s.status === 'pending' && s.lender_id === user.id
    );
    const pendingSettlementsOutgoing = settlementRequests.filter(
        s => s.status === 'pending' && s.borrower_id === user.id
    );
    const incomingReminders = reminders.filter(
        r => r.status === 'pending' && r.receiver_id === user.id
    );

    return (
        <div className="pb-28 relative">
            <div className="bg-slate-900 text-white pt-8 pb-8 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-400 bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-lg">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.full_name?.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">Overview</h1>
                                <p className="text-xs text-slate-400">
                                    Welcome back, {user.full_name?.split(' ')[0]}
                                </p>
                            </div>
                        </div>
                        <button
                            className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md relative"
                            onClick={() => setShowNotifications(v => !v)}
                        >
                            <Bell className="w-5 h-5" />
                            {(friendRequests.length > 0 ||
                                pendingSettlementsIncoming.length > 0 ||
                                incomingReminders.length > 0) && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900" />
                                )}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-3xl shadow-lg shadow-indigo-900/20 relative overflow-hidden group">
                            <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
                                Total Spent
                            </div>
                            <div className="text-2xl font-black mb-1">
                                ₹
                                {monthlySpending.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                })}
                            </div>
                            <div className="text-[10px] text-indigo-300 bg-indigo-900/30 inline-block px-2 py-0.5 rounded-full">
                                This Month
                            </div>
                        </div>

                        <div
                            className={`p-5 rounded-3xl shadow-lg relative overflow-hidden group border ${netBalance >= 0
                                    ? 'bg-emerald-900/40 border-emerald-500/20'
                                    : 'bg-rose-900/40 border-rose-500/20'
                                }`}
                        >
                            <div
                                className={`text-xs font-bold uppercase tracking-wider mb-1 ${netBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                    }`}
                            >
                                Net Balance
                            </div>
                            <div
                                className={`text-2xl font-black mb-1 ${netBalance >= 0 ? 'text-emerald-100' : 'text-rose-100'
                                    }`}
                            >
                                {netBalance < 0 ? '-' : ''}₹
                                {Math.abs(netBalance).toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                })}
                            </div>
                            <div
                                className={`text-[10px] inline-block px-2 py-0.5 rounded-full ${netBalance >= 0
                                        ? 'text-emerald-300 bg-emerald-900/30'
                                        : 'text-rose-300 bg-rose-900/30'
                                    }`}
                            >
                                {netBalance >= 0 ? 'To Receive' : 'To Pay'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Center */}
            {showNotifications && (
                <div className="absolute top-20 left-0 right-0 px-4 z-30">
                    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Bell className="w-4 h-4 text-indigo-500" /> Notifications
                            </h3>
                            <button
                                className="text-xs text-slate-400 hover:text-slate-600"
                                onClick={() => setPage('activity')}
                            >
                                Go to Chats
                            </button>
                        </div>

                        {friendRequests.length === 0 &&
                            pendingSettlementsIncoming.length === 0 &&
                            pendingSettlementsOutgoing.length === 0 &&
                            incomingReminders.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">
                                    No new notifications.
                                </p>
                            )}

                        {friendRequests.length > 0 && (
                            <div>
                                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">
                                    Friend Requests
                                </p>
                                {friendRequests.map(req => (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-1"
                                    >
                                        <div className="text-xs">
                                            <div className="font-bold text-slate-800">
                                                {req.sender.full_name}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {req.sender.email}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-indigo-500 font-bold">
                                            Check Profile
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pendingSettlementsIncoming.length > 0 && (
                            <div>
                                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">
                                    Pending Settlements (You to approve)
                                </p>
                                {pendingSettlementsIncoming.map(s => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2 mb-1"
                                    >
                                        <div className="text-xs text-emerald-900">
                                            <span className="font-bold">
                                                ₹{s.amount.toFixed(0)}
                                            </span>{' '}
                                            requested to settle
                                        </div>
                                        <span className="text-[10px] text-emerald-700 font-semibold">
                                            Approve in Chat
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pendingSettlementsOutgoing.length > 0 && (
                            <div>
                                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">
                                    Settlement Requests (Waiting)
                                </p>
                                {pendingSettlementsOutgoing.map(s => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-1"
                                    >
                                        <div className="text-xs text-slate-700">
                                            <span className="font-bold">
                                                ₹{s.amount.toFixed(0)}
                                            </span>{' '}
                                            waiting for approval
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {incomingReminders.length > 0 && (
                            <div>
                                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">
                                    Reminders
                                </p>
                                {incomingReminders.map(r => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2 mb-1"
                                    >
                                        <div className="text-xs text-amber-900">
                                            <span className="font-bold">
                                                Pay ₹{r.amount.toFixed(0)}
                                            </span>{' '}
                                            - {r.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Balances list */}
            <div className="px-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-slate-800 font-bold text-lg">Active Balances</h2>
                </div>

                <div className="space-y-3">
                    {friends.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 font-medium text-sm">
                                No friends added yet.
                            </p>
                            <p className="text-slate-300 text-xs">
                                Go to Profile to add friends!
                            </p>
                        </div>
                    )}

                    {friends.map((f, i) => {
                        const bal = balances[f.user_id] || 0;
                        if (Math.abs(bal) < 1) return null;

                        return (
                            <div
                                key={f.user_id}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${bal > 0
                                                ? 'bg-emerald-500 shadow-emerald-200'
                                                : 'bg-rose-500 shadow-rose-200'
                                            }`}
                                    >
                                        {f.full_name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">
                                            {f.full_name}
                                        </div>
                                        <div
                                            className={`text-xs font-medium ${bal > 0 ? 'text-emerald-600' : 'text-rose-600'
                                                }`}
                                        >
                                            {bal > 0 ? 'owes you' : 'you owe'}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={`font-black text-lg ${bal > 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                >
                                    ₹{Math.abs(bal).toLocaleString()}
                                </div>
                            </div>
                        );
                    })}

                    {friends.length > 0 &&
                        Object.keys(balances).every(k => Math.abs(balances[k]) < 1) && (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                                <p className="text-slate-400 font-medium text-sm">
                                    All settled up!
                                </p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
