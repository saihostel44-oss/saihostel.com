import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, Home, DollarSign, Save, X, Sparkles, HelpCircle } from 'lucide-react';
import { Guest, GuestCredit } from '../types';

interface GuestFormProps {
  guest?: Guest | null;
  credits: GuestCredit[];
  onClose: () => void;
  onSubmit: (guestData: any, appliedCredits: number) => Promise<void>;
}

export default function GuestForm({ guest, credits, onClose, onSubmit }: GuestFormProps) {
  const [name, setName] = useState(guest?.name || '');
  const [mobile, setMobile] = useState(guest?.mobile || '');
  const [roomNo, setRoomNo] = useState(guest?.roomNo || '');
  const [checkIn, setCheckIn] = useState(guest?.checkIn || new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(guest?.checkOut || '');
  const [dailyRate, setDailyRate] = useState(guest?.dailyRate || 500); // INR or general currency defaults
  const [notes, setNotes] = useState(guest?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Credit details
  const [detectedCredit, setDetectedCredit] = useState<GuestCredit | null>(null);
  const [applyCredits, setApplyCredits] = useState(false);
  const [appliedCreditDays, setAppliedCreditDays] = useState(0);

  // Auto detect credits when mobile number is updated
  useEffect(() => {
    const cleanMobile = mobile.trim();
    if (cleanMobile.length >= 8) {
      const match = credits.find(c => c.id === cleanMobile || c.guestMobile === cleanMobile);
      if (match && match.balanceDays > 0) {
        setDetectedCredit(match);
        // Default apply full credit or up to the total stay duration
        const duration = calculateStayDuration(checkIn, checkOut);
        setAppliedCreditDays(Math.min(match.balanceDays, duration || 1));
      } else {
        setDetectedCredit(null);
        setApplyCredits(false);
        setAppliedCreditDays(0);
      }
    } else {
      setDetectedCredit(null);
      setApplyCredits(false);
      setAppliedCreditDays(0);
    }
  }, [mobile, credits]);

  // If stay duration changes, adjust credit caps
  useEffect(() => {
    if (detectedCredit) {
      const duration = calculateStayDuration(checkIn, checkOut);
      if (duration > 0) {
        setAppliedCreditDays(prev => Math.min(detectedCredit.balanceDays, duration));
      }
    }
  }, [checkIn, checkOut, detectedCredit]);

  const calculateStayDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = eDate.getTime() - sDate.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stayDuration = calculateStayDuration(checkIn, checkOut);
  const totalAmount = stayDuration * dailyRate;
  
  // Calculate final cash amount payable after credits
  const finalPayable = applyCredits 
    ? Math.max(0, (stayDuration - appliedCreditDays) * dailyRate)
    : totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Guest Name is required');
    if (!mobile.trim()) return setError('Mobile Number is required');
    if (!roomNo.trim()) return setError('Room / Bed Number is required');
    if (!checkIn) return setError('Check-In Date is required');
    if (!checkOut) return setError('Check-Out Date is required');
    if (stayDuration <= 0) return setError('Check-Out must be after Check-In Date');

    try {
      setIsSubmitting(true);
      
      const guestData = {
        name: name.trim(),
        mobile: mobile.trim(),
        roomNo: roomNo.trim(),
        checkIn,
        checkOut,
        dailyRate: Number(dailyRate),
        notes: notes.trim(),
        status: guest?.status || 'checked_in',
        balanceDaysUsed: applyCredits ? appliedCreditDays : 0,
      };

      await onSubmit(guestData, applyCredits ? appliedCreditDays : 0);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register guest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="guest-form-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="guest-form-modal" className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div id="guest-form-header" className="px-6 py-5 bg-amber-500 text-white flex flex-row items-center justify-between">
          <div>
            <h2 id="guest-form-title" className="text-lg md:text-xl font-bold font-sans">
              {guest ? '🛠️ Edit Guest Booking' : '🏨 New Guest Check-In'}
            </h2>
            <p id="guest-form-subtitle" className="text-xs text-amber-50">Provide guest stay details and credit preferences</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-xl transition cursor-pointer"
            id="btn-close-guest-form"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body / Scrollable Info */}
        <form onSubmit={handleSubmit} id="guest-booking-form" className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[75vh]">
          {error && (
            <div id="form-error-banner" className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* Guest Name */}
          <div id="form-field-name">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Guest Name *
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter full name"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
              required 
            />
          </div>

          {/* Mobile Number */}
          <div id="form-field-mobile">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number *
            </label>
            <input 
              type="tel" 
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} // only digits for easy sync matching
              placeholder="e.g. 9876543210 (Unique identifier)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
              required 
            />
            <p className="text-[10px] text-slate-400 mt-1">Mobile number is used to uniquely identify this guest's future credit balance.</p>
          </div>

          {/* Credit Detection Alert Box */}
          {detectedCredit && (
            <div id="credit-detected-display" className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-emerald-950">
                <div className="flex items-center space-x-2 text-xs md:text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Spark Credit Found!</span>
                </div>
                <span className="text-xs bg-emerald-200 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                  {detectedCredit.balanceDays} Days Available
                </span>
              </div>
              <p className="text-xs text-emerald-700">
                This guest has {detectedCredit.balanceDays} balance days saved from a previous early check-out. Would you like to apply these credits to this check-in?
              </p>
              
              <div className="flex items-center space-x-3 pt-1">
                <label className="relative flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={applyCredits}
                    onChange={e => setApplyCredits(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-xs font-bold text-emerald-800">Apply credit days</span>
                </label>

                {applyCredits && (
                  <div className="flex items-center space-x-1">
                    <input 
                      type="number" 
                      min="1" 
                      max={Math.min(detectedCredit.balanceDays, stayDuration || 1)}
                      value={appliedCreditDays}
                      onChange={e => setAppliedCreditDays(Math.min(detectedCredit.balanceDays, Number(e.target.value)))}
                      className="w-16 bg-white border border-emerald-300 font-bold text-xs text-center rounded-lg py-1 px-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-emerald-800 font-medium">Days</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Room Number & Daily Rate details */}
          <div id="form-grid-room" className="grid grid-cols-2 gap-3">
            <div id="form-field-room">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-slate-400" /> Room / Bed No *
              </label>
              <input 
                type="text" 
                value={roomNo}
                onChange={e => setRoomNo(e.target.value)}
                placeholder="e.g. 104-A"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
                required 
              />
            </div>
            
            <div id="form-field-rate">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Daily Rate (₹) *
              </label>
              <input 
                type="number" 
                min="0"
                value={dailyRate}
                onChange={e => setDailyRate(Number(e.target.value))}
                placeholder="rate per day"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
                required 
              />
            </div>
          </div>

          {/* Stay Dates */}
          <div id="form-grid-stay" className="grid grid-cols-2 gap-3">
            <div id="form-field-checkin">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Check-In *
              </label>
              <input 
                type="date" 
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
                required 
              />
            </div>
            
            <div id="form-field-checkout">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Check-Out *
              </label>
              <input 
                type="date" 
                value={checkOut}
                min={checkIn}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
                required 
              />
            </div>
          </div>

          {/* Pricing Outline Box */}
          {stayDuration > 0 && (
            <div id="pricing-outline-container" className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col space-y-1.5 text-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span>Total Stay Duration:</span>
                <span className="font-bold text-slate-900">{stayDuration} Days</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Daily Rent Charge:</span>
                <span className="font-medium text-slate-800">₹{dailyRate} / day</span>
              </div>
              
              {applyCredits && (
                <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                  <span>Applied Credits Discount:</span>
                  <span>- {appliedCreditDays} Saved Days</span>
                </div>
              )}

              <div className="border-t border-slate-200/50 my-1"></div>

              <div id="booking-payment-total" className="flex justify-between items-center text-sm font-bold pt-0.5">
                <span className="text-slate-800">Final Cash Due at Checkout:</span>
                <span className="text-amber-600 text-base">₹{finalPayable}</span>
              </div>
            </div>
          )}

          {/* Backdoor or Notes details */}
          <div id="form-field-notes">
            <label className="block text-xs font-bold text-slate-700 mb-1">Stay Notes / Remarks</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any specific requests, ID proof info, or luggage notes..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
            />
          </div>

          {/* Modal Actions */}
          <div id="form-actions-buttons" className="flex flex-row space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              id="btn-cancel-guest-form"
              className="w-1/2 border border-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition cursor-pointer active:scale-98"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-save-guest-form"
              className="w-1/2 bg-amber-500 text-white py-3 rounded-2xl font-bold text-sm hover:bg-amber-600 focus:ring-4 focus:ring-amber-500/20 transition cursor-pointer flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-55"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : (guest ? 'Update Guest' : 'Check-In Guest')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
