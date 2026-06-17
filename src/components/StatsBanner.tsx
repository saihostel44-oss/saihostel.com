import React from 'react';
import { Users, LogOut, Home, Gift } from 'lucide-react';
import { Guest, GuestCredit } from '../types';

interface StatsBannerProps {
  guests: Guest[];
  credits: GuestCredit[];
  todayStr: string;
}

export default function StatsBanner({ guests, credits, todayStr }: StatsBannerProps) {
  const activeGuests = guests.filter(g => g.status === 'checked_in');
  
  // Todays checkout
  const checkoutsToday = activeGuests.filter(g => g.checkOut === todayStr);

  // Unique rooms
  const uniqueRooms = new Set(activeGuests.map(g => g.roomNo)).size;

  // Total credits
  const totalCredits = credits.reduce((acc, c) => acc + (c.balanceDays || 0), 0);

  return (
    <div id="stats-banner-container" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      
      {/* Active Guests Stat */}
      <div 
        id="stat-active-guests" 
        className="bg-white p-4 rounded-2xl shadow-xs border border-amber-100 flex items-center space-x-3 transition-all hover:scale-[1.01]"
      >
        <div id="stat-active-icon-wrapper" className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Users id="icon-active-guests" className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <p id="stat-active-label" className="text-xs text-slate-500 font-medium">Checked In</p>
          <p id="stat-active-value" className="text-xl md:text-2xl font-bold text-slate-800">{activeGuests.length}</p>
        </div>
      </div>

      {/* Due Out Today Stat */}
      <div 
        id="stat-due-today" 
        className={`p-4 rounded-2xl shadow-xs border flex items-center space-x-3 transition-all hover:scale-[1.01] ${
          checkoutsToday.length > 0
            ? 'bg-orange-50 border-orange-200 text-orange-950'
            : 'bg-white border-slate-100 text-slate-800'
        }`}
      >
        <div 
          id="stat-due-icon-wrapper" 
          className={`p-3 rounded-xl ${
            checkoutsToday.length > 0 ? 'bg-orange-200 text-orange-700' : 'bg-slate-50 text-slate-500'
          }`}
        >
          <LogOut id="icon-due-today" className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <p id="stat-due-label" className="text-xs text-slate-500 font-medium">Checkout Today</p>
          <p id="stat-due-value" className="text-xl md:text-2xl font-bold">{checkoutsToday.length}</p>
        </div>
      </div>

      {/* Rooms Occupied Stat */}
      <div 
        id="stat-rooms-occupied" 
        className="bg-white p-4 rounded-2xl shadow-xs border border-amber-100 flex items-center space-x-3 transition-all hover:scale-[1.01]"
      >
        <div id="stat-rooms-icon-wrapper" className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Home id="icon-rooms-occupied" className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <p id="stat-rooms-label" className="text-xs text-slate-500 font-medium">Rooms Active</p>
          <p id="stat-rooms-value" className="text-xl md:text-2xl font-bold text-slate-800">{uniqueRooms}</p>
        </div>
      </div>

      {/* Unused Days Credit Stat */}
      <div 
        id="stat-total-credits" 
        className="bg-white p-4 rounded-2xl shadow-xs border border-amber-100 flex items-center space-x-3 transition-all hover:scale-[1.01]"
      >
        <div id="stat-credits-icon-wrapper" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Gift id="icon-total-credits" className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <p id="stat-credits-label" className="text-xs text-slate-500 font-medium">Saved Credits</p>
          <p id="stat-credits-value" className="text-xl md:text-2xl font-bold text-emerald-700">{totalCredits} days</p>
        </div>
      </div>

    </div>
  );
}
