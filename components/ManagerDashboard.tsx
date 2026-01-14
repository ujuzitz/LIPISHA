
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Search,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { Attendant, ShiftRecord } from '../types';

interface ManagerDashboardProps {
  records: ShiftRecord[];
  attendants: Attendant[];
  closedDates: string[];
  onAddAttendant: (attendant: Attendant) => void;
  onDeleteAttendant: (id: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  records, 
  attendants, 
  closedDates,
  onAddAttendant, 
  onDeleteAttendant 
}) => {
  const [newName, setNewName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Check if attendant already exists in the master list
    const exists = attendants.some(a => a.name.toLowerCase() === newName.toLowerCase());
    if (exists) {
      alert("Muhudumu huyu tayari ameshasajiliwa kwenye mfumo.");
      return;
    }

    const attendant: Attendant = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      createdAt: Date.now(),
      status: 'PENDING'
    };

    onAddAttendant(attendant);
    setNewName('');
  };

  const filteredAttendants = attendants
    .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const getAttendantSales = (name: string, date: string) => {
    const record = records.find(r => r.waiterName === name && r.date === date);
    return record ? record.totalSales : 0;
  };

  const dayIsClosed = closedDates.includes(selectedDate);

  // Daily Stats for the selected date
  const reconciledToday = attendants.filter(a => records.some(r => r.waiterName === a.name && r.date === selectedDate)).length;
  const pendingToday = attendants.length - reconciledToday;

  return (
    <div className="space-y-8">
      {/* Top Controls & Registration (Permanent Staff) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sajili Muhudumu Mpya</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sajili mara moja tu ili aonekane kwa Cashier kila siku</p>
            </div>
          </div>
          
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jina la Muhudumu (Staff Name)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Mfano: John Doe"
                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="md:self-end">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <Plus size={20} /> SAJILI KWA MFUMO
              </button>
            </div>
          </form>
        </div>

        {/* Date Context Selection */}
        <div className={`p-6 rounded-3xl shadow-xl text-white flex flex-col justify-center transition-all duration-500 ${dayIsClosed ? 'bg-slate-900 scale-105' : 'bg-indigo-600'}`}>
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Status kwa Tarehe:</p>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-xl font-black focus:outline-none cursor-pointer p-0 m-0"
                />
             </div>
             {dayIsClosed && <ShieldCheck className="text-emerald-400" size={24} />}
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-4xl font-black">{attendants.length}</h4>
            <span className="text-white/40 text-xs font-bold uppercase">Wahudumu Wote</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black uppercase tracking-tighter">
              <CheckCircle2 size={12} /> {reconciledToday} Reconciled
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase tracking-tighter">
              <Clock size={12} /> {pendingToday} Pending
            </div>
          </div>
        </div>
      </div>

      {/* Staff Status List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="text-slate-400" size={24} />
            <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">Hali ya Wahudumu (Daily Status)</h3>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Tafuta jina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-slate-50/50">
          {filteredAttendants.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-slate-200">
                <Users size={32} />
              </div>
              <p className="text-slate-400 font-medium italic">Hakuna wahudumu waliosajiliwa kwenye mfumo.</p>
            </div>
          ) : (
            filteredAttendants.map(attendant => {
              const sales = getAttendantSales(attendant.name, selectedDate);
              const recordExists = records.some(r => r.waiterName === attendant.name && r.date === selectedDate);
              
              // Dynamic Status Logic
              let statusLabel = recordExists ? 'CLOSED' : 'PENDING';
              let statusColor = recordExists ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
              
              if (dayIsClosed) {
                if (recordExists) {
                  statusLabel = 'CLOSED';
                  statusColor = 'bg-emerald-100 text-emerald-700';
                } else {
                  statusLabel = 'HAJAUZA';
                  statusColor = 'bg-rose-100 text-rose-700';
                }
              }

              return (
                <div 
                  key={attendant.id} 
                  className={`bg-white p-5 rounded-2xl border-2 transition-all duration-300 ${
                    recordExists ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 hover:border-indigo-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        recordExists ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {attendant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-none mb-1">{attendant.name}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Je, una uhakika unataka kumfuta ${attendant.name} kwenye mfumo?`)) {
                          onDeleteAttendant(attendant.id);
                        }
                      }}
                      className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                      title="Delete Staff"
                    >
                      <UserMinus size={18} />
                    </button>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Mauzo ya Tarehe {selectedDate.split('-')[2]}</span>
                      <span className={`${recordExists ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {new Intl.NumberFormat('en-TZ').format(sales)} TZS
                      </span>
                    </div>

                    {dayIsClosed ? (
                      <div className={`flex items-center gap-1.5 text-[10px] font-black p-2 rounded-lg ${recordExists ? 'text-emerald-600 bg-emerald-100/50' : 'text-rose-600 bg-rose-100/50'}`}>
                        {recordExists ? (
                          <><TrendingUp size={12} /> Shift tayari imeshafungwa na Cashier</>
                        ) : (
                          <><ShieldAlert size={12} /> Hajauza (Siku imeshafungwa)</>
                        )}
                      </div>
                    ) : recordExists && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black bg-emerald-100/50 p-2 rounded-lg">
                        <CheckCircle2 size={12} /> Amehakikiwa na Cashier leo
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
