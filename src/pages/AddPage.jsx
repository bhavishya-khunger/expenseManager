// src/pages/AddPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Utensils,
  Bus,
  Film,
  ShoppingBag,
  Zap,
  HeartPulse,
  MoreHorizontal,
  Loader,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AddPage = ({ setPage, initialFriendId }) => {
  const { user, allUsers, addTransaction, addPersonalExpense } = useApp();
  const [mode, setMode] = useState('personal');
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Food');
  const [payer, setPayer] = useState(user.id);

  const [splitType, setSplitType] = useState('equal');
  const [involved, setInvolved] = useState(
    initialFriendId ? [user.id, initialFriendId] : [user.id]
  );
  const [unequalAmounts, setUnequalAmounts] = useState({});
  const [roundOff, setRoundOff] = useState(true);

  const categories = [
    {
      id: 'Food',
      icon: Utensils,
      color: 'text-orange-600 bg-orange-100',
      keywords: [
        'pizza',
        'burger',
        'lunch',
        'dinner',
        'food',
        'coffee',
        'cafe',
        'drink',
        'swiggy',
        'zomato',
      ],
    },
    {
      id: 'Transport',
      icon: Bus,
      color: 'text-blue-600 bg-blue-100',
      keywords: [
        'uber',
        'ola',
        'taxi',
        'cab',
        'bus',
        'train',
        'flight',
        'fuel',
        'petrol',
      ],
    },
    {
      id: 'Entertainment',
      icon: Film,
      color: 'text-purple-600 bg-purple-100',
      keywords: ['movie', 'cinema', 'netflix', 'game', 'show', 'party', 'concert'],
    },
    {
      id: 'Shopping',
      icon: ShoppingBag,
      color: 'text-pink-600 bg-pink-100',
      keywords: ['clothes', 'amazon', 'flipkart', 'mall', 'store', 'shoes'],
    },
    {
      id: 'Bills',
      icon: Zap,
      color: 'text-yellow-600 bg-yellow-100',
      keywords: ['bill', 'electricity', 'wifi', 'recharge', 'phone'],
    },
    {
      id: 'Health',
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-100',
      keywords: ['doctor', 'med', 'pharmacy', 'gym'],
    },
    { id: 'Other', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-100', keywords: [] },
  ];

  const activeCategory = categories.find(c => c.id === category) || categories[0];
  const ActiveIcon = activeCategory.icon;

  useEffect(() => {
    if (!desc) return;
    const lowerDesc = desc.toLowerCase();
    for (const cat of categories) {
      if (cat.keywords.some(k => lowerDesc.includes(k))) {
        setCategory(cat.id);
        break;
      }
    }
  }, [desc]);

  const toggleInvolved = uid => {
    setInvolved(prev =>
      prev.includes(uid)
        ? prev.length > 1
          ? prev.filter(id => id !== uid)
          : prev
        : [...prev, uid]
    );
  };

  const handleUnequalChange = (uid, val) => {
    setUnequalAmounts(prev => ({ ...prev, [uid]: parseFloat(val) || 0 }));
  };

  const calculateSplits = () => {
    const total = parseFloat(amount);
    let finalSplits = {};

    if (splitType === 'equal') {
      const count = involved.length;
      const share = total / count;
      involved.forEach(uid => {
        finalSplits[uid] = roundOff
          ? Math.round(share)
          : parseFloat(share.toFixed(2));
      });
      if (roundOff) {
        const sum = Object.values(finalSplits).reduce((a, b) => a + b, 0);
        const diff = total - sum;
        if (diff !== 0) {
          finalSplits[involved[0]] += diff;
        }
      }
    } else {
      finalSplits = { ...unequalAmounts };
    }
    return finalSplits;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!amount || !desc) return;

    if (mode === 'split' && splitType === 'unequal') {
      const sum = involved.reduce(
        (acc, uid) => acc + (unequalAmounts[uid] || 0),
        0
      );
      if (Math.abs(sum - parseFloat(amount)) > 1) {
        alert(
          `Total split amount (${sum}) does not match expense amount (${amount})`
        );
        return;
      }
    }

    setLoading(true);
    const val = parseFloat(amount);

    if (mode === 'personal') {
      await addPersonalExpense({
        amount: val,
        description: desc,
        category,
      });
      setPage('stats');
    } else {
      const splits = calculateSplits();
      await addTransaction({
        amount: val,
        description: desc,
        payer_id: payer,
        involved,
        splits,
        category,
        type: 'split',
      });
      setPage('activity');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div
        className={`px-6 pt-12 pb-8 shadow-sm transition-colors duration-500 ${
          mode === 'personal' ? 'bg-white' : 'bg-slate-900 text-white'
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-6">New Expense</h2>
        <div
          className={`p-1 rounded-2xl flex relative ${
            mode === 'personal' ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-sm transition-all duration-300 ease-spring ${
              mode === 'personal' ? 'bg-white left-1' : 'bg-indigo-500 left-[calc(50%+4px)]'
            }`}
          ></div>
          <button
            type="button"
            onClick={() => setMode('personal')}
            className={`flex-1 relative z-10 py-3 text-sm font-bold transition-colors ${
              mode === 'personal' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`flex-1 relative z-10 py-3 text-sm font-bold transition-colors ${
              mode === 'split' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Split Bill
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-8 space-y-8">
        <div className="relative text-center">
          <span className="text-slate-400 text-4xl font-bold absolute top-1/2 -translate-y-1/2 left-4">
            ₹
          </span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent border-b-2 border-slate-200 py-4 pl-12 pr-4 text-6xl font-black text-slate-800 focus:border-indigo-500 focus:outline-none transition-colors text-center placeholder:text-slate-200"
            autoFocus
          />
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${activeCategory.color}`}
          >
            <ActiveIcon className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="What is this for?"
            className="w-full h-full text-lg font-medium text-slate-700 placeholder:text-slate-300 outline-none bg-transparent"
          />
        </div>

        <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            Category
          </label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                  category === cat.id
                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                <cat.icon className="w-5 h-5" />
                {cat.id}
              </button>
            ))}
          </div>
        </div>

        {mode === 'split' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-3 block">
                Who Paid?
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {allUsers.map(u => (
                  <button
                    key={u.user_id}
                    type="button"
                    onClick={() => setPayer(u.user_id)}
                    className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                      payer === u.user_id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        payer === u.user_id
                          ? 'bg-white text-indigo-600'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.full_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-bold">
                      {u.user_id === user.id ? 'You' : u.full_name?.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  splitType === 'equal'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setSplitType('unequal')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  splitType === 'unequal'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                Unequal Split
              </button>
            </div>

            <div>
              <div className="grid grid-cols-1 gap-3">
                {allUsers.map(u => (
                  <div
                    key={u.user_id}
                    className={`flex items-center p-3 rounded-2xl border transition-all ${
                      involved.includes(u.user_id)
                        ? 'bg-white border-indigo-200 shadow-sm'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleInvolved(u.user_id)}
                      className="flex items-center flex-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${
                          involved.includes(u.user_id)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {u.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div
                          className={`text-sm font-bold ${
                            involved.includes(u.user_id)
                              ? 'text-slate-900'
                              : 'text-slate-500'
                          }`}
                        >
                          {u.user_id === user.id ? 'You' : u.full_name}
                        </div>
                      </div>
                    </button>
                    {involved.includes(u.user_id) && (
                      <div className="w-24">
                        {splitType === 'equal' ? (
                          <div className="text-right text-sm font-bold text-slate-700">
                            ₹
                            {amount
                              ? roundOff
                                ? Math.round(amount / involved.length)
                                : (amount / involved.length).toFixed(2)
                              : '0'}
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={unequalAmounts[u.user_id] || ''}
                              onChange={e =>
                                handleUnequalChange(u.user_id, e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-5 pr-2 text-right text-sm font-bold outline-none focus:border-indigo-500"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount || !desc}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 ${
            mode === 'personal'
              ? 'bg-slate-900 text-white'
              : 'bg-indigo-600 text-white shadow-indigo-200'
          }`}
        >
          {loading && <Loader className="w-5 h-5 animate-spin" />}
          {mode === 'personal' ? 'Track Expense' : 'Split Bill'}
        </button>
      </form>
    </div>
  );
};

export default AddPage;
   