
export interface PaymentBreakdown {
  crdb: number;
  stanbic: number;
  mpesa: number;
  signedBill: number;
  discount: number;
  cancellation: number;
}

export interface ShiftRecord {
  id: string;
  waiterName: string;
  date: string; // Format: YYYY-MM-DD
  totalSales: number;
  breakdown: PaymentBreakdown;
  calculatedCash: number;
  overpaymentAmount: number;
  overpaymentMethod?: string;
  overpaymentRemarks?: string;
  timestamp: number;
  status: 'CLOSED' | 'OPEN';
}

export interface Customer {
  id: string;
  name: string;
  createdAt: number;
}

export interface SignedBillEntry {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  amount: number;
}

export interface PaidBillEntry {
  id: string;
  date: string;
  payerType: 'CUSTOMER' | 'WAITER';
  payerName: string;
  receivedFromWaiter: string; // Jina la muhudumu aliyekabidhi pesa
  amount: number;
  method: 'CASH' | 'M-PESA' | 'STANBIC' | 'CRDB';
  timestamp: number;
}

export interface Attendant {
  id: string;
  name: string;
  createdAt: number;
  status: 'PENDING' | 'CLOSED'; // Default status for generic tracking, dynamic status calculated in views
}

export type ViewType = 'CASHIER' | 'FINANCE' | 'MANAGER';
export type CashierSubView = 'SHIFT' | 'SIGNED_BILL' | 'PAID_BILL';
export type FinanceSubView = 'OVERVIEW' | 'SALES_REPORTS';
