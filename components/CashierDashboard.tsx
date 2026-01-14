
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  History, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Lock, 
  Unlock,
  ArrowRight,
  FileText, 
  Search,
  AlertTriangle,
  X,
  ClipboardList,
  CheckCircle2,
  CalendarPlus,
  Receipt,
  UserPlus,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Banknote,
  Printer,
  Smartphone,
  Landmark,
  BadgePercent,
  Ban,
  CheckSquare,
  Users,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { ShiftRecord, PaymentBreakdown, Attendant, SignedBillEntry, Customer, PaidBillEntry, CashierSubView } from '../types';

interface CashierDashboardProps {
  records: ShiftRecord[];
  onAddRecord: (record: ShiftRecord) => void;
  onCloseDayShift: (date: string) => void;
  onFinalizeSignedBill: (date: string) => void;
  registeredAttendants: Attendant[];
  closedDates: string[];
  finalizedSignedBillDates: string[];
  signedBillEntries: SignedBillEntry[];
  onUpdateSignedBills: (date: string, entries: SignedBillEntry[]) => void;
  paidBillEntries: PaidBillEntry[];
  onAddPaidBill: (entry: PaidBillEntry) => void;
  activeView: CashierSubView;
  onViewChange: (view: CashierSubView) => void;
  masterCustomers: Customer[];
  onRegisterCustomer: (name: string) => Customer;
}

const INITIAL_BREAKDOWN: PaymentBreakdown = {
  crdb: 0,
  stanbic: 0,
  mpesa: 0,
  signedBill: 0,
  discount: 0,
  cancellation: 0,
};

