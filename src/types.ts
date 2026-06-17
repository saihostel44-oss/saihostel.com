export interface Guest {
  id: string;
  name: string;
  mobile: string;
  roomNo: string;
  checkIn: string; // format: YYYY-MM-DD
  checkOut: string; // format: YYYY-MM-DD
  status: 'checked_in' | 'checked_out';
  dailyRate: number;
  originalCheckOut?: string;
  actualCheckOut?: string;
  balanceDaysUsed?: number;
  savedBalanceDays?: number;
  notes?: string;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  action: 'earned_from_checkout' | 'used_for_checkin' | 'manual_adjust';
  days: number;
  description: string;
  date: string;
}

export interface GuestCredit {
  id: string; // used mobile number as unique ID for sync
  guestName: string;
  guestMobile: string;
  balanceDays: number;
  updatedAt: string;
  history: CreditTransaction[];
}
