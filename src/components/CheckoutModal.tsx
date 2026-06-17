import React, { useState } from 'react';
import { Calendar, HelpCircle, LogOut, RefreshCw, Star, X } from 'lucide-react';
import { Guest } from '../types';

interface CheckoutModalProps {
  guest: Guest;
  todayStr: string;
  onClose: () => void;
  onConfirm: (actualCheckoutDate: string, saveBalanceDays: number, creditOptionSelected: boolean) => Promise<void>;
}

export default function CheckoutModal({ guest, todayStr, onClose, onConfirm }: CheckoutModalProps) {
  // Configured check-out date, default to today if scheduled checkout is today or in future.
  // If scheduled checkout is in the past, let it default to scheduledCheckout or today (user's preference)
  const defaultCheckoutDate = guest.checkOut < todayStr ? guest.checkOut : todayStr;
  const [actualCheckoutDate, setActualCheckoutDate] = useState(defaultCheckoutDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveToCredit, setSaveToCredit] = useState(true);

  // Math variables
  const checkInDateObj = new Date(guest.checkIn);
  const scheduledCheckoutDateObj = new Date(guest.checkOut);
  const actualCheckoutDateObj = new Date(actualCheckoutDate);

  // Total scheduled stay
  const totalDaysScheduled = Math.max(1, Math.ceil((scheduledCheckoutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 3600 * 24)));

  // Actual stay duration up to checkout selection
  const actualDaysStayed = Math.max(1, Math.ceil((actualCheckoutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 3600 * 24)));

  // Remaining days to rollover
  const balanceDaysRemaining = Math.max(0, totalDaysScheduled - actualDaysStayed);
  const isEarlyCheckout = balanceDaysRemaining > 0;

  // Final adjusted cost based on stayed days and rate
  const finalStayCharge = actualDaysStayed * guest.dailyRate;
  const refundAmount = balanceDaysRemaining * guest.dailyRate;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(actualCheckoutDate, isEarlyCheckout && saveToCredit ? balanceDaysRemaining : 0, saveToCredit);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="checkout-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div id="checkout-modal-container" className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div id="checkout-modal-header" className="px-6 py-5 bg-rose-500 text-white flex flex-row items-center justify-between">
          <div>
            <h2 id="checkout-modal-title" className="text-lg md:text-xl font-bold font-sans">
              🚪 Confirm Guest Checkout
            </h2>
            <p id="checkout-modal-subtitle" className="text-xs text-rose-50">Settle stays, view dynamic balance options</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-xl transition cursor-pointer"
            id="btn-close-checkout-modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
          
          {/* Guest Summary Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs md:text-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span>Guest Name:</span>
              <span className="font-bold text-slate-800">{guest.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Mobile No:</span>
              <span className="font-medium text-slate-700 font-mono">{guest.mobile}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Room / Bed:</span>
              <span className="font-extrabold text-slate-800 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Room {guest.roomNo}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Dates:</span>
              <span className="font-medium text-slate-700">{guest.checkIn} to {guest.checkOut}</span>
            </div>
          </div>

          {/* Checkout Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" /> Checkout Date (Actual)
            </label>
            <input 
              type="date"
              value={actualCheckoutDate}
              min={guest.checkIn}
              onChange={e => setActualCheckoutDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden transition"
              required 
            />
            <p className="text-[10px] text-slate-400 mt-1">Modify actual departure date if they are checking out early.</p>
          </div>

          {/* Logic check for early checkout options */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center text-xs md:text-sm my-1">
              <span className="text-slate-500">Scheduled Duration:</span>
              <span className="font-bold text-slate-800">{totalDaysScheduled} Days</span>
            </div>
            <div className="flex justify-between items-center text-xs md:text-sm my-1">
              <span className="text-slate-500">Actual Duration:</span>
              <span className="font-bold text-slate-800">{actualDaysStayed} Days</span>
            </div>

            {isEarlyCheckout ? (
              <div id="early-checkout-feature-container" className="pt-3 space-y-3">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col space-y-1.5 animate-pulse">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs md:text-sm">
                    <Star className="w-4 h-4 text-amber-600 shrink-0 fill-amber-500" />
                    <span>⚠️ Early Checkout Detected!</span>
                  </div>
                  <p className="text-xs text-amber-700 leading-normal">
                    This guest is checking out <strong>{balanceDaysRemaining} days</strong> early. We can save these remaining days as a credit balance for their future use (e.g. next time they come to Sai Hostels).
                  </p>
                </div>

                {/* Option to toggle conversion to Credits */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Save Balance Days?</span>
                    <span className="text-[10px] text-slate-400 font-medium">Keep {balanceDaysRemaining} days on credit ledger</span>
                  </div>
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={saveToCredit}
                      onChange={e => setSaveToCredit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center text-xs md:text-sm">
                  <span className="text-emerald-800 font-medium">Savings/Balance Days:</span>
                  <span className="font-extrabold text-emerald-700 text-base">+{balanceDaysRemaining} Days saved</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 mt-2 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Guest stayed full duration. No credit days rolled over.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div id="checkout-actions-container" className="flex flex-row space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 border border-slate-200 text-slate-600 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 bg-rose-500 text-white py-2.5 rounded-2xl font-bold text-sm hover:bg-rose-600 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSubmitting ? 'Checking out...' : 'Confirm Checkout'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