const CashierDashboard: React.FC<CashierDashboardProps> = ({ 
  records, 
  onAddRecord, 
  onCloseDayShift,
  onFinalizeSignedBill,
  registeredAttendants,
  closedDates,
  finalizedSignedBillDates,
  signedBillEntries,
  onUpdateSignedBills,
  paidBillEntries,
  onAddPaidBill,
  activeView,
  onViewChange,
  masterCustomers,
  onRegisterCustomer
}) => {
  // --- STATE ---
  const [dailyTotalExpected, setDailyTotalExpected] = useState<number>(0);
  const [isDailyLocked, setIsDailyLocked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  
  // Confirmation States
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isConfirmingSB, setIsConfirmingSB] = useState(false);
  const [isConfirmingPB, setIsConfirmingPB] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);

  const [waiterName, setWaiterName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<PaymentBreakdown>(INITIAL_BREAKDOWN);
  
  // Signed Bill specific state
  const [sbEntryMode, setSbEntryMode] = useState<'NEW' | 'EXISTING'>('EXISTING');
  const [sbNewCustomerName, setSbNewCustomerName] = useState('');
  const [sbSearchTerm, setSbSearchTerm] = useState('');
  const [sbSelectedCustomer, setSbSelectedCustomer] = useState<Customer | null>(null);
  const [sbAmount, setSbAmount] = useState<number>(0);
  const [isSbCustomerDropdownOpen, setIsSbCustomerDropdownOpen] = useState(false);

  // Paid Bill specific state
  const [pbPayerType, setPbPayerType] = useState<'CUSTOMER' | 'WAITER'>('WAITER');
  const [pbPayerName, setPbPayerName] = useState('');
  const [pbAmount, setPbAmount] = useState<number>(0);
  const [pbMethod, setPbMethod] = useState<'CASH' | 'M-PESA' | 'STANBIC' | 'CRDB'>('CASH');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sbDropdownRef = useRef<HTMLDivElement>(null);

  // --- MEMOS ---
  const isDayFinalized = useMemo(() => closedDates.includes(selectedDate), [closedDates, selectedDate]);
  const isSBFinalized = useMemo(() => finalizedSignedBillDates.includes(selectedDate), [finalizedSignedBillDates, selectedDate]);
  
  const dailyRecords = useMemo(() => records.filter(r => r.date === selectedDate), [records, selectedDate]);
  const dailyPaidBills = useMemo(() => paidBillEntries.filter(e => e.date === selectedDate), [paidBillEntries, selectedDate]);
  const currentDaySBEntries = useMemo(() => signedBillEntries.filter(e => e.date === selectedDate), [signedBillEntries, selectedDate]);
  
  const reconciledToday = useMemo(() => dailyRecords.reduce((acc, r) => acc + r.totalSales, 0), [dailyRecords]);
  const shiftSignedBillTotal = useMemo(() => dailyRecords.reduce((acc, r) => acc + (r.breakdown.signedBill || 0), 0), [dailyRecords]);

  const daySummary = useMemo(() => dailyRecords.reduce((acc, r) => {
    acc.cash += r.calculatedCash;
    acc.crdb += r.breakdown.crdb;
    acc.stanbic += r.breakdown.stanbic;
    acc.mpesa += r.breakdown.mpesa;
    acc.signedBill += r.breakdown.signedBill;
    acc.discount += r.breakdown.discount;
    acc.cancellation += r.breakdown.cancellation;
    acc.overpayments += (r.overpaymentAmount || 0);
    return acc;
  }, { cash: 0, crdb: 0, stanbic: 0, mpesa: 0, signedBill: 0, discount: 0, cancellation: 0, overpayments: 0 }), [dailyRecords]);

  const paidBillSummary = useMemo(() => dailyPaidBills.reduce((acc, e) => {
    if (e.method === 'CASH') acc.cash += e.amount;
    if (e.method === 'M-PESA') acc.mpesa += e.amount;
    if (e.method === 'STANBIC') acc.stanbic += e.amount;
    if (e.method === 'CRDB') acc.crdb += e.amount;
    acc.total += e.amount;
    return acc;
  }, { cash: 0, mpesa: 0, stanbic: 0, crdb: 0, total: 0 }), [dailyPaidBills]);

  // Filter master staff list: Only those who haven't processed a record today
  const filteredAttendants = useMemo(() => {
    const closedStaffNames = dailyRecords.map(r => r.waiterName);
    return registeredAttendants.filter(a => 
      !closedStaffNames.includes(a.name) && 
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registeredAttendants, dailyRecords, searchTerm]);

  const filteredCustomers = useMemo(() => masterCustomers.filter(c => 
    c.name.toLowerCase().includes(sbSearchTerm.toLowerCase())
  ), [masterCustomers, sbSearchTerm]);

  const totalDeductions = useMemo(() => (Object.values(breakdown) as number[]).reduce((sum, val) => sum + val, 0), [breakdown]);
  const difference = useMemo(() => totalDeductions - totalSales, [totalDeductions, totalSales]);
  const isOverpaid = difference > 0;
  const remainingCashInput = useMemo(() => isOverpaid ? 0 : totalSales - totalDeductions, [totalSales, totalDeductions, isOverpaid]);

  const unreconciledDates = useMemo(() => {
    return closedDates.filter(date => {
      if (finalizedSignedBillDates.includes(date)) return false;
      const dayRecords = records.filter(r => r.date === date);
      const dayTotalSB = dayRecords.reduce((acc, r) => acc + (r.breakdown.signedBill || 0), 0);
      return dayTotalSB > 0;
    });
  }, [closedDates, records, finalizedSignedBillDates]);

  // --- EFFECTS ---
  useEffect(() => { if (isDayFinalized) setIsDailyLocked(false); }, [selectedDate, closedDates]);
  
  // AUTO-FILL Payer Name if WAITER type is selected
  useEffect(() => {
    if (pbPayerType === 'WAITER' && waiterName) {
      setPbPayerName(waiterName);
    } else if (pbPayerType === 'CUSTOMER') {
        setPbPayerName('');
    }
  }, [pbPayerType, waiterName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (sbDropdownRef.current && !sbDropdownRef.current.contains(event.target as Node)) setIsSbCustomerDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsConfirmingClose(false);
    setIsConfirmingSB(false);
    setIsConfirmingPB(false);
  };

  const handleInputChange = (key: keyof PaymentBreakdown, value: string) => {
    setBreakdown(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleOpenNextDay = () => {
    if (unreconciledDates.length > 0) {
      alert(`MAKOSA! Maliza Signed Bills za tarehe: ${unreconciledDates.join(', ')} kwanza kabla ya kufungua siku mpya.`);
      onViewChange('SIGNED_BILL');
      setSelectedDate(unreconciledDates[0]);
      return;
    }

    // Njia mbadala ya kuongeza siku kwa usahihi kulingana na tarehe iliyochaguliwa
    const parts = selectedDate.split('-').map(Number);
    const currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
    currentDate.setDate(currentDate.getDate() + 1);
    
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const nextDayStr = `${y}-${m}-${d}`;

    if (closedDates.includes(nextDayStr)) {
      alert("Tarehe inayofuata tayari imeshafungwa.");
      setSelectedDate(nextDayStr);
    } else {
      setSelectedDate(nextDayStr);
      setIsDailyLocked(false);
      setDailyTotalExpected(0);
      onViewChange('SHIFT'); // Hakikisha tuko kwenye Shift Entry
    }
  };

  const handleCloseAttendant = () => {
    if (isDayFinalized || !waiterName || totalSales <= 0) return;
    onAddRecord({
      id: Math.random().toString(36).substr(2, 9),
      waiterName,
      date: selectedDate,
      totalSales,
      breakdown: { ...breakdown },
      calculatedCash: remainingCashInput,
      overpaymentAmount: isOverpaid ? difference : 0,
      timestamp: Date.now(),
      status: 'CLOSED'
    });
    setWaiterName(''); setSearchTerm(''); setTotalSales(0); setBreakdown(INITIAL_BREAKDOWN);
  };

  const handleAddPaidBillEntry = () => {
    if (pbAmount <= 0 || !waiterName || !pbPayerName) {
      alert("Tafadhali chagua Muhudumu kwanza na ujaze Jina la Mlipaji na Kiasi.");
      return;
    }

    if (!isConfirmingPB) {
      setIsConfirmingPB(true);
      return;
    }

    onAddPaidBill({
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      payerType: pbPayerType,
      payerName: pbPayerName,
      receivedFromWaiter: waiterName,
      amount: pbAmount,
      method: pbMethod,
      timestamp: Date.now()
    });

    // Reset Form
    setPbPayerName(pbPayerType === 'WAITER' ? waiterName : '');
    setPbAmount(0);
    setPbMethod('CASH');
    setIsConfirmingPB(false);
    alert("Malipo ya deni yamerekodiwa!");
  };

  const handleFinalLock = () => {
    if (isDayFinalized) return;
    if (!isConfirmingClose) {
      setIsConfirmingClose(true);
      return;
    }
    onCloseDayShift(selectedDate);
    setCloseSuccess(true);
    setTimeout(() => {
      setShowSummaryReport(false);
      setIsDailyLocked(false);
      setDailyTotalExpected(0);
      setIsConfirmingClose(false);
      setCloseSuccess(false);
      const hasSB = records.some(r => r.date === selectedDate && r.breakdown.signedBill > 0);
      if (hasSB) onViewChange('SIGNED_BILL');
    }, 2000);
  };

  const handleFinalizeSB = () => {
    if (isSBFinalized) return;
    if (Math.abs(sbRemaining) > 1) {
      alert(`HESABU HAIJALINGANA!\n\nTarget: ${new Intl.NumberFormat('en-TZ').format(shiftSignedBillTotal)}\nUmeingiza: ${new Intl.NumberFormat('en-TZ').format(sbEnteredTotal)}\n\nBado kuna upungufu wa TZS ${new Intl.NumberFormat('en-TZ').format(sbRemaining)}.`);
      return;
    }
    if (!isConfirmingSB) {
      setIsConfirmingSB(true);
      return;
    }
    onFinalizeSignedBill(selectedDate);
    setIsConfirmingSB(false);
    alert("HESABU YA SIGNED BILL IMEFUNGWA KISHERIA.");
  };

  const handleAddSignedBillEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (sbAmount <= 0 || isSBFinalized) return;

    let customer: Customer;
    if (sbEntryMode === 'NEW') {
      if (!sbNewCustomerName.trim()) return;
      customer = onRegisterCustomer(sbNewCustomerName);
    } else {
      if (!sbSelectedCustomer) return;
      customer = sbSelectedCustomer;
    }

    const dayEntries = signedBillEntries.filter(e => e.date === selectedDate);
    const existingEntryIndex = dayEntries.findIndex(e => e.customerId === customer.id);

    let updatedDayEntries;
    if (existingEntryIndex > -1) {
      updatedDayEntries = dayEntries.map((entry, index) => 
        index === existingEntryIndex 
          ? { ...entry, amount: entry.amount + sbAmount } 
          : entry
      );
    } else {
      const newEntry: SignedBillEntry = { 
        id: Math.random().toString(36).substr(2, 9), 
        date: selectedDate, 
        customerId: customer.id,
        customerName: customer.name, 
        amount: sbAmount 
      };
      updatedDayEntries = [...dayEntries, newEntry];
    }

    onUpdateSignedBills(selectedDate, updatedDayEntries);
    setSbNewCustomerName(''); 
    setSbSelectedCustomer(null); 
    setSbSearchTerm(''); 
    setSbAmount(0);
  };

  const sbEnteredTotal = currentDaySBEntries.reduce((acc, e) => acc + e.amount, 0);
  const sbRemaining = shiftSignedBillTotal - sbEnteredTotal;
  const isSbFullyMatched = Math.abs(sbRemaining) < 1 && shiftSignedBillTotal > 0;

  return (
    <div className="space-y-8 pb-20">
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={20} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumla Ya Mauzo</p>
           </div>
           <h4 className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(dailyTotalExpected)}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckSquare size={20} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mauzo Yaliyolipwa</p>
           </div>
           <h4 className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(reconciledToday)}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Banknote size={20} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash in Hand</p>
           </div>
           <h4 className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.cash + paidBillSummary.cash)}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText size={20} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumla ya Signed Bill</p>
           </div>
           <h4 className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(shiftSignedBillTotal)}</h4>
        </div>
        <div className="flex items-center justify-end md:col-span-2 lg:col-span-4 xl:col-span-1">
           {!isDayFinalized && (reconciledToday > 0 || dailyPaidBills.length > 0) && activeView === 'SHIFT' && (
             <button 
               onClick={() => setShowSummaryReport(true)}
               className={`w-full px-10 py-5 rounded-2xl font-black text-white shadow-xl transition-all ${isConfirmingClose ? 'bg-rose-600 animate-pulse' : 'bg-slate-900 hover:scale-105'}`}
             >
               MUHTASARI WA SIKU
             </button>
           )}
        </div>
      </div>

      {/* 2. SUMMARY REPORT MODAL */}
      {showSummaryReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-lg" onClick={() => !closeSuccess && setShowSummaryReport(false)} />
          <div id="printable-report" className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30"><ClipboardList size={32} /></div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">MUHTASARI WA SIKU: {selectedDate}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Full Daily Financial Statement</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => window.print()} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Printer size={24} /></button>
                <button onClick={() => setShowSummaryReport(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 space-y-12">
              
              {/* SECTION 1: MAUZO YA LEO (Mchanganuo Kamili) */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                    <Receipt size={24} className="text-emerald-600" />
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Summary ya Mauzo (Full Breakdown)</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CASH RECEIVED</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.cash)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">M-PESA</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.mpesa)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CRDB</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.crdb)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">STANBIC</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.stanbic)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">SIGNED BILL</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.signedBill)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">DISCOUNT</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.discount)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CANCELLATION</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(daySummary.cancellation)}</p>
                    </div>
                    <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100">
                       <p className="text-[9px] font-black text-rose-400 uppercase mb-1">OVERPAYMENT</p>
                       <p className="text-lg font-black text-rose-600">{new Intl.NumberFormat('en-TZ').format(daySummary.overpayments)}</p>
                    </div>
                    <div className="bg-emerald-600 p-5 rounded-3xl text-white col-span-2 md:col-span-4">
                       <div className="flex justify-between items-center">
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">JUMLA YA MAUZO YA SIKU (TOTAL SALES)</p>
                          <p className="text-3xl font-black">{new Intl.NumberFormat('en-TZ').format(reconciledToday)} TZS</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* SECTION 2: SIGNED BILL (Orodha ya Wateja) */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                    <FileText size={24} className="text-indigo-600" />
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Summary ya Signed Bill</h3>
                 </div>
                 <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <tr>
                             <th className="px-8 py-4">Jina la Mteja</th>
                             <th className="px-8 py-4">Tarehe</th>
                             <th className="px-8 py-4 text-right">Kiasi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {currentDaySBEntries.length === 0 ? (
                             <tr><td colSpan={3} className="px-8 py-8 text-center text-slate-400 italic">Hakuna Signed Bill zilizorekodiwa leo...</td></tr>
                          ) : (
                             currentDaySBEntries.map(e => (
                                <tr key={e.id} className="text-xs">
                                   <td className="px-8 py-4 font-bold text-slate-900">{e.customerName}</td>
                                   <td className="px-8 py-4 text-slate-500">{e.date}</td>
                                   <td className="px-8 py-4 text-right font-black text-indigo-600">{new Intl.NumberFormat('en-TZ').format(e.amount)}</td>
                                </tr>
                             ))
                          )}
                       </tbody>
                       <tfoot className="bg-indigo-50">
                          <tr>
                             <td colSpan={2} className="px-8 py-4 font-black text-indigo-900 uppercase text-[10px] tracking-widest text-left">Jumla ya Signed Bill (Mikopo)</td>
                             <td className="px-8 py-4 text-right font-black text-indigo-700 text-lg">{new Intl.NumberFormat('en-TZ').format(shiftSignedBillTotal)}</td>
                          </tr>
                       </tfoot>
                    </table>
                 </div>
              </div>

              {/* SECTION 3: PAID BILLS (DEBT RECOVERY) */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                    <Banknote size={24} className="text-indigo-600" />
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Summary ya Paid Bill</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CASH RECEIVED</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(paidBillSummary.cash)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">M-PESA RECEIVED</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(paidBillSummary.mpesa)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">BANK (DIGITAL)</p>
                       <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(paidBillSummary.stanbic + paidBillSummary.crdb)}</p>
                    </div>
                    <div className="bg-indigo-600 p-5 rounded-3xl text-white">
                       <p className="text-white/60 text-[9px] font-black uppercase mb-1">TOTAL PAID BILL</p>
                       <p className="text-lg font-black">{new Intl.NumberFormat('en-TZ').format(paidBillSummary.total)}</p>
                    </div>
                 </div>
                 
                 <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm mt-4">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <tr>
                             <th className="px-8 py-4">Mlipaji</th>
                             <th className="px-8 py-4">Aina</th>
                             <th className="px-8 py-4">Njia ya Malipo</th>
                             <th className="px-8 py-4 text-right">Kiasi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {dailyPaidBills.length === 0 ? (
                             <tr><td colSpan={4} className="px-8 py-8 text-center text-slate-400 italic">Hakuna Paid Bills leo...</td></tr>
                          ) : (
                             dailyPaidBills.map(e => (
                                <tr key={e.id} className="text-xs">
                                   <td className="px-8 py-4 font-bold text-slate-900">{e.payerName}</td>
                                   <td className="px-8 py-4 text-slate-500 font-medium">{e.payerType}</td>
                                   <td className="px-8 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black">{e.method}</span></td>
                                   <td className="px-8 py-4 text-right font-black text-indigo-600">{new Intl.NumberFormat('en-TZ').format(e.amount)}</td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* TOTAL CASH TO DRAWER */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center text-white">
                 <div>
                    <h4 className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Jumla ya Pesa Taslimu (Cash in Drawer)</h4>
                    <p className="text-xs text-white/40 mb-2 italic">Shift Cash ({new Intl.NumberFormat('en-TZ').format(daySummary.cash)}) + Paid Bill Cash ({new Intl.NumberFormat('en-TZ').format(paidBillSummary.cash)})</p>
                 </div>
                 <p className="text-4xl font-black text-emerald-400">{new Intl.NumberFormat('en-TZ').format(daySummary.cash + paidBillSummary.cash)} TZS</p>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 no-print bg-white">
              {!isDayFinalized && (
                <button 
                  onClick={handleFinalLock} 
                  className={`px-10 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-slate-900/10 ${isConfirmingClose ? 'bg-rose-600 animate-pulse' : 'bg-slate-900'}`}
                >
                  {isConfirmingClose ? 'HAKIKI KUFUNGA SIKU' : 'FUNGA SIKU SASA'}
                </button>
              )}
              <button onClick={() => setShowSummaryReport(false)} className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-colors">DIRISHA</button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'SHIFT' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          <div className="lg:col-span-2 space-y-6">
            {!isDailyLocked ? (
              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-emerald-100 overflow-hidden">
                <div className={`p-10 text-white ${isDayFinalized ? 'bg-slate-900' : 'bg-emerald-600'}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 rounded-3xl">{isDayFinalized ? <Lock size={32} /> : <Unlock size={32} />}</div>
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tight">{isDayFinalized ? 'Siku Imefungwa' : 'Fungua Shift'}</h3>
                      <p className="text-white/70 font-medium">Bofya kuanza kuingiza hesabu za wahudumu.</p>
                    </div>
                  </div>
                </div>
                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarehe ya Kazi</label>
                      <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-slate-100 outline-none text-xl font-bold" />
                    </div>
                    {!isDayFinalized && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumla ya Mauzo ya POS</label>
                        <input type="number" value={dailyTotalExpected || ''} onChange={(e) => setDailyTotalExpected(parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-slate-100 outline-none text-3xl font-black text-emerald-700" placeholder="0.00" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    <button onClick={() => isDayFinalized ? setShowSummaryReport(true) : dailyTotalExpected > 0 && setIsDailyLocked(true)} className={`w-full py-6 text-white rounded-[1.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 ${isDayFinalized ? 'bg-slate-800' : 'bg-emerald-600'}`}>
                      {isDayFinalized ? 'ANGALIA RIPOTI YA SIKU' : 'ANZA KULIPISHA LEO'} <ArrowRight size={28} />
                    </button>
                    {isDayFinalized && (
                      <button onClick={handleOpenNextDay} className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all">
                        <CalendarPlus size={28} /> FUNGUA SIKU INAYOFUATA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex justify-between items-center bg-slate-900 -m-10 p-10 mb-10 text-white rounded-t-[2.5rem]">
                   <div className="flex items-center gap-4"><Unlock className="text-amber-500" size={32}/> <h3 className="text-3xl font-black uppercase tracking-tight">Active Shift: {selectedDate}</h3></div>
                   <button onClick={() => setIsDailyLocked(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-colors"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3 relative" ref={dropdownRef}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Muhudumu</label>
                      <input type="text" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setIsDropdownOpen(true);}} onFocus={() => setIsDropdownOpen(true)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-lg outline-none focus:border-emerald-500" placeholder="Tafuta jina..." />
                      {isDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                           {filteredAttendants.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs italic">Hakuna wahudumu waliobaki...</div> : 
                            filteredAttendants.map(att => (<button key={att.id} onClick={() => {setWaiterName(att.name); setSearchTerm(att.name); setIsDropdownOpen(false);}} className="w-full px-6 py-4 hover:bg-emerald-50 text-left font-bold border-b last:border-0">{att.name}</button>))}
                        </div>
                      )}
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumla ya Mauzo</label>
                      <input type="number" value={totalSales || ''} onChange={(e) => setTotalSales(parseFloat(e.target.value) || 0)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-black text-2xl text-emerald-700 outline-none focus:border-emerald-500" placeholder="0.00" />
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-8 border-b border-slate-100">
                  {['crdb', 'stanbic', 'mpesa', 'signedBill', 'discount', 'cancellation'].map(key => (
                    <div key={key} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key}</label>
                      <input type="number" value={breakdown[key as keyof PaymentBreakdown] || ''} onChange={(e) => handleInputChange(key as keyof PaymentBreakdown, e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  ))}
                </div>

                {/* --- INTEGRATED PAID BILLS SECTION --- */}
                <div className="bg-emerald-50/50 -mx-10 p-10 space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Banknote size={20} /></div>
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Paid Bills (Debt Recovery)</h4>
                   </div>
                   
                   <div className="flex gap-4 p-1.5 bg-white rounded-2xl border border-emerald-100 max-w-md">
                      <button 
                        type="button" 
                        onClick={() => { setPbPayerType('WAITER'); setIsConfirmingPB(false); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${pbPayerType === 'WAITER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-emerald-50'}`}
                      >
                        Deni la Muhudumu
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setPbPayerType('CUSTOMER'); setIsConfirmingPB(false); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${pbPayerType === 'CUSTOMER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-emerald-50'}`}
                      >
                        Deni la Mteja
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jina la Mlipaji</label>
                        <input 
                          type="text" 
                          value={pbPayerName} 
                          onChange={(e) => { setPbPayerName(e.target.value); setIsConfirmingPB(false); }} 
                          className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" 
                          placeholder={pbPayerType === 'CUSTOMER' ? "Ingiza Jina la Mteja" : "Jina la Muhudumu"} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kiasi Kilicholipwa</label>
                        <input type="number" value={pbAmount || ''} onChange={(e) => { setPbAmount(parseFloat(e.target.value) || 0); setIsConfirmingPB(false); }} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Njia ya Malipo</label>
                        <select value={pbMethod} onChange={(e) => { setPbMethod(e.target.value as any); setIsConfirmingPB(false); }} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                           <option value="CASH">CASH</option>
                           <option value="M-PESA">M-PESA</option>
                           <option value="STANBIC">STANBIC</option>
                           <option value="CRDB">CRDB</option>
                        </select>
                      </div>
                   </div>

                   <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={handleAddPaidBillEntry}
                        className={`px-8 py-3 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-2 ${isConfirmingPB ? 'bg-amber-500 animate-pulse text-white' : 'bg-emerald-600 text-white hover:scale-105'}`}
                      >
                         {isConfirmingPB ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                         {isConfirmingPB ? 'HAKIKI MALIPO' : 'REKODI MALIPO'}
                      </button>
                   </div>

                   {/* List of Paid Bills for this specific waiter/session */}
                   {dailyPaidBills.filter(e => e.receivedFromWaiter === waiterName).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-emerald-100 space-y-2">
                         <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Malipo yaliyorekodiwa kwa muhudumu huyu:</p>
                         <div className="flex flex-wrap gap-2">
                            {dailyPaidBills.filter(e => e.receivedFromWaiter === waiterName).map(e => (
                               <div key={e.id} className="bg-white px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] flex items-center gap-2">
                                  <span className="font-bold text-slate-700">{e.payerName}:</span>
                                  <span className="font-black text-emerald-600">{new Intl.NumberFormat('en-TZ').format(e.amount)}</span>
                                  <span className="text-slate-400">({e.method})</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>

                <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
                   <div className="text-center lg:text-left">
                     <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">CASH TO RECEIVE (SALES ONLY)</p>
                     <h4 className="text-5xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(remainingCashInput)}</h4>
                   </div>
                   <button onClick={handleCloseAttendant} disabled={!waiterName || totalSales <= 0} className="px-12 py-6 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">FUNGA MUHUDUMU</button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
             <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs mb-6 tracking-widest"><History size={16} /> Miamala ya Leo</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {dailyRecords.length === 0 ? <p className="text-slate-400 text-xs text-center italic py-10">Bado hujaingiza hesabu yoyote leo.</p> : 
                    dailyRecords.map(r => (
                      <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex justify-between items-center group hover:bg-white transition-all">
                        <div>
                           <p className="font-black text-slate-900 text-xs">{r.waiterName}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Shift Closed</p>
                        </div>
                        <p className="font-black text-emerald-600 text-sm">{new Intl.NumberFormat('en-TZ').format(r.calculatedCash)}</p>
                      </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      ) : activeView === 'SIGNED_BILL' ? (
        <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-40 relative">
           <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-indigo-100 overflow-hidden">
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/20 rounded-3xl"><FileText size={32} /></div>
                    <div>
                       <h3 className="text-3xl font-black uppercase tracking-tight">Signed Bill Reconciliation</h3>
                       <p className="text-indigo-100 font-medium opacity-80">Andaa orodha ya wateja wa tarehe {selectedDate}</p>
                    </div>
                 </div>
                 <div className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg ${isSBFinalized ? 'bg-slate-900 text-white' : (isSbFullyMatched ? 'bg-white text-indigo-600 animate-pulse' : 'bg-rose-500 text-white')}`}>
                    {isSBFinalized ? <Lock size={24}/> : (isSbFullyMatched ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>)}
                    {isSBFinalized ? 'IMEKAMLIKA' : (isSbFullyMatched ? 'READY TO FINALIZE' : 'PENDING')}
                 </div>
              </div>

              <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-7 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Target From Shift</p>
                          <h4 className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(shiftSignedBillTotal)}</h4>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Still Remaining</p>
                          <h4 className={`text-2xl font-black transition-colors ${sbRemaining === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {new Intl.NumberFormat('en-TZ').format(sbRemaining)}
                          </h4>
                       </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl">
                       <h4 className="font-black text-lg mb-6 flex items-center gap-3"><Receipt className="text-indigo-400" /> Orodha ya Wateja ({currentDaySBEntries.length})</h4>
                       <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                          {currentDaySBEntries.length === 0 ? (
                            <div className="text-center py-20 opacity-30 italic font-bold">Anza kuingiza wateja hapa pembeni...</div>
                          ) : (
                            currentDaySBEntries.map(e => (
                              <div key={e.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300">
                                       {e.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <p className="font-black text-white">{e.customerName}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Entry</p>
                                    </div>
                                 </div>
                                 <p className="font-black text-indigo-400 text-lg">{new Intl.NumberFormat('en-TZ').format(e.amount)}</p>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-5 space-y-6">
                    <div className={`bg-white rounded-[2rem] border-2 transition-all duration-500 ${isSBFinalized ? 'border-slate-300 opacity-60 grayscale shadow-none' : 'border-slate-100 shadow-xl'}`}>
                       <div className="flex bg-slate-50 border-b">
                          <button onClick={() => setSbEntryMode('EXISTING')} className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${sbEntryMode === 'EXISTING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                             <Search size={14} /> Mteja Aliyepo
                          </button>
                          <button onClick={() => setSbEntryMode('NEW')} className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${sbEntryMode === 'NEW' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                             <UserPlus size={14} /> Mteja Mpya
                          </button>
                       </div>

                       <form onSubmit={handleAddSignedBillEntry} className="p-8 space-y-6">
                          {sbEntryMode === 'NEW' ? (
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sajili Jina la Mteja</label>
                                <input type="text" disabled={isSBFinalized} required value={sbNewCustomerName} onChange={(e) => setSbNewCustomerName(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold disabled:bg-slate-50 outline-none focus:border-indigo-500" placeholder="Jina kamili..." />
                             </div>
                          ) : (
                             <div className="space-y-2 relative" ref={sbDropdownRef}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tafuta Mteja</label>
                                <input type="text" disabled={isSBFinalized} value={sbSelectedCustomer ? sbSelectedCustomer.name : sbSearchTerm} onChange={(e) => {setSbSearchTerm(e.target.value); setSbSelectedCustomer(null); setIsSbCustomerDropdownOpen(true);}} onFocus={() => setIsSbCustomerDropdownOpen(true)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold disabled:bg-slate-50 outline-none focus:border-indigo-500" placeholder="Andika jina..." />
                                {isSbCustomerDropdownOpen && !sbSelectedCustomer && !isSBFinalized && (
                                   <div className="absolute z-[60] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                                      {filteredCustomers.length === 0 ? <div className="p-4 text-center text-slate-400 text-xs italic">Mteja hajapatikana...</div> : 
                                       filteredCustomers.map(c => (<button key={c.id} type="button" onClick={() => {setSbSelectedCustomer(c); setSbSearchTerm(c.name); setIsSbCustomerDropdownOpen(false);}} className="w-full px-6 py-4 text-left font-bold border-b hover:bg-indigo-50 flex justify-between items-center group">{c.name} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600" /></button>))}
                                   </div>
                                )}
                             </div>
                          )}
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kiasi cha Bill (TZS)</label>
                             <input type="number" disabled={isSBFinalized} required value={sbAmount || ''} onChange={(e) => setSbAmount(parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 font-black text-3xl text-indigo-700 disabled:bg-slate-50 outline-none focus:border-indigo-500" placeholder="0.00" />
                          </div>
                          {!isSBFinalized && (
                            <button type="submit" disabled={isSBFinalized || (sbEntryMode === 'NEW' ? !sbNewCustomerName : !sbSelectedCustomer) || sbAmount <= 0} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                               HIFADHI REKODI
                            </button>
                          )}
                       </form>
                    </div>

                    {!isSBFinalized ? (
                      <button onClick={handleFinalizeSB} className={`w-full py-8 rounded-[2rem] font-black text-2xl shadow-2xl transition-all border-4 flex flex-col items-center gap-2 ${isSbFullyMatched ? (isConfirmingSB ? 'bg-rose-600 border-rose-400 text-white animate-pulse' : 'bg-emerald-600 text-white border-emerald-400 hover:scale-105') : 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed opacity-80'}`}>
                         <div className="flex items-center gap-3">
                           {isConfirmingSB ? <ShieldCheck size={36} /> : <FileText size={36} />}
                           {isConfirmingSB ? 'HAKIKI KUFUNGA HESABU' : 'FINALIZE SIGNED BILLS'}
                         </div>
                      </button>
                    ) : (
                      <div className="bg-slate-900 rounded-[2rem] p-8 text-center border-4 border-slate-700 shadow-2xl">
                         <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50"><Lock className="text-emerald-500" size={32} /></div>
                         <h4 className="text-xl font-black text-white uppercase tracking-widest mb-2">HESABU IMEFUNGWA</h4>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* --- PAID BILLS GLOBAL VIEW --- */
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
           <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-emerald-100 overflow-hidden">
              <div className="bg-emerald-600 p-10 text-white flex items-center gap-6">
                 <div className="p-4 bg-white/20 rounded-3xl"><Banknote size={32} /></div>
                 <div>
                    <h3 className="text-3xl font-black uppercase tracking-tight">Orodha ya Paid Bills (History)</h3>
                    <p className="text-emerald-50 font-medium opacity-80">Angalia makusanyo yote ya madeni ya zamani</p>
                 </div>
              </div>

              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <History size={16} /> Malipo yote ya Leo ({selectedDate})
                    </h4>
                    <div className="space-y-3">
                       {dailyPaidBills.length === 0 ? (
                          <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 italic">Hakuna malipo yaliyorekodiwa bado...</div>
                       ) : (
                          [...dailyPaidBills].reverse().map(e => (
                             <div key={e.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${e.payerType === 'WAITER' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                         {e.payerType}
                                      </span>
                                      <p className="font-black text-slate-900">{e.payerName}</p>
                                   </div>
                                   <p className="text-[9px] text-slate-400 font-medium tracking-tight">Kupitia: {e.receivedFromWaiter} | Njia: <span className="font-bold text-slate-600">{e.method}</span></p>
                                </div>
                                <p className="font-black text-emerald-600 text-xl">{new Intl.NumberFormat('en-TZ').format(e.amount)}</p>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
