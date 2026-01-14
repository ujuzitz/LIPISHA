
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Receipt, BarChart3, Users, LogOut, Calculator, ShieldCheck, Lock, UserCircle, KeyRound, ChevronRight, FileText, Banknote, ClipboardList } from 'lucide-react';
import { ShiftRecord, ViewType, Attendant, SignedBillEntry, Customer, PaidBillEntry, CashierSubView, FinanceSubView } from './types';
import CashierDashboard from './components/CashierDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import ManagerDashboard from './components/ManagerDashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<ViewType | null>(null);
  const [cashierSubView, setCashierSubView] = useState<CashierSubView>('SHIFT');
  const [financeSubView, setFinanceSubView] = useState<FinanceSubView>('OVERVIEW');
  const [records, setRecords] = useState<ShiftRecord[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [finalizedSignedBillDates, setFinalizedSignedBillDates] = useState<string[]>([]);
  const [signedBillEntries, setSignedBillEntries] = useState<SignedBillEntry[]>([]);
  const [paidBillEntries, setPaidBillEntries] = useState<PaidBillEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const isLoaded = useRef(false);

  const ROLE_CREDENTIALS: Record<ViewType, string> = {
    MANAGER: 'manager@2025',
    CASHIER: 'cashier@2025',
    FINANCE: 'finance@2025'
  };

  useEffect(() => {
    const savedRecords = localStorage.getItem('shift_records');
    const savedAttendants = localStorage.getItem('attendants');
    const savedClosedDates = localStorage.getItem('closed_dates');
    const savedFinalizedSB = localStorage.getItem('finalized_sb_dates');
    const savedSignedBills = localStorage.getItem('signed_bill_entries');
    const savedPaidBills = localStorage.getItem('paid_bill_entries');
    const savedCustomers = localStorage.getItem('master_customers');
    const savedSession = localStorage.getItem('active_session');
    
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedAttendants) setAttendants(JSON.parse(savedAttendants));
    if (savedClosedDates) setClosedDates(JSON.parse(savedClosedDates));
    if (savedFinalizedSB) setFinalizedSignedBillDates(JSON.parse(savedFinalizedSB));
    if (savedSignedBills) setSignedBillEntries(JSON.parse(savedSignedBills));
    if (savedPaidBills) setPaidBillEntries(JSON.parse(savedPaidBills));
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setUserRole(session.role);
      setIsAuthenticated(true);
    }
    
    isLoaded.current = true;
  }, []);

  useEffect(() => { if (isLoaded.current) localStorage.setItem('shift_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('attendants', JSON.stringify(attendants)); }, [attendants]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('closed_dates', JSON.stringify(closedDates)); }, [closedDates]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('finalized_sb_dates', JSON.stringify(finalizedSignedBillDates)); }, [finalizedSignedBillDates]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('signed_bill_entries', JSON.stringify(signedBillEntries)); }, [signedBillEntries]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('paid_bill_entries', JSON.stringify(paidBillEntries)); }, [paidBillEntries]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('master_customers', JSON.stringify(customers)); }, [customers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRole) {
      setLoginError('Tafadhali chagua nafasi yako.');
      return;
    }
    if (password === ROLE_CREDENTIALS[userRole]) {
      setIsAuthenticated(true);
      setLoginError('');
      localStorage.setItem('active_session', JSON.stringify({ role: userRole, time: Date.now() }));
    } else {
      setLoginError('Neno la siri si sahihi.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setPassword('');
    localStorage.removeItem('active_session');
  };

  const addRecord = (newRecord: ShiftRecord) => {
    setRecords(prev => [...prev, newRecord]);
    // Status is now calculated dynamically in dashboards based on records
  };

  const closeDayShift = (date: string) => {
    setClosedDates(prev => prev.includes(date) ? prev : [...prev, date]);
  };

  const finalizeSignedBill = (date: string) => {
    setFinalizedSignedBillDates(prev => prev.includes(date) ? prev : [...prev, date]);
  };

  const updateSignedBillEntries = (date: string, entries: SignedBillEntry[]) => {
    setSignedBillEntries(prev => {
      const otherEntries = prev.filter(e => e.date !== date);
      return [...otherEntries, ...entries];
    });
  };

  const addPaidBill = (entry: PaidBillEntry) => {
    setPaidBillEntries(prev => [...prev, entry]);
  };

  const registerCustomer = (name: string): Customer => {
    const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const newCustomer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      createdAt: Date.now()
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -ml-48 -mb-48 animate-pulse" />

        <div className="w-full max-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-500 rounded-[2rem] shadow-2xl shadow-emerald-500/30 mb-6">
              <Calculator size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">SmartCash <span className="text-emerald-500">Pro</span></h1>
            <p className="text-slate-400 font-medium mt-2">Mifumo ya kisasa ya usimamizi wa mauzo</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chagua Idara yako</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { role: 'CASHIER' as ViewType, label: 'Cashier', icon: Receipt },
                    { role: 'MANAGER' as ViewType, label: 'Manager', icon: ShieldCheck },
                    { role: 'FINANCE' as ViewType, label: 'Finance', icon: BarChart3 },
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => {setUserRole(item.role); setLoginError('');}}
                      className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group ${
                        userRole === item.role 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                          : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <item.icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                  <KeyRound size={12} /> Neno la Siri
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono tracking-widest"
                />
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-xs font-bold animate-in shake duration-300">
                  <Lock size={16} />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/40 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                INGIA KWENYE MFUMO <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-8 flex-1">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-xl shadow-emerald-500/30">
              <Calculator size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">SmartCash</h1>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Enterprise</span>
            </div>
          </div>
          
          <nav className="space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 pl-4">Main Navigation</div>
            <div className="space-y-2">
              {userRole === 'CASHIER' && (
                <>
                  <button
                    onClick={() => setCashierSubView('SHIFT')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      cashierSubView === 'SHIFT' 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <Receipt size={20} />
                    <span className="font-bold tracking-tight">Shift Entry</span>
                  </button>
                  <button
                    onClick={() => setCashierSubView('SIGNED_BILL')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      cashierSubView === 'SIGNED_BILL' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <FileText size={20} />
                    <span className="font-bold tracking-tight">Signed Bill</span>
                  </button>
                  <button
                    onClick={() => setCashierSubView('PAID_BILL')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      cashierSubView === 'PAID_BILL' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <Banknote size={20} />
                    <span className="font-bold tracking-tight">Paid Bills</span>
                  </button>
                </>
              )}
              {userRole === 'FINANCE' && (
                <>
                  <button
                    onClick={() => setFinanceSubView('OVERVIEW')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      financeSubView === 'OVERVIEW' 
                        ? 'bg-emerald-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <BarChart3 size={20} />
                    <span className="font-bold tracking-tight">Financials</span>
                  </button>
                  <button
                    onClick={() => setFinanceSubView('SALES_REPORTS')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      financeSubView === 'SALES_REPORTS' 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <ClipboardList size={20} />
                    <span className="font-bold tracking-tight">Sales Reports</span>
                  </button>
                </>
              )}
              {userRole === 'MANAGER' && (
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all bg-emerald-600 text-white shadow-lg"
                >
                  <ShieldCheck size={20} />
                  <span className="font-bold tracking-tight">Management</span>
                </button>
              )}
            </div>
          </nav>
        </div>
        
        <div className="p-8">
          <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[9px] text-slate-500 mb-2 uppercase font-black tracking-widest">Active Session</p>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-500 shadow-inner">
                  <UserCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tighter">{userRole}</p>
                  <p className="text-[10px] text-slate-500 font-bold">Authorized User</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-xs font-black transition-all border border-rose-500/20"
              >
                <LogOut size={14} />
                LOGOUT SYSTEM
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="animate-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dashboard System</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                {userRole === 'MANAGER' ? 'Manager Control' : 
                 userRole === 'CASHIER' ? (cashierSubView === 'SHIFT' ? 'Cashier Operations' : cashierSubView === 'SIGNED_BILL' ? 'Signed Bill Reconciliation' : 'Paid Bills (Debt Recovery)') : 
                 (financeSubView === 'OVERVIEW' ? 'Revenue Insights' : 'Detailed Sales Reports')}
              </h2>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {userRole === 'MANAGER' && (
              <ManagerDashboard 
                records={records} 
                attendants={attendants}
                closedDates={closedDates}
                onAddAttendant={(a) => setAttendants([...attendants, a])}
                onDeleteAttendant={(id) => setAttendants(attendants.filter(a => a.id !== id))}
              />
            )}
            {userRole === 'CASHIER' && (
              <CashierDashboard 
                records={records} 
                onAddRecord={addRecord}
                onCloseDayShift={closeDayShift}
                onFinalizeSignedBill={finalizeSignedBill}
                registeredAttendants={attendants}
                closedDates={closedDates}
                finalizedSignedBillDates={finalizedSignedBillDates}
                signedBillEntries={signedBillEntries}
                onUpdateSignedBills={updateSignedBillEntries}
                paidBillEntries={paidBillEntries}
                onAddPaidBill={addPaidBill}
                activeView={cashierSubView}
                onViewChange={setCashierSubView}
                masterCustomers={customers}
                onRegisterCustomer={registerCustomer}
              />
            )}
            {userRole === 'FINANCE' && (
              <FinanceDashboard 
                records={records} 
                signedBillEntries={signedBillEntries}
                paidBillEntries={paidBillEntries}
                activeView={financeSubView}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
