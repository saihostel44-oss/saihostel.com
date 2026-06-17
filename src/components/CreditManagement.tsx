import React, { useState } from 'react';
import { Search, Gift, Award, Plus, Minus, History, Trash2, Calendar, Smartphone, Sparkles, UserCheck } from 'lucide-react';
import { GuestCredit, CreditTransaction } from '../types';

interface CreditManagementProps {
  credits: GuestCredit[];
  onAdjustCredit: (mobile: string, name: string, days: number, reason: string) => Promise<void>;
}

export default function CreditManagement({ credits, onAdjustCredit }: CreditManagementProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Manual Adjust State
  const [adjustingCredit, setAdjustingCredit] = useState<GuestCredit | null>(null);
  const [adjustDays, setAdjustDays] = useState(1);
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCredits = credits.filter(c => {
    const searchLower = search.toLowerCase();
    const nameMatch = c.guestName.toLowerCase().includes(searchLower);
    const mobileMatch = c.guestMobile.includes(searchLower);
    return nameMatch || mobileMatch;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCredit) return;
    setIsSubmitting(true);
    try {
      const daysToAdjust = adjustAction === 'add' ? adjustDays : -adjustDays;
      const finalReason = adjustReason.trim() || `${adjustAction === 'add' ? 'Added' : 'Subtracted'} credits manually`;
      await onAdjustCredit(adjustingCredit.id, adjustingCredit.guestName, daysToAdjust, finalReason);
      setAdjustingCredit(null);
      setAdjustReason('');
      setAdjustDays(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="credit-ledger-panel" className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 p-4 md:p-6">
      
      {/* Title */}
      <div id="credit-ledger-header" className="mb-4">
        <h2 id="credit-title" className="text-base md:text-lg font-extrabold text-slate-800 flex items-center space-x-2">
          <Gift className="w-5 h-5 text-amber-500" />
          <span>Guest Credits Ledger</span>
        </h2>
        <p id="credit-subtitle" className="text-[10px] md:text-xs text-slate-400 font-medium">
          Saved unused balance days saved for guests' subsequent visits.
        </p>
      </div>

      {/* Search Input Filter */}
      <div id="credit-search-wrapper" className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </span>
        <input 
          type="text" 
          placeholder="Search credit holders by Name or Mobile..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-hidden transition"
        />
      </div>

      {/* Credits Card Items */}
      <div id="credits-list-scroller" className="overflow-y-auto space-y-3 flex-1 pr-1 max-h-[500px]">
        {filteredCredits.length === 0 ? (
          <div id="credits-empty-state" className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Award className="w-12 h-12 text-slate-200 bg-slate-50 p-2.5 rounded-full" />
            <p className="text-xs md:text-sm font-bold">No saved credits active</p>
            <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
              When guest bookings checkout early and you select 'Save Balance Days', their credits will list here under their mobile.
            </p>
          </div>
        ) : (
          filteredCredits.map(credit => {
            const isExpanded = expandedId === credit.id;
            
            return (
              <div 
                key={credit.id} 
                id={`credit-item-${credit.id}`}
                className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-1">
                      {credit.guestName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      {credit.guestMobile}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1">Last Updated: {credit.updatedAt}</p>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Balance</span>
                    <span className="bg-amber-100 border border-amber-200 text-amber-800 px-3 py-1 rounded-2xl font-extrabold text-sm md:text-base flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                      {credit.balanceDays} Days
                    </span>
                  </div>
                </div>

                {/* Grid of micro actions */}
                <div className="flex items-center justify-between border-t border-slate-100/70 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : credit.id)}
                    className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{isExpanded ? 'Hide History' : 'View History / Ledger'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustingCredit(credit)}
                    className="text-slate-600 hover:text-slate-800 font-semibold border border-slate-200 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Adjust Days
                  </button>
                </div>

                {/* Collapsible history ledger */}
                {isExpanded && (
                  <div className="bg-white/80 border border-slate-100/80 rounded-xl p-3 space-y-2 animate-fade-in text-xs">
                    <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-amber-500" />
                      <span>Balance Days Transaction History</span>
                    </h4>
                    
                    {credit.history && credit.history.length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {credit.history.map((tx) => (
                          <div key={tx.id} className="flex items-start justify-between p-2 rounded-lg bg-slate-50 border border-slate-100/60 leading-normal">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800 text-[11px]">{tx.description}</p>
                              <p className="text-[9px] text-slate-400">{tx.date}</p>
                            </div>
                            <span className={`font-bold shrink-0 text-xs text-right ml-2 ${
                              tx.days > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {tx.days > 0 ? `+${tx.days} days` : `${tx.days} days`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[10px] py-2 text-center">No transactions available.</p>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Manual adjustments overlay modal */}
      {adjustingCredit && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-base md:text-lg font-bold text-slate-800">
              🛠️ Adjust Credit Days
            </h3>
            
            <p className="text-xs text-slate-500 leading-normal">
              Adjust balance days manually for <strong>{adjustingCredit.guestName}</strong>. This operates real-time across all mobile devices.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Type direction choice */}
              <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs md:text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setAdjustAction('add')}
                  className={`w-1/2 py-2 flex items-center justify-center space-x-1 ${
                    adjustAction === 'add' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-150'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Days</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('subtract')}
                  className={`w-1/2 py-2 flex items-center justify-center space-x-1 ${
                    adjustAction === 'subtract' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-150'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Deduct Days</span>
                </button>
              </div>

              {/* Number select of days progress */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <label className="text-xs font-bold text-slate-600">Number of Days:</label>
                <input 
                  type="number"
                  min="1"
                  max="50"
                  value={adjustDays}
                  onChange={e => setAdjustDays(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs md:text-sm font-bold text-center focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  required 
                />
              </div>

              {/* Justification details */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reason / Justification:</label>
                <input 
                  type="text"
                  placeholder="e.g. Regular guest courtesy adjust"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 outline-hidden"
                  required 
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingCredit(null)}
                  className="w-1/2 border border-slate-200 text-slate-500 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-amber-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  Confirm adjust
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
