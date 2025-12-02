// src/pages/StatsPage.jsx
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

const StatsPage = () => {
  const { user, personalExpenses, transactions } = useApp();
  const [range, setRange] = useState('monthly');

  const isInRange = dateStr => {
    const d = new Date(dateStr);
    const now = new Date();
    const start = new Date();
    if (range === 'daily') start.setHours(0, 0, 0, 0);
    if (range === 'weekly') start.setDate(now.getDate() - 7);
    if (range === 'monthly') start.setDate(1);
    return d >= start;
  };

  const statsData = useMemo(() => {
    const combined = [];

    personalExpenses.forEach(e => {
      if (isInRange(e.created_at)) {
        combined.push({ ...e, source: 'personal' });
      }
    });

    transactions.forEach(t => {
      if (isInRange(t.created_at) && t.involved?.includes(user.id)) {
        let myShare = 0;
        if (t.splits) {
          myShare = t.splits[user.id] || 0;
        } else {
          myShare = t.amount / (t.involved.length || 1);
        }

        if (myShare > 0) {
          combined.push({
            id: `${t.id}_share`,
            description: `${t.description} (Share)`,
            amount: myShare,
            category: t.category || 'Other',
            created_at: t.created_at,
            source: 'split',
          });
        }
      }
    });

    const total = combined.reduce((s, e) => s + e.amount, 0);
    const map = {};
    combined.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    let currentAngle = 0;
    const pieData = Object.entries(map).map(([cat, amt], i) => {
      const percentage = amt / total;
      const angle = percentage * 360;
      const start = currentAngle;
      currentAngle += angle;
      const colors = [
        '#6366f1',
        '#8b5cf6',
        '#ec4899',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#64748b',
      ];
      return { cat, amt, start, angle, color: colors[i % colors.length] };
    });

    return {
      total,
      byCat: Object.entries(map).sort((a, b) => b[1] - a[1]),
      pieData,
    };
  }, [personalExpenses, transactions, range, user]);

  return (
    <div className="bg-slate-50 min-h-screen pb-28">
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['daily', 'weekly', 'monthly'].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${
                  range === r
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 text-center">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
            Total Spent
          </div>
          <div className="text-4xl font-black">
            ₹
            {statsData.total.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {statsData.total > 0 ? (
          <div className="flex items-center justify-center py-4">
            <svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90">
              {statsData.pieData.map((d, i) => {
                const x1 = 50 + 50 * Math.cos((Math.PI * d.start) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * d.start) / 180);
                const endAngle = d.start + d.angle;
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                const largeArc = d.angle > 180 ? 1 : 0;
                return (
                  <path
                    key={i}
                    d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                    fill={d.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
              <circle cx="50" cy="50" r="30" fill="white" />
            </svg>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300 italic">
            No spending data
          </div>
        )}

        <div className="space-y-4">
          {statsData.byCat.map(([cat, amt]) => (
            <div key={cat} className="group">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        statsData.pieData.find(d => d.cat === cat)?.color,
                    }}
                  ></span>
                  {cat}
                </span>
                <span className="text-slate-900">
                  ₹
                  {amt.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(amt / statsData.total) * 100}%`,
                    backgroundColor:
                      statsData.pieData.find(d => d.cat === cat)?.color,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
