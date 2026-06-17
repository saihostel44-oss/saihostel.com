import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from './firebase';

import { Guest, GuestCredit, CreditTransaction } from './types';
import StatsBanner from './components/StatsBanner';
import NotificationPanel from './components/NotificationPanel';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import CheckoutModal from './components/CheckoutModal';
import CreditManagement from './components/CreditManagement';

import { 
  Home, 
  Gift, 
  Cloud, 
  Smartphone, 
  AlertCircle, 
  LogOut, 
  Sparkles, 
  Check, 
  Menu, 
  Share2,
  UserPlus
} from 'lucide-react';

export default function App() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [credits, setCredits] = useState<GuestCredit[]>([]);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<'bookings' | 'credits'>('bookings');
  
  // Popups & Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [checkoutGuest, setCheckoutGuest] = useState<Guest | null>(null);

  // Connection & Sync UI
  const [isConnected, setIsConnected] = useState(true);

  // Format today's date for notifications - dynamic client side
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Real-time synchronisation with Firestore
  useEffect(() => {
    // Sync Guests
    const qGuests = query(collection(db, 'guests'), orderBy('createdAt', 'desc'));
    const unsubscribeGuests = onSnapshot(qGuests, (snapshot) => {
      const data: Guest[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Guest);
      });
      setGuests(data);
      setIsConnected(true);
    }, (error) => {
      console.error("Guests sync error:", error);
      setIsConnected(false);
    });

    // Sync Credits
    const qCredits = query(collection(db, 'credits'), orderBy('updatedAt', 'desc'));
    const unsubscribeCredits = onSnapshot(qCredits, (snapshot) => {
      const data: GuestCredit[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as GuestCredit);
      });
      setCredits(data);
    }, (error) => {
      console.error("Credits sync error:", error);
    });

    return () => {
      unsubscribeGuests();
      unsubscribeCredits();
    };
  }, []);

  // 2. Add or Edit Guest stays (handles transaction of using saved credits)
  const handleFormSubmit = async (guestData: any, appliedCredits: number) => {
    const isEdit = !!editingGuest;
    const documentId = isEdit ? editingGuest.id : `booking-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const batch = writeBatch(db);

    // Save Guest Record
    const guestRef = doc(db, 'guests', documentId);
    const finalGuestRecord = {
      ...guestData,
      id: documentId,
      createdAt: isEdit ? editingGuest.createdAt : timestamp,
    };
    batch.set(guestRef, finalGuestRecord);

    // Deduct Credit if guest is checking-in & has opted to use existing credit days
    if (appliedCredits > 0 && !isEdit) {
      const mobileId = guestData.mobile.trim();
      const creditRef = doc(db, 'credits', mobileId);
      
      const creditDocSnap = await getDoc(creditRef);
      if (creditDocSnap.exists()) {
        const creditData = creditDocSnap.data() as GuestCredit;
        const currentBalance = creditData.balanceDays || 0;
        const finalBalance = Math.max(0, currentBalance - appliedCredits);

        const newTx: CreditTransaction = {
          id: `tx-${Date.now()}`,
          action: 'used_for_checkin',
          days: -appliedCredits,
          description: `Used ${appliedCredits} credit days for checking in Room ${guestData.roomNo}`,
          date: todayStr,
        };

        batch.update(creditRef, {
          balanceDays: finalBalance,
          updatedAt: timestamp,
          history: [newTx, ...(creditData.history || [])],
        });
      }
    }

    await batch.commit();
    setEditingGuest(null);
  };

  // 3. Confirm checkout (saving early checkout days to GuestCredits ledger)
  const handleConfirmCheckout = async (
    actualCheckoutDate: string, 
    saveBalanceDays: number, 
    creditOptionSelected: boolean
  ) => {
    if (!checkoutGuest) return;

    const guestId = checkoutGuest.id;
    const mobileId = checkoutGuest.mobile.trim();
    const timestamp = new Date().toISOString();

    const batch = writeBatch(db);

    // Update guest stay status to checked out
    const guestRef = doc(db, 'guests', guestId);
    batch.update(guestRef, {
      status: 'checked_out',
      actualCheckOut: actualCheckoutDate,
      savedBalanceDays: saveBalanceDays,
    });

    // Check credit increment
    if (saveBalanceDays > 0 && creditOptionSelected) {
      const creditRef = doc(db, 'credits', mobileId);
      const creditDocSnap = await getDoc(creditRef);

      const newTx: CreditTransaction = {
        id: `tx-${Date.now()}`,
        action: 'earned_from_checkout',
        days: saveBalanceDays,
        description: `Earned ${saveBalanceDays} balance days from checking out early from Room ${checkoutGuest.roomNo}`,
        date: todayStr,
      };

      if (creditDocSnap.exists()) {
        const creditData = creditDocSnap.data() as GuestCredit;
        const finalBalance = (creditData.balanceDays || 0) + saveBalanceDays;
        
        batch.update(creditRef, {
          balanceDays: finalBalance,
          updatedAt: timestamp,
          history: [newTx, ...(creditData.history || [])],
        });
      } else {
        // Create new Credit record
        const newCredit: GuestCredit = {
          id: mobileId,
          guestName: checkoutGuest.name,
          guestMobile: mobileId,
          balanceDays: saveBalanceDays,
          updatedAt: timestamp,
          history: [newTx],
        };
        batch.set(creditRef, newCredit);
      }
    }

    await batch.commit();
    setCheckoutGuest(null);
  };

  // 4. Manually Adjust Credits for a guest mobile from directory view
  const handleAdjustCredit = async (mobile: string, name: string, days: number, reason: string) => {
    const timestamp = new Date().toISOString();
    const cleanMobile = mobile.trim();
    const creditRef = doc(db, 'credits', cleanMobile);

    const creditDocSnap = await getDoc(creditRef);
    const newTx: CreditTransaction = {
      id: `tx-${Date.now()}`,
      action: 'manual_adjust',
      days: days,
      description: reason,
      date: todayStr,
    };

    if (creditDocSnap.exists()) {
      const creditData = creditDocSnap.data() as GuestCredit;
      const finalBalance = Math.max(0, (creditData.balanceDays || 0) + days);
      
      await updateDoc(creditRef, {
        balanceDays: finalBalance,
        updatedAt: timestamp,
        history: [newTx, ...(creditData.history || [])],
      });
    } else {
      const newCredit: GuestCredit = {
        id: cleanMobile,
        guestName: name,
        guestMobile: cleanMobile,
        balanceDays: Math.max(0, days),
        updatedAt: timestamp,
        history: [newTx],
      };
      await setDoc(creditRef, newCredit);
    }
  };

  return (
    <div id="sai-hostels-app" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:py-6 md:px-4">
      {/* Centered responsive mobile shell wrapper */}
      <div 
        id="app-shell-container" 
        className="w-full max-w-lg md:max-w-4xl mx-auto bg-slate-50 md:bg-white md:rounded-3xl md:shadow-xl md:border md:border-slate-100 flex flex-col flex-1 overflow-hidden min-h-screen md:min-h-[850px]"
      >
        
        {/* Active Header Title & Sync Indicator bar */}
        <header id="app-nav-header" className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white flex items-center justify-between shadow-xs relative shrink-0">
          <div className="space-y-0.5">
            <h1 id="brand-heading" className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-1.5 font-sans">
              ✨ Sai Hostels
            </h1>
            <p id="brand-subline" className="text-xs text-amber-50 font-medium">Guest Management & Rollover Credit Portal</p>
          </div>

          <div id="sync-pill-wrapper" className="flex items-center space-x-3">
            {/* Live Synchronisation Status Pill */}
            <div 
              id="live-sync-indicator" 
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isConnected ? 'bg-emerald-400/25 text-emerald-100' : 'bg-rose-400/25 text-rose-100'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
              <span className="hidden sm:inline">{isConnected ? 'Synced Live' : 'Offline'}</span>
            </div>
            
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded-lg border border-white/10 font-bold font-mono">
              v1.2.0
            </span>
          </div>
        </header>

        {/* Dashboard Stats Panel */}
        <div id="dashboard-content-scroller" className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
          
          <StatsBanner guests={guests} credits={credits} todayStr={todayStr} />

          {/* Checkout Due Alerts Panel */}
          <NotificationPanel 
            guests={guests} 
            todayStr={todayStr} 
            onCheckoutClick={(guest) => setCheckoutGuest(guest)} 
          />

          {/* Active Navigation Selection Tab for mobile screen comfort */}
          <div id="navigation-bar" className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 mb-3 text-xs md:text-sm font-bold">
            <button
              onClick={() => setActiveTab('bookings')}
              id="nav-tab-bookings"
              className={`w-1/2 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'bookings' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home className="w-4 h-4 text-amber-500" />
              <span>Stays & Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              id="nav-tab-credits"
              className={`w-1/2 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'credits' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Gift className="w-4 h-4 text-emerald-500" />
              <span>Credits Directory ({credits.filter(c => c.balanceDays > 0).length})</span>
            </button>
          </div>

          {/* Active Directory Viewport Render */}
          {activeTab === 'bookings' ? (
            <div id="viewport-bookings" className="flex-1 flex flex-col">
              <GuestList 
                guests={guests} 
                todayStr={todayStr}
                onEdit={(guest) => {
                  setEditingGuest(guest);
                  setIsFormOpen(true);
                }}
                onCheckout={(guest) => setCheckoutGuest(guest)}
                onAddNewClick={() => {
                  setEditingGuest(null);
                  setIsFormOpen(true);
                }}
              />
            </div>
          ) : (
            <div id="viewport-credits" className="flex-1 flex flex-col">
              <CreditManagement 
                credits={credits} 
                onAdjustCredit={handleAdjustCredit} 
              />
            </div>
          )}

        </div>

        {/* Floating Add Check-In button on Mobile perspective (overlaying tab layout) */}
        {activeTab === 'bookings' && (
          <div className="absolute bottom-6 right-6 md:hidden z-10">
            <button
              type="button"
              onClick={() => {
                setEditingGuest(null);
                setIsFormOpen(true);
              }}
              draggable={false}
              className="bg-amber-500 text-white p-4 rounded-full shadow-lg hover:bg-amber-600 transition flex items-center justify-center active:scale-95"
            >
              <UserPlus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Bottom utility footer */}
        <footer id="app-footer" className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 flex flex-row items-center justify-between shrink-0 font-medium font-sans">
          <span>Sai Hostels Ltd • Mobile Cloud-Synced Booking Portal</span>
          <span className="flex items-center gap-1">
            <Cloud className="w-3 h-3 text-emerald-500" /> Shared DB
          </span>
        </footer>

      </div>

      {/* Popups & Dialogs Render triggers */}

      {/* Booking Form (New/Edit) Modal */}
      {isFormOpen && (
        <GuestForm 
          guest={editingGuest}
          credits={credits}
          onClose={() => {
            setIsFormOpen(false);
            setEditingGuest(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Dynamic Checkout Dialog with Unused rollover credit support */}
      {checkoutGuest && (
        <CheckoutModal 
          guest={checkoutGuest}
          todayStr={todayStr}
          onClose={() => setCheckoutGuest(null)}
          onConfirm={handleConfirmCheckout}
        />
      )}

    </div>
  );
}
