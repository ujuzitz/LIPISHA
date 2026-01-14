
import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Download, Filter, FileText, Landmark, Smartphone, CreditCard, Banknote, Calendar as CalendarIcon, AlertTriangle, UserCheck, History, Receipt, ClipboardList, TrendingUp, Search, ChevronRight, User, ArrowRight } from 'lucide-react';
import { ShiftRecord, SignedBillEntry, PaidBillEntry, FinanceSubView, PaymentBreakdown } from '../types';

interface FinanceDashboardProps {
  records: ShiftRecord[];
  signedBillEntries: SignedBillEntry[];
  paidBillEntries: PaidBillEntry[];
  activeView: FinanceSubView;
}

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899', '#f43f5e', '#64748b'];

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ records, signedBillEntries, paidBillEntries, activeView }) => {
  // Date range states
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  // Global Totals (for Overview)
  const totals = useMemo(() => {
    return records.reduce((acc, record) => ({
      sales: acc.sales + record.totalSales,
      cash: acc.cash + record.calculatedCash,
      crdb: acc.crdb + record.breakdown.crdb,
      stanbic: acc.stanbic + record.breakdown.stanbic,
      mpesa: acc.mpesa + record.breakdown.mpesa,
      bills: acc.bills + record.breakdown.signedBill,
      discounts: acc.discounts + record.breakdown.discount,
      cancellations: acc.cancellations + record.breakdown.cancellation,
      overpayments: acc.overpayments + (record.overpaymentAmount || 0),
    }), { sales: 0, cash: 0, crdb: 0, stanbic: 0, mpesa: 0, bills: 0, discounts: 0, cancellations: 0, overpayments: 0 });
  }, [records]);

  // Filtered Records by Range
  const rangeRecords = useMemo(() => {
    return records.filter(r => r.date >= fromDate && r.date <= toDate)
      .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);
  }, [records, fromDate, toDate]);

  // Consolidated Totals for the selected range
  const rangeTotals = useMemo(() => {
    return rangeRecords.reduce((acc, record) => {
      acc.sales += record.totalSales;
      acc.cash += record.calculatedCash;
      acc.crdb += record.breakdown.crdb;
      acc.stanbic += record.breakdown.stanbic;
      acc.mpesa += record.breakdown.mpesa;
      acc.signedBill += record.breakdown.signedBill;
      acc.discount += record.breakdown.discount;
      acc.cancellation += record.breakdown.cancellation;
      acc.overpayments += (record.overpaymentAmount || 0);
      return acc;
    }, { sales: 0, cash: 0, crdb: 0, stanbic: 0, mpesa: 0, signedBill: 0, discount: 0, cancellation: 0, overpayments: 0 });
  }, [rangeRecords]);

  const recoveredDebtsTotal = useMemo(() => {
    return paidBillEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [paidBillEntries]);

  const pieData = [
    { name: 'Physical Cash', value: totals.cash },
    { name: 'CRDB Bank', value: totals.crdb },
    { name: 'Stanbic Bank', value: totals.stanbic },
    { name: 'M-Pesa', value: totals.mpesa },
    { name: 'Signed Bills (Credit)', value: totals.bills },
  ].filter(item => item.value > 0);

  if (activeView === 'SALES_REPORTS') {
    return (
      <div className="space-y-10 pb-20 animate-in slide-in-from-bottom-4 duration-500">
        {/* Date Range Selection Header */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl"><CalendarIcon size={32} /></div>
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Ripoti ya Kipindi</h3>
                 <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Chagua tarehe ya kuanzia na ya mwisho</p>
              </div>
           </div>
           
           <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full space-y-1">
                 <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Kuanzia Tarehe</label>
                 <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-lg font-bold outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all text-white"
                 />
              </div>
              <div className="bg-white/10 p-3 rounded-full mt-5 hidden md:block">
                 <ArrowRight size={20} className="text-white/50" />
              </div>
              <div className="flex-1 w-full space-y-1">
                 <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Hadi Tarehe</label>
                 <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-lg font-bold outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all text-white"
                 />
              </div>
           </div>
        </div>

        {rangeRecords.length === 0 ? (
           <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                 <Search size={40} />
              </div>
              <p className="text-slate-400 font-bold text-lg italic tracking-tight">
                 Hakuna ripoti ya mauzo iliyopatikana kati ya tarehe {fromDate} na {toDate}.
              </p>
           </div>
        ) : (
          <>
            {/* Aggregate Stats for Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-emerald-500 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">JUMLA MAUZO (KIPINDI)</p>
                  <h4 className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(rangeTotals.sales)}</h4>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-emerald-500 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">JUMLA CASH (KIPINDI)</p>
                  <h4 className="text-2xl font-black text-emerald-600">{new Intl.NumberFormat('en-TZ').format(rangeTotals.cash)}</h4>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-emerald-500 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">JUMLA DIGITAL (KIPINDI)</p>
                  <h4 className="text-2xl font-black text-blue-600">{new Intl.NumberFormat('en-TZ').format(rangeTotals.crdb + rangeTotals.stanbic + rangeTotals.mpesa)}</h4>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-emerald-500 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">JUMLA CREDIT (KIPINDI)</p>
                  <h4 className="text-2xl font-black text-amber-600">{new Intl.NumberFormat('en-TZ').format(rangeTotals.signedBill)}</h4>
               </div>
            </div>

            {/* Consolidated Breakdown (Like the one closed by cashier) */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ClipboardList size={20} /></div>
                     <h3 className="font-black text-slate-800 uppercase tracking-tight">Mchanganuo wa Pamoja wa Kipindi</h3>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1 rounded-full">
                     {fromDate} — {toDate}
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {[
                    { label: 'CASH', val: rangeTotals.cash, color: 'emerald' },
                    { label: 'M-PESA', val: rangeTotals.mpesa, color: 'blue' },
                    { label: 'CRDB', val: rangeTotals.crdb, color: 'indigo' },
                    { label: 'STANBIC', val: rangeTotals.stanbic, color: 'indigo' },
                    { label: 'CREDIT', val: rangeTotals.signedBill, color: 'amber' },
                    { label: 'DISC', val: rangeTotals.discount, color: 'slate' },
                    { label: 'CANCEL', val: rangeTotals.cancellation, color: 'rose' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                       <p className={`text-xs font-black text-${item.color}-600`}>{new Intl.NumberFormat('en-TZ').format(item.val)}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Individual Waiter Logs for the range */}
            <div className="space-y-6">
               <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20} /></div>
                     <h3 className="font-black text-slate-800 uppercase tracking-tight">Orodha ya Miamala (Individual Logs)</h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rangeRecords.length} Shifts Found</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rangeRecords.map(record => (
                    <div key={record.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group animate-in fade-in zoom-in-95 duration-300">
                       <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-black text-emerald-400 border border-white/20">
                                {record.waiterName.charAt(0)}
                             </div>
                             <div>
                                <h4 className="font-black text-lg tracking-tight">{record.waiterName}</h4>
                                <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">{record.date}</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500 rounded text-white uppercase">CLOSED</span>
                       </div>
                       
                       <div className="p-6 flex-1 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sales (Target)</p>
                             <p className="text-sm font-black text-slate-900">{new Intl.NumberFormat('en-TZ').format(record.totalSales)}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cash Taslimu</p>
                                <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{new Intl.NumberFormat('en-TZ').format(record.calculatedCash)}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Signed Bill</p>
                                <p className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{new Intl.NumberFormat('en-TZ').format(record.breakdown.signedBill)}</p>
                             </div>
                          </div>
                          <div className="pt-2">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Mgawanyo wa Digital</p>
                             <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                   <span className="text-slate-500 font-bold uppercase flex items-center gap-1"><Smartphone size={10} /> M-PESA</span>
                                   <span className="font-black text-slate-700">{new Intl.NumberFormat('en-TZ').format(record.breakdown.mpesa)}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                   <span className="text-slate-500 font-bold uppercase flex items-center gap-1"><Landmark size={10} /> CRDB / STANBIC</span>
                                   <span className="font-black text-slate-700">{new Intl.NumberFormat('en-TZ').format(record.breakdown.crdb + record.breakdown.stanbic)}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       {record.overpaymentAmount > 0 && (
                          <div className="bg-rose-50 p-4 border-t border-rose-100 flex justify-between items-center">
                             <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12} /> Overpayment</p>
                             <p className="text-xs font-black text-rose-600">+{new Intl.NumberFormat('en-TZ').format(record.overpaymentAmount)}</p>
                          </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Top Stats Cards (Global Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Sales Revenue', value: totals.sales, icon: FileText, color: 'emerald' },
          { label: 'Total Cash in Drawer', value: totals.cash, icon: Banknote, color: 'blue' },
          { label: 'Total Credit (Signed Bills)', value: totals.bills, icon: Receipt, color: 'amber' },
          { label: 'Debt Recovery (Paid Bills)', value: recoveredDebtsTotal, icon: UserCheck, color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-4`}>
              <stat.icon className={`text-${stat.color}-600`} size={24} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {new Intl.NumberFormat('en-TZ').format(stat.value)}
            </h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Revenue Source Breakdown (Global)</h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <Download size={18} />
            </button>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('en-TZ').format(value) + ' TZS'}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
               <Receipt className="text-amber-500" /> Recent Signed Bills
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-4">Mteja</th>
                  <th className="px-8 py-4 text-right">Kiasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {signedBillEntries.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-8 py-12 text-center text-slate-400 italic font-medium">No credit records.</td>
                  </tr>
                ) : (
                  [...signedBillEntries].reverse().slice(0, 5).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 font-black text-slate-900 text-sm">{entry.customerName}</td>
                      <td className="px-8 py-4 text-right font-black text-rose-600 text-sm">
                         {new Intl.NumberFormat('en-TZ').format(entry.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
               <UserCheck className="text-indigo-500" /> Recent Paid Bills
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-4">Mlipaji</th>
                  <th className="px-8 py-4 text-right">Kiasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidBillEntries.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-8 py-12 text-center text-slate-400 italic font-medium">No recovery records.</td>
                  </tr>
                ) : (
                  [...paidBillEntries].reverse().slice(0, 5).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 font-black text-slate-900 text-sm">{entry.payerName}</td>
                      <td className="px-8 py-4 text-right font-black text-emerald-600 text-sm">
                         {new Intl.NumberFormat('en-TZ').format(entry.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
