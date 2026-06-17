import React from 'react';
import { Bell, LogOut, CheckCircle, Smartphone } from 'lucide-react';
import { Guest } from '../types';

interface NotificationPanelProps {
  guests: Guest[];
  todayStr: string;
  onCheckoutClick: (guest: Guest) => void;
}

export default function NotificationPanel({ guests, todayStr, onCheckoutClick }: NotificationPanelProps) {
  // Find currently checked-in guests whose checkOut date is less than or equal to today, or today itself
  const activeGuests = guests.filter(g => g.status === 'checked_in');
  
  const dueToday = activeGuests.filter(g => g.checkOut === todayStr);
  const overdue = activeGuests.filter(g => g.checkOut < todayStr);

  // Request browser notification permission helper
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification("Sai Hostels Alerts Enabled!", {
          body: "You will now receive checkout alerts on this mobile device.",
          icon: "/favicon.ico"
        });
      }
    }
  };

  if (dueToday.length === 0 && overdue.length === 0) {
    return null;
  }

  return (
    <div id="notification-panel-wrapper" className="mb-6 space-y-3">
      
      {/* Browser Notification Opt-In Banner */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div id="browser-notify-banner" className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex flex-row items-center justify-between text-xs text-amber-900 gap-2">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Enable mobile push notifications for checkout alerts?</span>
          </div>
          <button 
            type="button" 
            onClick={requestNotificationPermission} 
            className="bg-amber-600 text-white font-medium px-2.5 py-1 rounded-lg hover:bg-amber-700 transition"
          >
            Enable
          </button>
        </div>
      )}

      {/* Due Today Section */}
      {dueToday.length > 0 && (
        <div id="due-today-alert-box" className="bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl p-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <div id="due-bell-icon" className="p-1 bg-rose-100 text-rose-600 rounded-lg animate-bounce mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 id="due-today-title" className="font-semibold text-rose-950 text-sm md:text-base">
                Checkout Due Today! ({dueToday.length})
              </h3>
              <p id="due-today-desc" className="text-xs md:text-sm text-rose-800 mb-2">
                The checkout date for the following guest(s) is today. Please coordinate their departure and verify credits.
              </p>
              
              <div id="due-today-list" className="space-y-2 mt-2">
                {dueToday.map(guest => (
                  <div 
                    key={guest.id} 
                    id={`due-guest-${guest.id}`} 
                    className="flex flex-row items-center justify-between bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-rose-100 text-xs md:text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Room {guest.roomNo}</span> - <span className="font-medium text-slate-700">{guest.name}</span>
                      <p className="text-[10px] md:text-xs text-slate-500 font-mono mt-0.5">{guest.mobile}</p>
                    </div>
                    <button
                      type="button"
                      id={`btn-due-checkout-${guest.id}`}
                      onClick={() => onCheckoutClick(guest)}
                      className="bg-rose-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-rose-700 transition flex items-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Checkout</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div id="overdue-alert-box" className="bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl p-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <div id="overdue-bell-icon" className="p-1 bg-amber-100 text-amber-600 rounded-lg mt-0.5">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 id="overdue-title" className="font-semibold text-amber-950 text-sm md:text-base">
                Overdue Checkout Check! ({overdue.length})
              </h3>
              <p id="overdue-desc" className="text-xs md:text-sm text-amber-800 mb-2">
                The scheduled checkout date for these guests has passed.
              </p>
              
              <div id="overdue-list" className="space-y-2 mt-2">
                {overdue.map(guest => (
                  <div 
                    key={guest.id} 
                    id={`overdue-guest-${guest.id}`} 
                    className="flex flex-row items-center justify-between bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-amber-200 text-xs md:text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Room {guest.roomNo}</span> - <span className="font-medium text-slate-700">{guest.name}</span>
                      <p className="text-[10px] md:text-xs text-rose-600 font-medium">Overdue since: {guest.checkOut}</p>
                    </div>
                    <button
                      type="button"
                      id={`btn-overdue-checkout-${guest.id}`}
                      onClick={() => onCheckoutClick(guest)}
                      className="bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-700 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Checkout</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
