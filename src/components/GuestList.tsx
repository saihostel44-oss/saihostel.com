import React, { useState } from 'react';
import { Search, UserPlus, LogOut, Check, Edit2, ShieldAlert, Sparkles, User, Hash, Phone, KeyRound, Clock, UserCheck } from 'lucide-react';
import { Guest } from '../types';

interface GuestListProps {
  guests: Guest[];
  todayStr: string;
  onEdit: (guest: Guest) => void;
  onCheckout: (guest: Guest) => void;
  onAddNewClick: () => void;
}

export default function GuestList({ guests, todayStr, onEdit, onCheckout, onAddNewClick }: GuestListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const filteredGuests = guests.filter(g => {
    // Tab filter
    if (tab === 'active' && g.status !== 'checked_in') return false;
    if (tab === 'history' && g.status !== 'checked_out') return false;

    // Search filter
    const searchLower = search.toLowerCase();
    const nameMatch = g.name.toLowerCase().includes(searchLower);
    const roomMatch = g.roomNo.toLowerCase().includes(searchLower);
    const mobileMatch = g.mobile.includes(searchLower);
    
    return nameMatch || roomMatch || mobileMatch;
  });

  const getStayDuration = (start: string, end: string) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diff = eDate.getTime() - sDate.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  return (
    <div id="guest-list-panel" className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 p-4 md:p-6">
      
      {/* Title & Add Booking Action */}
      <div id="list-header-row" className="flex flex-row items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 id="section-title" className="text-base md:text-lg font-extrabold text-slate-800 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <span>Bookings Directory</span>
          </h2>
          <p id="section-subtitle" className="text-[10px] md:text-xs text-slate-400 font-medium">Real-time synchronized guest details</p>
        </div>
        <button
          type="button"
          onClick={onAddNewClick}
          id="btn-trigger-checkin"
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs md:text-sm px-4 py-2 rounded-2xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Check-In</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div id="tabs-group" className="flex border-b border-slate-100 pb-0.5 mb-4 space-x-4 text-xs md:text-sm font-semibold">
        <button 
          onClick={() => setTab('active')} 
          id="tab-active-guests"
          className={`pb-2 outline-hidden border-b-2 transition ${tab === 'active' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          🟢 Checked In ({guests.filter(g => g.status === 'checked_in').length})
        </button>
        <button 
          onClick={() => setTab('history')} 
          id="tab-history-guests"
          className={`pb-2 outline-hidden border-b-2 transition ${tab === 'history' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          📋 History / Checked-Out ({guests.filter(g => g.status === 'checked_out').length})
        </button>
      </div>

      {/* Search Input Filter */}
      <div id="search-input-wrapper" className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </span>
        <input 
          type="text" 
          placeholder="Search by Guest Name, Mobile, Room No..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-hidden transition"
        />
      </div>

      {/* Bookings Render */}
      <div id="guest-cards-scroller" className="overflow-y-auto space-y-3 max-h-[500px] flex-1 pr-1">
        {filteredGuests.length === 0 ? (
          <div id="guests-empty-state" className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <User className="w-12 h-12 text-slate-200 bg-slate-50 p-2.5 rounded-full" />
            <p className="text-xs md:text-sm font-bold">No bookings found</p>
            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">Search is case insensitive. Double check you are in the correct directory tab.</p>
          </div>
        ) : (
          filteredGuests.map(guest => {
            const isDueToday = tab === 'active' && guest.checkOut === todayStr;
            const isOverdue = tab === 'active' && guest.checkOut < todayStr;
            const stayDays = getStayDuration(guest.checkIn, guest.checkOut);

            return (
              <div 
                key={guest.id} 
                id={`guest-card-${guest.id}`}
                className={`bg-slate-50/50 p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDueToday 
                    ? 'border-rose-400 bg-rose-50/30' 
                    : isOverdue 
                    ? 'border-amber-400 bg-amber-50/30' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Visual indicators */}
                <div className="flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-800 text-sm md:text-base">{guest.name}</span>
                      
                      {/* Guest Badges */}
                      {guest.balanceDaysUsed && guest.balanceDaysUsed > 0 ? (
                        <span className="bg-purple-100 text-purple-700 font-bold text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3 fill-purple-700" />
                          Spent {guest.balanceDaysUsed} Credits
                        </span>
                      ) : null}

                      {guest.savedBalanceDays && guest.savedBalanceDays > 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3 fill-emerald-800" />
                          Saved {guest.savedBalanceDays} Credits
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] md:text-xs text-slate-500 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{guest.mobile}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] md:text-xs text-slate-600 font-semibold pt-1">
                      <span className="bg-sky-50 text-sky-800 border border-sky-100 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                        <KeyRound className="w-3 h-3" />
                        Room {guest.roomNo}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {stayDays} {stayDays === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator Pin */}
                  <div className="flex flex-col items-end space-y-1 text-right">
                    <span className="text-xs font-bold text-amber-600">₹{guest.dailyRate}/day</span>
                    {isDueToday && (
                      <span className="bg-rose-500 text-white font-bold text-[8px] md:text-[10px] px-1.5 py-0.5 rounded-md animate-bounce">
                        Checkout Today
                      </span>
                    )}
                    {isOverdue && (
                      <span className="bg-amber-500 text-white font-bold text-[8px] md:text-[10px] px-1.5 py-0.5 rounded-md">
                        Overdue Stay
                      </span>
                    )}
                  </div>
                </div>

                {/* Stay Dates block */}
                <div className="bg-white/80 border border-slate-100 rounded-xl px-3 py-2 mt-3 flex items-center justify-between text-[11px] md:text-xs text-slate-500">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Check-In</span>
                    <span className="font-bold text-slate-700">{guest.checkIn}</span>
                  </div>
                  <div className="w-6 border-t border-slate-200 mx-2"></div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Check-Out</span>
                    <span className="font-bold text-slate-700">{guest.checkOut}</span>
                  </div>
                  {guest.actualCheckOut && (
                    <>
                      <div className="w-6 border-t border-slate-200 mx-2"></div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-rose-500 font-bold">Actual Out</span>
                        <span className="font-bold text-rose-700">{guest.actualCheckOut}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Notes remarks summary if loaded */}
                {guest.notes && (
                  <p className="text-[10px] md:text-xs text-slate-500 bg-amber-50/20 border-l-2 border-slate-300 p-1.5 rounded-r-lg mt-2 font-medium italic">
                    "{guest.notes}"
                  </p>
                )}

                {/* Interactive triggers */}
                {tab === 'active' && (
                  <div className="flex flex-row space-x-2 mt-3 justify-end">
                    <button
                      type="button"
                      id={`btn-edit-guest-${guest.id}`}
                      onClick={() => onEdit(guest)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[11px] md:text-xs px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-checkout-guest-${guest.id}`}
                      onClick={() => onCheckout(guest)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] md:text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <LogOut className="w-3 h-3 text-white" />
                      <span>Checkout / Settle</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
