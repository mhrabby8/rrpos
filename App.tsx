
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, X, Search, Bell, User, ChevronRight, LogOut, 
  Trash2, Plus, Minus, CreditCard, Printer, CheckCircle, 
  ChevronLeft, Smartphone, Laptop, Settings as SettingsIcon, 
  Clock, Filter, Edit, Eye, Download, Users, Package, 
  TrendingUp, TrendingDown, DollarSign, Calendar, MapPin, 
  Tag, Info, PlusCircle, AlertTriangle, Layers, Truck, FileText,
  ShoppingCart, Wallet, LayoutDashboard, BookOpen, Trash, UserPlus, Shield, ArrowLeft,
  List, Coffee, Home, MoreVertical, Upload, Camera, Check, Building2, Key, EyeOff,
  Flame, History, SlidersHorizontal, Receipt, BadgeCent, Warehouse, Percent, Banknote,
  UserCircle, BarChart3, PieChart as PieChartIcon, ImageIcon, Lock, ExternalLink, HandCoins, Star, ShieldCheck, ShieldAlert, Sparkles, BrainCircuit, Loader2, Database, Save, UploadCloud, RefreshCcw, Ticket
} from 'lucide-react';
import { 
  NAV_ITEMS, 
  DEFAULT_SETTINGS, 
  MOCK_MENU_ITEMS, 
  MOCK_BRANCHES, 
  INITIAL_CATEGORIES,
  MOCK_SUPPLIERS,
  MOCK_ADDONS
} from './constants';
import { 
  Role, 
  BranchType, 
  OrderStatus, 
  PaymentMethod, 
  MenuItem, 
  Order, 
  OrderItem, 
  AddOn,
  Variant,
  AccountingEntry,
  RawMaterial,
  Supplier,
  WastageEntry,
  User as UserType,
  Category,
  Branch,
  BranchPriceOverride,
  WithdrawalRequest,
  Notification,
  PromoCode
} from './types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { AdvancedReportingView } from './AdvancedReporting';

// --- Utility: Filter Logic ---
const filterOrdersByCriteria = (orders: Order[], branchId: string, frequency: string, startDate: string, endDate: string) => {
  return orders.filter((order) => {
    if (branchId !== 'ALL' && order.branchId !== branchId) return false;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    if (frequency === 'DAILY') {
      if (orderDate.toDateString() !== now.toDateString()) return false;
    } else if (frequency === 'WEEKLY') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      if (orderDate < lastWeek) return false;
    } else if (frequency === 'MONTHLY') {
      if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
    } else if (frequency === 'YEARLY') {
      if (orderDate.getFullYear() !== now.getFullYear()) return false;
    } else if (frequency === 'CUSTOM') {
      if (startDate && orderDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }
    }
    return true;
  });
};

// --- Utility: Image Resizer ---
const resizeImage = (file: File, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

// --- Persistent State Helpers ---
const usePersistentState = (key: string, initialValue: any) => {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null || saved === 'undefined') return initialValue;
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Error parsing persistent state for ${key}:`, e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (state === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (e) {
      console.error(`Error saving persistent state for ${key}:`, e);
    }
  }, [key, state]);

  return [state, setState];
};

// --- AI: Dashboard Insights Module ---
const AIDashboardInsights = ({ stats, settings, branches }: any) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As an Enterprise Restaurant Consultant, analyze this POS data and provide 3 brief, high-impact bullet points for business improvement:
        - Total Revenue: ${settings.currencySymbol}${stats.totalSales}
        - Total Orders: ${stats.totalOrders}
        - Branches: ${branches.map((b: any) => b.name).join(', ')}
        - Period Activity: ${stats.totalOrders} transactions.
        Provide professional, actionable advice on pricing, labor, or inventory. Keep it under 100 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a world-class hospitality data analyst. Format output as clean HTML bullet points. Use standard business English."
        }
      });

      setInsight(response.text || "Insight generation failed. Please check connection.");
    } catch (err) {
      console.error(err);
      setInsight("Unable to reach AI Analyst. Ensure API_KEY is configured in your environment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <BrainCircuit size={120} />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Sparkles size={24} className="text-blue-300" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">AI Intelligence Core</h4>
            <p className="text-lg font-black tracking-tight">Enterprise Strategy Analyst</p>
          </div>
        </div>

        {insight ? (
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 animate-in fade-in zoom-in">
            <div 
              className="text-sm font-medium leading-relaxed prose prose-invert max-w-none" 
              dangerouslySetInnerHTML={{ __html: insight }} 
            />
            <button 
              onClick={() => setInsight(null)} 
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:text-white transition-colors"
            >
              ← Refresh Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-blue-100 font-medium max-w-md">
              Let our enterprise AI analyze your current transaction patterns, branch performance, and margins to provide surgical business advice.
            </p>
            <button 
              onClick={generateInsight}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-4 bg-white text-blue-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Analyzing Dynamics...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Strategic Insight
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Authentication: Login View ---
const LoginView = ({ onLogin, staff }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const user = staff.find((u: any) => u.username === cleanUsername && u.password === cleanPassword);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-gray-100">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-200 mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">RR Restro POS</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Employee Terminal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black rounded-2xl animate-pulse">{error}</div>}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Username</label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50 border-none rounded-[1.5rem] font-bold text-sm focus:ring-4 focus:ring-blue-50 outline-none" 
              placeholder="e.g. admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Access Secret</label>
            <input 
              type="password" 
              className="w-full p-4 bg-gray-50 border-none rounded-[1.5rem] font-bold text-sm focus:ring-4 focus:ring-blue-50 outline-none" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-blue-200 text-sm uppercase tracking-widest transition-all active:scale-95 hover:bg-blue-700">
            Open Terminal
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Shared Component: GlobalFilterBar ---
const GlobalFilterBar = ({ 
  branches, 
  filterBranchId, 
  setFilterBranchId, 
  filterFrequency, 
  setFilterFrequency, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate 
}: any) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap items-end gap-4">
      <div className="space-y-1.5 flex-1 min-w-[150px]">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch filter</label>
        <select 
          value={filterBranchId} 
          onChange={e => setFilterBranchId(e.target.value)}
          className="w-full bg-gray-50 text-gray-700 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">All Nodes</option>
          {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 flex-1 min-w-[150px]">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Frequency</label>
        <select 
          value={filterFrequency} 
          onChange={e => setFilterFrequency(e.target.value)}
          className="w-full bg-gray-50 text-gray-700 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL_TIME">All Time</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
          <option value="CUSTOM">Custom Range</option>
        </select>
      </div>
      {filterFrequency === 'CUSTOM' && (
        <>
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">From</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-gray-50 text-gray-700 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">To</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-gray-50 text-gray-700 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </>
      )}
    </div>
  );
};

// --- Module: Dashboard View ---
const DashboardView = ({ orders, settings, branches, currentUser }: any) => {
  const [filterBranchId, setFilterBranchId] = useState('ALL');
  const [filterFrequency, setFilterFrequency] = useState('DAILY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const stats = useMemo(() => {
    const filtered = filterOrdersByCriteria(orders, filterBranchId, filterFrequency, startDate, endDate);
    const totalSales = filtered
      .filter((o: any) => o.status !== OrderStatus.CANCELLED)
      .reduce((acc: number, o: any) => acc + o.total, 0);
    const totalOrders = filtered.length;
    const uniqueCustomers = new Set(filtered.map((o: any) => o.customerPhone).filter(Boolean)).size;
    
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    const chartData = last7Days.map(date => {
      const dayOrders = filtered
        .filter((o: any) => o.status !== OrderStatus.CANCELLED && new Date(o.createdAt).toLocaleDateString() === date);
      return {
        date,
        sales: dayOrders.reduce((acc: number, o: any) => acc + o.total, 0)
      };
    });

    return { totalSales, totalOrders, uniqueCustomers, chartData, filtered };
  }, [orders, filterBranchId, filterFrequency, startDate, endDate]);

  return (
    <div className="p-4 lg:p-8 space-y-8 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <GlobalFilterBar 
        branches={branches}
        filterBranchId={filterBranchId}
        setFilterBranchId={setFilterBranchId}
        filterFrequency={filterFrequency}
        setFilterFrequency={setFilterFrequency}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><DollarSign size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-xl font-black text-gray-900">{settings.currencySymbol}{stats.totalSales.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><ShoppingCart size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orders Handled</p>
            <p className="text-xl font-black text-gray-900">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner"><Users size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loyal Patrons</p>
            <p className="text-xl font-black text-gray-900">{stats.uniqueCustomers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period Activity</p>
            <p className="text-xl font-black text-gray-900">{stats.totalOrders}</p>
          </div>
        </div>
      </div>

      <AIDashboardInsights stats={stats} settings={settings} branches={branches} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Financial Pulse (7 Days Overview)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Logs for Period</h4>
          <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
            {stats.filtered.slice(0, 15).map((order: any) => (
              <div key={order.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${order.status === OrderStatus.CANCELLED ? 'bg-rose-50 text-rose-300' : 'bg-gray-50 text-blue-600'}`}>
                  {order.customerName?.charAt(0) || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-black truncate uppercase tracking-tight ${order.status === OrderStatus.CANCELLED ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{order.customerName || 'Walk-in Patron'}</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">{new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className={`text-[10px] font-black ${order.status === OrderStatus.CANCELLED ? 'text-rose-400 line-through' : 'text-gray-900'}`}>
                  {settings.currencySymbol}{order.total.toFixed(0)}
                </div>
              </div>
            ))}
            {stats.filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-10">
                <Clock size={32}/>
                <p className="text-[8px] font-black uppercase mt-2 tracking-widest">No entries found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Module: Wallet View (For Staff) ---
const WalletView = ({ currentUser, withdrawalRequests, setWithdrawalRequests, settings, addNotification }: any) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const userRequests = useMemo(() => {
    return withdrawalRequests.filter((r: WithdrawalRequest) => r.userId === currentUser.id)
      .sort((a: WithdrawalRequest, b: WithdrawalRequest) => b.createdAt - a.createdAt);
  }, [withdrawalRequests, currentUser.id]);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(formData.get('amount') as string);
    const reason = formData.get('reason') as string;

    const newRequest: WithdrawalRequest = {
      id: `REQ-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      reason,
      status: 'PENDING',
      createdAt: Date.now()
    };

    setWithdrawalRequests([newRequest, ...withdrawalRequests]);
    addNotification('Financial Request', `${currentUser.name} submitted an advance request for ${settings.currencySymbol}${amount}.`, 'INFO');
    setIsRequestModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Personal Treasury</h3>
        <button 
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={16}/> Request Advance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><Wallet size={32}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Balance</p>
            <p className="text-4xl font-black text-gray-900">{settings.currencySymbol}{(currentUser.walletBalance || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-[2rem] bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner"><Banknote size={32}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Advance Limit</p>
            <p className="text-4xl font-black text-gray-900">{settings.currencySymbol}{(currentUser.advanceLimit || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><CheckCircle size={32}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Approved Payouts</p>
            <p className="text-4xl font-black text-gray-900">{settings.currencySymbol}{userRequests.filter(r => r.status === 'APPROVED').reduce((acc, cur) => acc + cur.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Request Manifest</h4>
        <div className="space-y-4">
          {userRequests.map((req: WithdrawalRequest) => (
            <div key={req.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[1.8rem] border border-gray-100">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {req.status === 'PENDING' ? <Clock size={18}/> : req.status === 'APPROVED' ? <Check size={18}/> : <X size={18}/>}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{settings.currencySymbol}{req.amount.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{req.reason}</p>
                  </div>
               </div>
               <div className="text-right">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                 <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{req.status}</span>
               </div>
            </div>
          ))}
          {userRequests.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center opacity-20 gap-3">
              <History size={48}/>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No past transactions</p>
            </div>
          )}
        </div>
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />
          <form onSubmit={handleRequest} className="bg-white rounded-[2.5rem] w-full max-md relative z-10 p-8 md:p-10 space-y-6 shadow-2xl border border-gray-100 animate-in zoom-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black uppercase tracking-widest text-gray-900">Advance Request</h3>
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Requested Magnitude</label>
                   <input name="amount" type="number" placeholder="Enter amount..." className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-none font-black text-lg outline-none focus:ring-4 focus:ring-blue-50" max={currentUser.advanceLimit} required />
                   <p className="text-[9px] font-bold text-gray-400 ml-4 mt-1">Maximum available: {settings.currencySymbol}{currentUser.advanceLimit}</p>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Justification</label>
                   <textarea name="reason" placeholder="Brief explanation..." className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-none font-bold text-sm h-24 outline-none focus:ring-4 focus:ring-blue-50" required />
                </div>
             </div>
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all active:scale-95">Send for Approval</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Module: POS Terminal ---
const POSView = ({ branch, settings, addOrder, categories, menuItems, allAddons, orders, customerPointsMap, addNotification }: any) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [addonSelectionModal, setAddonSelectionModal] = useState<{item: MenuItem, onSelect: (selected: AddOn[]) => void} | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState(settings.defaultDiscount || 0);
  const [vatPercent, setVatPercent] = useState(settings.vatPercentage || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);

  const customersMap = useMemo(() => {
    const map: Record<string, string> = {};
    orders.forEach((o: any) => {
      if (o.customerPhone) map[o.customerPhone] = o.customerName || 'Previous Patron';
    });
    return map;
  }, [orders]);

  useEffect(() => {
    if (customerInfo.phone && customersMap[customerInfo.phone]) {
      setCustomerInfo(prev => ({ ...prev, name: customersMap[customerInfo.phone] }));
    } else if (customerInfo.phone && !customersMap[customerInfo.phone]) {
      setCustomerInfo(prev => ({ ...prev, name: prev.name }));
    }
  }, [customerInfo.phone, customersMap]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item: MenuItem) => 
      item.allowedBranchIds.includes(branch.id) &&
      (selectedCategory === 'All' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, selectedCategory, searchQuery, branch.id]);

  const getItemPrice = (item: MenuItem) => {
    const override = item.branchPrices?.find(bp => bp.branchId === branch.id);
    return override ? override.price : item.price;
  };

  const subtotal = cart.reduce((acc, item) => {
    const itemTotal = item.unitPrice + item.addOns.reduce((a, b) => a + b.price, 0);
    return acc + (itemTotal * item.quantity);
  }, 0);
  const vatAmount = (subtotal * vatPercent) / 100;
  const manualDiscount = discountType === 'PERCENT' ? (subtotal * discountValue) / 100 : discountValue;
  
  const promoDiscount = appliedPromo 
    ? (appliedPromo.type === 'PERCENT' ? (subtotal * appliedPromo.value) / 100 : appliedPromo.value)
    : 0;

  const availablePoints = customerInfo.phone ? (customerPointsMap[customerInfo.phone] || 0) : 0;
  const loyaltyDiscount = redeemPoints ? Math.min(availablePoints, subtotal + vatAmount - manualDiscount - promoDiscount) : 0;

  const total = Math.max(0, subtotal + vatAmount - manualDiscount - promoDiscount - loyaltyDiscount);

  const applyPromoCode = () => {
    const found = (settings.promoCodes || []).find((p: PromoCode) => p.code.toUpperCase() === promoCode.toUpperCase());
    if (found) {
      if (subtotal >= (found.minOrderAmount || 0)) {
        setAppliedPromo(found);
        addNotification?.('Promo Applied', `Code ${found.code} successfully added.`, 'SUCCESS');
      } else {
        alert(`Minimum order for this code is ${settings.currencySymbol}${found.minOrderAmount}`);
      }
    } else {
      alert("Invalid Promo Code");
    }
  };

  const onMenuItemClick = (item: MenuItem) => {
    const availableAddonsForThisItem = allAddons.filter((a: AddOn) => item.addOns?.includes(a.id));
    if (availableAddonsForThisItem.length > 0) {
      setAddonSelectionModal({
        item,
        onSelect: (selectedAddons) => {
          addToCart(item, selectedAddons);
          setAddonSelectionModal(null);
        }
      });
    } else {
      addToCart(item, []);
    }
  };

  const addToCart = (item: MenuItem, selectedAddons: AddOn[]) => {
    const effectivePrice = getItemPrice(item);
    const existing = cart.find(c => 
      c.menuItemId === item.id && 
      JSON.stringify(c.addOns.map(a => a.id).sort()) === JSON.stringify(selectedAddons.map(a => a.id).sort())
    );
    
    if (existing) {
      setCart(cart.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { 
        id: `${item.id}-${Date.now()}`, 
        menuItemId: item.id, 
        name: item.name, 
        quantity: 1, 
        unitPrice: effectivePrice, 
        addOns: selectedAddons 
      }]);
    }
  };

  const handleCheckout = () => {
    addOrder({
      id: `ORD-${Date.now()}`,
      branchId: branch.id,
      items: cart,
      subtotal,
      vat: vatAmount,
      discount: manualDiscount,
      total,
      status: OrderStatus.PENDING,
      paymentMethod,
      createdAt: Date.now(),
      userId: 'admin-1',
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      promoCodeUsed: appliedPromo?.code,
      promoDiscount,
      loyaltyPointsRedeemed: loyaltyDiscount
    });
    setCart([]);
    setIsCheckoutModalOpen(false);
    setCustomerInfo({ name: '', phone: '' });
    setDiscountValue(settings.defaultDiscount || 0);
    setVatPercent(settings.vatPercentage || 0);
    setPaymentMethod(PaymentMethod.CASH);
    setAppliedPromo(null);
    setPromoCode('');
    setRedeemPoints(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 relative">
      <div className="flex-1 flex flex-col min-w-0 bg-white lg:border-r h-full overflow-hidden">
        <div className="p-3 md:p-4 flex flex-col gap-2 md:gap-4 border-b bg-white shrink-0 z-10">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <Search size={16} className="text-gray-400"/>
            <input type="text" placeholder="Search catalog..." className="bg-transparent outline-none w-full text-xs font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setSelectedCategory('All')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black border transition-all whitespace-nowrap active:scale-95 ${selectedCategory === 'All' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>All Items</button>
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black border transition-all whitespace-nowrap active:scale-95 ${selectedCategory === cat.name ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 no-scrollbar pb-40 md:pb-10">
          {filteredItems.map((item: MenuItem) => (
            <button key={item.id} onClick={() => onMenuItemClick(item)} className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col text-left active:scale-[0.98] group">
              <div className="aspect-video sm:aspect-square bg-gray-100 relative overflow-hidden">
                <img src={item.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded-lg font-black text-[9px] text-blue-600 shadow-lg border border-gray-100">
                  {settings.currencySymbol}{getItemPrice(item)}
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-black text-[10px] sm:text-[11px] line-clamp-1 text-gray-800 tracking-tight">{item.name}</h4>
                <p className="text-[7px] text-gray-400 font-black uppercase mt-0.5 tracking-widest">{item.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:w-80 xl:w-96 bg-white border-l h-full flex flex-col fixed bottom-[60px] md:bottom-[68px] lg:bottom-0 left-0 right-0 lg:relative z-20 h-[32vh] md:h-[40vh] lg:h-auto shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none border-t lg:border-t-0">
        <div className="p-3 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2 className="font-black text-gray-800 flex items-center gap-2 text-[10px] uppercase tracking-widest"><ShoppingCart size={14} className="text-blue-600"/> Open Order</h2>
          <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{cart.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
               <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-[10px] font-black text-gray-800 truncate">{item.name}</h4>
                    {item.addOns.length > 0 && <p className="text-[8px] text-gray-400 font-bold truncate leading-none">Extras: {item.addOns.map(a => a.name).join(', ')}</p>}
                    <p className="text-[10px] font-black text-blue-600 mt-0.5">{settings.currencySymbol}{(item.unitPrice + item.addOns.reduce((a,b)=>a+b.price, 0))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5">
                      <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, quantity: Math.max(1, c.quantity - 1)} : c))} className="p-1 hover:bg-white rounded-md text-gray-400 transition-all"><Minus size={10}/></button>
                      <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c))} className="p-1 hover:bg-white rounded-md text-gray-400 transition-all"><Plus size={10}/></button>
                    </div>
                    <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                  </div>
               </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 py-6 text-gray-400">
              <Package size={40}/>
              <p className="mt-2 font-black uppercase text-[8px] tracking-[0.2em]">Bag is empty</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-gray-50/30 shrink-0">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Promo Code" 
              className="flex-1 p-2 rounded-lg bg-white border border-gray-100 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
            />
            <button 
              onClick={applyPromoCode}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Apply
            </button>
          </div>
          {appliedPromo && (
            <div className="mt-2 flex items-center justify-between bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Ticket size={10}/> {appliedPromo.code}</span>
               <button onClick={() => setAppliedPromo(null)} className="text-emerald-400 hover:text-emerald-600"><X size={10}/></button>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 border-t bg-white space-y-2 md:space-y-3 shrink-0">
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            <span>Payable Total</span>
            <span className="text-gray-900 text-lg leading-none font-black">{settings.currencySymbol}{total.toFixed(0)}</span>
          </div>
          <button 
            disabled={cart.length === 0} 
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 disabled:opacity-50 text-[11px] tracking-[0.15em] uppercase active:scale-95 transition-all"
          >
            Review & Finalize
          </button>
        </div>
      </div>

      {addonSelectionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAddonSelectionModal(null)} />
          <AddonSelector 
            item={addonSelectionModal.item} 
            availableAddons={allAddons.filter((a: AddOn) => addonSelectionModal.item.addOns?.includes(a.id))} 
            onConfirm={addonSelectionModal.onSelect}
            onCancel={() => setAddonSelectionModal(null)}
            settings={settings}
          />
        </div>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsCheckoutModalOpen(false)} />
          <div className="bg-white rounded-[2.5rem] w-full max-lg relative z-10 p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in max-h-[95vh] overflow-y-auto no-scrollbar border border-gray-100">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase tracking-widest">Order Settlement</h3>
               <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Patron Number</label>
                   <div className="flex items-center bg-gray-50 rounded-xl px-3 py-0.5 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                     <Smartphone size={14} className="text-gray-400 mr-2"/>
                     <input type="text" className="w-full py-2 bg-transparent outline-none font-bold text-xs" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="01XXX..."/>
                   </div>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Patron Name</label>
                   <div className="flex items-center bg-gray-50 rounded-xl px-3 py-0.5 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                     <UserCircle size={14} className="text-gray-400 mr-2"/>
                     <input type="text" className="w-full py-2 bg-transparent outline-none font-bold text-xs" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Guest Name"/>
                   </div>
                 </div>
               </div>

               {customerInfo.phone && (
                 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md"><Star size={14}/></div>
                       <div>
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Available Points</p>
                          <p className="text-base font-black text-blue-700">{availablePoints} pts</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setRedeemPoints(!redeemPoints)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${redeemPoints ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'}`}
                    >
                      {redeemPoints ? 'Points Applied' : 'Redeem Now'}
                    </button>
                 </div>
               )}

               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                   {Object.values(PaymentMethod).map((m) => (
                     <button
                       key={m}
                       onClick={() => setPaymentMethod(m)}
                       className={`py-2 px-3 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                     >
                       {m === PaymentMethod.CASH && <DollarSign size={12}/>}
                       {m === PaymentMethod.BKASH && <Smartphone size={12}/>}
                       {m === PaymentMethod.NAGAD && <HandCoins size={12}/>}
                       {m === PaymentMethod.CARD && <CreditCard size={12}/>}
                       {m}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount</label>
                    <div className="flex items-center bg-gray-50 rounded-xl px-3 py-0.5 border border-gray-100">
                      <input type="number" className="w-full py-2 bg-transparent outline-none font-black text-xs" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}/>
                      <button onClick={() => setDiscountType(prev => prev === 'FIXED' ? 'PERCENT' : 'FIXED')} className="px-2 py-0.5 bg-white rounded-md shadow-sm text-[8px] font-black text-blue-600 border border-gray-100">
                        {discountType === 'FIXED' ? settings.currencySymbol : '%'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">VAT (%)</label>
                    <div className="flex items-center bg-gray-50 rounded-xl px-3 py-0.5 border border-gray-100">
                      <Percent size={12} className="text-gray-400 mr-2"/>
                      <input type="number" className="w-full py-2 bg-transparent outline-none font-black text-xs" value={vatPercent} onChange={e => setVatPercent(parseFloat(e.target.value) || 0)}/>
                    </div>
                  </div>
               </div>
               
               <div className="p-5 bg-gray-900 rounded-[1.8rem] space-y-2 shadow-xl">
                 <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest"><span>Subtotal</span><span className="text-gray-300">{settings.currencySymbol}{subtotal.toLocaleString()}</span></div>
                 <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest"><span>VAT ({vatPercent}%)</span><span className="text-gray-300">+{settings.currencySymbol}{vatAmount.toFixed(0)}</span></div>
                 {manualDiscount > 0 && <div className="flex justify-between text-[10px] font-bold text-rose-400 uppercase tracking-widest"><span>Manual Discount</span><span>-{settings.currencySymbol}{manualDiscount.toFixed(0)}</span></div>}
                 {promoDiscount > 0 && <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-widest"><span>Promo Discount</span><span>-{settings.currencySymbol}{promoDiscount.toFixed(0)}</span></div>}
                 {loyaltyDiscount > 0 && <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-widest"><span>Loyalty Discount</span><span>-{settings.currencySymbol}{loyaltyDiscount.toFixed(0)}</span></div>}
                 <div className="flex justify-between text-lg font-black text-white uppercase tracking-tight pt-2 border-t border-white/10 mt-1"><span>Payable</span><span className="text-blue-400">{settings.currencySymbol}{total.toFixed(0)}</span></div>
               </div>
             </div>
             <button onClick={handleCheckout} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-200 text-[10px] uppercase tracking-[0.2em] active:scale-95 hover:bg-blue-700 transition-all">Settle & Print</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AddonSelector = ({ item, availableAddons, onConfirm, onCancel, settings }: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleAddon = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const currentTotal = item.price + availableAddons.filter((a: any) => selectedIds.includes(a.id)).reduce((acc: number, cur: any) => acc + cur.price, 0);

  return (
    <div className="bg-white rounded-[2rem] w-full max-w-sm relative z-10 p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in border border-gray-100">
      <div className="text-center">
        <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate">{item.name}</h3>
        <p className="text-[9px] text-gray-400 font-black uppercase mt-2 tracking-widest">Customize Selection</p>
      </div>

      <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar py-1">
        {availableAddons.map((addon: AddOn) => (
          <button 
            key={addon.id} 
            onClick={() => toggleAddon(addon.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedIds.includes(addon.id) ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedIds.includes(addon.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200'}`}>
                {selectedIds.includes(addon.id) && <Check size={12}/>}
              </div>
              <span className="text-xs font-bold text-gray-800">{addon.name}</span>
            </div>
            <span className="text-[10px] font-black text-blue-600">+{settings.currencySymbol}{addon.price}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-50 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
          <span className="text-lg font-black text-gray-900">{settings.currencySymbol}{currentTotal}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
          <button onClick={() => onConfirm(availableAddons.filter((a: any) => selectedIds.includes(a.id)))} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Add to Bag</button>
        </div>
      </div>
    </div>
  );
};

// --- Module: Order History ---
const OrderHistoryView = ({ orders, setOrders, settings, branches, setAccountingEntries }: any) => {
  const [filter, setFilter] = useState('ALL');
  const [filterBranchId, setFilterBranchId] = useState('ALL');
  const [filterFrequency, setFilterFrequency] = useState('DAILY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    let list = filterOrdersByCriteria(orders, filterBranchId, filterFrequency, startDate, endDate);
    if (filter !== 'ALL') list = list.filter((o: Order) => o.status === filter);
    return list;
  }, [orders, filter, filterBranchId, filterFrequency, startDate, endDate]);

  const updateStatus = (id: string, newStatus: OrderStatus) => {
    const oldOrder = orders.find((o: Order) => o.id === id);
    if (!oldOrder) return;

    if (newStatus === OrderStatus.CANCELLED && oldOrder.status !== OrderStatus.CANCELLED) {
      const reversalEntry: AccountingEntry = {
        id: `REV-${Date.now()}`,
        date: Date.now(),
        description: `Cancellation Reversal - Order #${id.split('-')[1]}`,
        type: 'EXPENSE',
        amount: oldOrder.total,
        category: 'Sales Return',
        branchId: oldOrder.branchId
      };
      setAccountingEntries((prev: AccountingEntry[]) => [reversalEntry, ...prev]);
    }

    setOrders(orders.map((o: Order) => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const deleteOrder = (id: string) => {
    if (confirm("Permanently remove this transaction log?")) {
      setOrders(orders.filter((o: Order) => o.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
    }
  };

  const handlePrint = (order: Order) => {
    const printContent = document.getElementById(`print-receipt-${order.id}`);
    if (printContent) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Invoice - ${order.id}</title>
              <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 10px; font-size: 13px; max-width: 280px; margin: auto; color: #000; }
                .text-center { text-align: center; display: block; width: 100%; }
                .separator { border-top: 1px dashed #000; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; align-items: flex-start; }
                .bold { font-weight: bold; }
                .mt-1 { margin-top: 4px; }
                h2 { margin: 5px 0; font-size: 18px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 h-full overflow-y-auto pb-40 no-scrollbar bg-gray-50/20">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <h3 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-none uppercase tracking-widest shrink-0">Global Logbook</h3>
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar shrink-0 py-1">
            {['ALL', ...Object.values(OrderStatus)].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 md:px-4 rounded-lg text-[9px] md:text-[10px] font-black transition-all whitespace-nowrap ${filter === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>{s}</button>
            ))}
          </div>
        </div>

        <GlobalFilterBar 
          branches={branches}
          filterBranchId={filterBranchId}
          setFilterBranchId={setFilterBranchId}
          filterFrequency={filterFrequency}
          setFilterFrequency={setFilterFrequency}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {filtered.map((order: any) => (
          <div key={order.id} className="bg-white p-4 md:p-5 rounded-[1.8rem] border border-gray-100 shadow-sm flex flex-col gap-3 md:gap-4 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">#{order.id.split('-')[1]}</span>
                <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase flex items-center gap-1 leading-none"><Clock size={10}/> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{order.status}</span>
            </div>
            <div className="flex items-center gap-3 py-2 border-y border-gray-50">
              <div className="w-10 h-10 rounded-[1rem] bg-gray-50 flex items-center justify-center text-blue-600 font-black shadow-inner shrink-0 text-sm">{order.customerName?.charAt(0) || 'G'}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-black truncate leading-tight ${order.status === OrderStatus.CANCELLED ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{order.customerName || 'Walk-in Patron'}</p>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">{order.customerPhone || 'Anonymous'}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-black leading-none ${order.status === OrderStatus.CANCELLED ? 'text-rose-400 line-through' : 'text-gray-900'}`}>{settings.currencySymbol}{order.total.toFixed(0)}</p>
                <p className="text-[7px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{order.items.length} items</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-1">
               <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                 <Eye size={12}/> Details
               </button>
               <div className="flex gap-2">
                 <button onClick={() => handlePrint(order)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"><Printer size={14}/></button>
                 <button onClick={() => deleteOrder(order.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14}/></button>
               </div>
            </div>
            <div id={`print-receipt-${order.id}`} className="hidden">
              <div className="text-center">
                <h2 className="bold">{settings.appName}</h2>
                <p>{branches.find((b:any)=>b.id === order.branchId)?.name || 'Main Branch'}</p>
                <div className="separator"></div>
                <p className="flex"><span>ID:</span> <span>#{order.id.split('-')[1]}</span></p>
                <p className="flex"><span>Date:</span> <span>{new Date(order.createdAt).toLocaleDateString()}</span></p>
                <p className="flex"><span>Payment:</span> <span>{order.paymentMethod || 'CASH'}</span></p>
                <div className="separator"></div>
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex mt-1">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{settings.currencySymbol}{item.unitPrice * item.quantity}</span>
                  </div>
                ))}
                <div className="separator"></div>
                <div className="flex bold" style={{fontSize: '16px'}}><span>TOTAL</span> <span>{settings.currencySymbol}{order.total.toFixed(0)}</span></div>
                <div className="separator"></div>
                <p className="text-center mt-2">Thank you!</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="bg-white rounded-[2.5rem] w-full max-lg relative z-10 p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in border border-gray-100 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 leading-none">Order Invoice</h3>
                 <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">#{selectedOrder.id}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all shrink-0"><X size={24}/></button>
             </div>
             <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
               <div>
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Details</p>
                 <p className="text-xs font-black text-gray-800">{selectedOrder.customerName || 'Walk-in Guest'}</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Logistics</p>
                 <p className="text-xs font-black text-blue-600 uppercase">{branches.find((b:any)=>b.id === selectedOrder.branchId)?.name || 'Main Branch'}</p>
               </div>
             </div>
             <div className="space-y-3">
               <div className="space-y-2">
                 {selectedOrder.items.map((item: OrderItem) => (
                   <div key={item.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                     <div className="flex justify-between items-center">
                       <span className="text-[11px] font-black text-gray-800"><span className="text-blue-600 mr-2">{item.quantity}x</span> {item.name}</span>
                       <span className="text-[11px] font-black text-gray-900">{settings.currencySymbol}{item.unitPrice * item.quantity}</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             <div className="p-5 bg-gray-900 rounded-[2rem] space-y-2.5 shadow-xl">
               <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest"><span>Subtotal</span><span className="text-gray-300">{settings.currencySymbol}{selectedOrder.subtotal.toLocaleString()}</span></div>
               {selectedOrder.promoDiscount ? <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-widest"><span>Promo Discount</span><span className="text-emerald-300">-{settings.currencySymbol}{selectedOrder.promoDiscount}</span></div> : null}
               {selectedOrder.loyaltyPointsRedeemed ? <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-widest"><span>Loyalty Discount</span><span className="text-blue-300">-{settings.currencySymbol}{selectedOrder.loyaltyPointsRedeemed}</span></div> : null}
               <div className="flex justify-between text-xl font-black text-white uppercase tracking-tight pt-2.5 border-t border-white/10 mt-1"><span>Payable</span><span className="text-blue-400">{settings.currencySymbol}{selectedOrder.total.toFixed(0)}</span></div>
             </div>
             <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.values(OrderStatus).map(status => (
                    <button key={status} onClick={() => updateStatus(selectedOrder.id, status)} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedOrder.status === status ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{status}</button>
                  ))}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
               <button onClick={() => handlePrint(selectedOrder)} className="flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95">
                 <Printer size={16}/> Print Bill
               </button>
               <button onClick={() => setSelectedOrder(null)} className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">
                 Dismiss
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Module: Inventory View ---
const InventoryView = ({ settings, stockItems, setStockItems }: any) => {
  const [modal, setModal] = useState<any>(null);

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      stock: parseFloat(formData.get('stock') as string),
      category: formData.get('category') as string,
      unit: formData.get('unit') as any,
      min: parseFloat(formData.get('min') as string)
    };
    if (modal.data) setStockItems(stockItems.map((s: any) => s.id === modal.data.id ? { ...s, ...data } : s));
    else setStockItems([...stockItems, { ...data, id: `rm-${Date.now()}` }]);
    setModal(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Material Control</h3>
        <button onClick={() => setModal({ type: 'add', data: null })} className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95"><Plus size={20}/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stockItems.map((item: any) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.category}</p>
              <div className="flex gap-2">
                <button onClick={() => setModal({ type: 'edit', data: item })} className="text-gray-300 hover:text-blue-600 transition-colors"><Edit size={14}/></button>
                <button onClick={() => setStockItems(stockItems.filter((x:any)=>x.id!==item.id))} className="text-gray-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>
            <h4 className="text-base font-black text-gray-800 mt-2 truncate">{item.name}</h4>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-gray-900 leading-none">{item.stock} <span className="text-[10px] font-bold text-gray-400 uppercase">{item.unit}</span></span>
                <span className="text-[9px] font-black text-gray-400 uppercase mb-1">Limit: {item.min}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-1000 ${item.stock <= item.min ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.stock / (item.min * 3)) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={saveItem} className="bg-white rounded-[2rem] w-full max-w-md relative z-10 p-8 md:p-10 space-y-4 shadow-2xl animate-in zoom-in border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase tracking-widest">Resource Config</h3>
                <button type="button" onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <input name="name" type="text" placeholder="Resource Label" defaultValue={modal.data?.name} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             <div className="grid grid-cols-2 gap-3">
               <input name="stock" type="number" placeholder="Inventory Qty" defaultValue={modal.data?.stock} className="p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
               <input name="min" type="number" placeholder="Alert Point" defaultValue={modal.data?.min} className="p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             </div>
             <input name="category" type="text" placeholder="Family" defaultValue={modal.data?.category} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Save Matrix</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Module: Accounting View ---
const AccountingView = ({ settings, entries, setEntries, withdrawalRequests, setWithdrawalRequests, staff }: any) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'SUMMARY' | 'REQUESTS'>('LOGS');

  const addVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newEntry = {
      id: `ACC-${Date.now()}`,
      date: Date.now(),
      description: formData.get('description') as string,
      type: formData.get('type') as any,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      branchId: 'b1'
    };
    setEntries([newEntry, ...entries]);
    setIsAddOpen(false);
  };

  const approveRequest = (req: WithdrawalRequest) => {
    const newEntry: AccountingEntry = {
      id: `PAY-${Date.now()}`,
      date: Date.now(),
      description: `Payment Fulfillment - ${req.userName} (${req.reason})`,
      type: 'EXPENSE',
      amount: req.amount,
      category: 'Payroll / Staff Advance',
      branchId: 'b1'
    };
    setEntries([newEntry, ...entries]);
    setWithdrawalRequests(withdrawalRequests.map((r: WithdrawalRequest) => 
      r.id === req.id ? { ...r, status: 'APPROVED' } : r
    ));
  };

  const rejectRequest = (reqId: string) => {
    setWithdrawalRequests(withdrawalRequests.map((r: WithdrawalRequest) => 
      r.id === reqId ? { ...r, status: 'REJECTED' } : r
    ));
  };

  const generateSalaryRequests = () => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const newRequests: any[] = [];
    staff.forEach((s: UserType) => {
      const activeOrApprovedRequest = withdrawalRequests.find((r: any) => 
        r.userId === s.id && 
        r.reason.includes(`Salary Request: ${month}`) &&
        (r.status === 'PENDING' || r.status === 'APPROVED')
      );
      if (activeOrApprovedRequest) return;

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const advancesInCurrentPeriod = withdrawalRequests.filter((r: any) => 
        r.userId === s.id && 
        r.createdAt >= monthStart && 
        !r.reason.includes('Salary Request') &&
        (r.status === 'APPROVED' || r.status === 'PENDING')
      );
      
      const totalAdvances = advancesInCurrentPeriod.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const netSalary = Math.max(0, (s.salary || 0) - totalAdvances);

      if (netSalary > 0 || (s.salary && s.salary > 0)) {
        newRequests.push({
          id: `SAL-${s.id}-${Date.now()}`,
          userId: s.id,
          userName: s.name,
          amount: netSalary,
          reason: `Salary Request: ${month}${totalAdvances > 0 ? ` (Advances deducted: ${settings.currencySymbol}${totalAdvances})` : ''}`,
          status: 'PENDING',
          createdAt: Date.now()
        });
      }
    });

    if (newRequests.length > 0) {
      setWithdrawalRequests([...newRequests, ...withdrawalRequests]);
      alert(`${newRequests.length} Salary Disbursement Requests Generated.`);
    } else {
      alert("No new salary requests needed for this period or a request is already active.");
    }
  };

  const summaryData = useMemo(() => {
    const totals = entries.reduce((acc: any, curr: AccountingEntry) => {
      if (curr.type === 'INCOME') acc.income += curr.amount;
      else {
        acc.expense += curr.amount;
        if (curr.category === 'Payroll') acc.payroll += curr.amount;
        if (curr.category === 'Staff Advance') acc.advances += curr.amount;
      }
      return acc;
    }, { income: 0, expense: 0, payroll: 0, advances: 0 });

    const liabilities = withdrawalRequests
      .filter((r: WithdrawalRequest) => r.status === 'PENDING')
      .reduce((acc: number, curr: WithdrawalRequest) => acc + curr.amount, 0);

    return { ...totals, liabilities, net: totals.income - totals.expense };
  }, [entries, withdrawalRequests]);

  return (
    <div className="p-4 lg:p-8 space-y-6 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Fiscal Terminal</h3>
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex gap-1">
            <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'LOGS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Vouchers</button>
            <button onClick={() => setActiveTab('REQUESTS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'REQUESTS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Requests</button>
            <button onClick={() => setActiveTab('SUMMARY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'SUMMARY' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Summary</button>
          </div>
          {activeTab === 'LOGS' && (
            <button onClick={() => setIsAddOpen(true)} className="p-3 bg-rose-600 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95"><Plus size={20}/></button>
          )}
        </div>
      </div>

      {activeTab === 'SUMMARY' ? (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Inflow</p>
              <p className="text-2xl font-black text-emerald-600">{settings.currencySymbol}{summaryData.income.toLocaleString()}</p>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Outflow</p>
              <p className="text-2xl font-black text-rose-600">{settings.currencySymbol}{summaryData.expense.toLocaleString()}</p>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Liabilities</p>
              <p className="text-2xl font-black text-amber-600">{settings.currencySymbol}{summaryData.liabilities.toLocaleString()}</p>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Net Liquidity</p>
              <p className="text-2xl font-black text-blue-600">{settings.currencySymbol}{summaryData.net.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'REQUESTS' ? (
        <div className="space-y-6 animate-in fade-in">
           <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Banknote size={24}/></div>
                 <div>
                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Salary Management</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Automate salary disbursement with automatic deduction of advances.</p>
                 </div>
              </div>
              <button onClick={generateSalaryRequests} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                 <PlusCircle size={16}/> Run Salary Cycle
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {withdrawalRequests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                 <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shadow-inner">{req.userName.charAt(0)}</div>
                          <div>
                             <p className="text-sm font-black text-gray-800">{req.userName}</p>
                             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <span className="text-lg font-black text-blue-600">{settings.currencySymbol}{req.amount.toLocaleString() || '0'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed italic">"{req.reason}"</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                       <button onClick={() => approveRequest(req)} className="py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-md">Approve</button>
                       <button onClick={() => rejectRequest(req.id)} className="py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Reject</button>
                    </div>
                 </div>
              ))}
           </div>
           {withdrawalRequests.filter((r: any) => r.status === 'PENDING').length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center opacity-20">
                 <CheckCircle size={48}/>
                 <p className="mt-4 font-black uppercase text-[10px] tracking-[0.3em]">No Pending Requests</p>
              </div>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
          {entries.map((e: any) => (
            <div key={e.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${e.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{e.type}</span>
                  <button onClick={() => setEntries(entries.filter((x:any)=>x.id!==e.id))} className="text-gray-200 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                </div>
              </div>
              <h4 className="text-sm font-black text-gray-800 truncate">{e.description}</h4>
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{e.category}</span>
                 <span className={`text-lg font-black ${e.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{e.type === 'INCOME' ? '+' : '-'}{settings.currencySymbol}{e.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <form onSubmit={addVoucher} className="bg-white rounded-[2rem] w-full max-md relative z-10 p-8 md:p-10 space-y-4 shadow-2xl animate-in zoom-in border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase tracking-widest">Log Voucher</h3>
                <button type="button" onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <input name="description" type="text" placeholder="Entry Narrative" className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             <input name="amount" type="number" placeholder="Magnitude" className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             <div className="grid grid-cols-2 gap-3">
               <select name="type" className="p-4 rounded-2xl bg-gray-50 border-none font-black text-[10px] outline-none focus:ring-4 focus:ring-blue-50 uppercase tracking-widest">
                 <option value="EXPENSE">Expense</option>
                 <option value="INCOME">Income</option>
               </select>
               <input name="category" type="text" placeholder="Ledger Code" className="p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             </div>
             <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Commit Entry</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Module: Customers View ---
const CustomersView = ({ orders, settings, customerPointsMap }: any) => {
  const customers = useMemo(() => {
    const map: Record<string, any> = {};
    orders.forEach((o: any) => {
      const key = o.customerPhone || 'Anonymous';
      if (!map[key]) map[key] = { phone: key, name: o.customerName || 'Walk-in Patron', totalOrders: 0, totalSpend: 0, lastOrder: 0 };
      map[key].totalOrders += 1;
      if (o.status !== OrderStatus.CANCELLED) {
        map[key].totalSpend += o.total;
      }
      map[key].lastOrder = Math.max(map[key].lastOrder, o.createdAt);
    });
    return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders]);

  return (
    <div className="p-4 lg:p-8 space-y-6 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Patron Registry</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
        {customers.map((c: any) => (
          <div key={c.phone} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[1.8rem] bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">{c.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-black text-gray-900 truncate tracking-tight">{c.name}</h4>
                <p className="text-xs font-bold text-gray-400 mt-1">{c.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Visits</p>
                <p className="text-sm font-black text-gray-800">{c.totalOrders}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Loyalty Points</p>
                <p className="text-sm font-black text-blue-600">{customerPointsMap[c.phone] || 0} pts</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Module: Menu Setup ---
const MenuSetupView = ({ settings, categories, setCategories, menuItems, setMenuItems, addons, setAddons, branches }: any) => {
  const [activeTab, setActiveTab] = useState('ITEMS');
  const [modal, setModal] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await resizeImage(file);
      setImagePreview(base64);
    }
  };

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const selectedAddonIds = Array.from(formData.getAll('addOns') as string[]);
    const selectedBranchIds = Array.from(formData.getAll('allowedBranchIds') as string[]);
    
    const finalBranchIds = selectedBranchIds.length > 0 ? selectedBranchIds : branches.map((b: Branch) => b.id);

    const branchPrices: BranchPriceOverride[] = [];
    branches.forEach((b: Branch) => {
      const branchPriceVal = formData.get(`price_${b.id}`) as string;
      if (branchPriceVal && parseFloat(branchPriceVal) > 0) {
        branchPrices.push({ branchId: b.id, price: parseFloat(branchPriceVal) });
      }
    });

    const data = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      image: imagePreview || modal.data?.image || `https://picsum.photos/400/300?random=${Date.now()}`,
      description: formData.get('description') as string,
      addOns: selectedAddonIds,
      allowedBranchIds: finalBranchIds,
      branchPrices
    };
    if (modal.data) setMenuItems(menuItems.map((m: any) => m.id === modal.data.id ? { ...m, ...data } : m));
    else setMenuItems([...menuItems, { ...data, id: `m-${Date.now()}` }]);
    setModal(null);
    setImagePreview(null);
  };

  const saveAddon = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const branchPrices: BranchPriceOverride[] = [];
    branches.forEach((b: Branch) => {
      const branchPriceVal = formData.get(`price_${b.id}`) as string;
      if (branchPriceVal && parseFloat(branchPriceVal) > 0) {
        branchPrices.push({ branchId: b.id, price: parseFloat(branchPriceVal) });
      }
    });

    const data = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      branchPrices
    };
    if (modal.data) setAddons(addons.map((a: any) => a.id === modal.data.id ? { ...a, ...data } : a));
    else setAddons([...addons, { ...data, id: `a-${Date.now()}` }]);
    setModal(null);
  };

  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    if (modal.data) setCategories(categories.map((c: any) => c.id === modal.data.id ? { ...c, name } : c));
    else setCategories([...categories, { id: `cat-${Date.now()}`, name }]);
    setModal(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Catalog Forge</h3>
        <div className="flex gap-1 md:gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar shrink-0">
           <button onClick={() => setActiveTab('ITEMS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'ITEMS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Offerings</button>
           <button onClick={() => setActiveTab('ADDONS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'ADDONS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Add-ons</button>
           <button onClick={() => setActiveTab('CATS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'CATS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Taxonomy</button>
        </div>
      </div>
      
      {activeTab === 'ITEMS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item: any) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
              <div className="h-44 md:h-48 relative overflow-hidden bg-gray-50">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 flex gap-2">
                   <button onClick={() => { setImagePreview(item.image); setModal({ type: 'edit-item', data: item }); }} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-600 hover:text-blue-600 shadow-xl transition-all"><Edit size={16}/></button>
                   <button onClick={() => setMenuItems(menuItems.filter((m:any)=>m.id!==item.id))} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-600 hover:text-rose-600 shadow-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-gray-800 tracking-tight leading-none truncate max-w-[150px]">{item.name}</h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 block">{item.category}</span>
                  </div>
                  <p className="text-xl font-black text-blue-600">{settings.currencySymbol}{item.price}</p>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { setImagePreview(null); setModal({ type: 'add-item', data: null }); }} className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 min-h-[200px] flex flex-col items-center justify-center gap-4 group hover:border-blue-300 hover:bg-blue-50/20 transition-all active:scale-95">
             <div className="p-6 rounded-[1.8rem] bg-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400 shadow-inner"><Plus size={32}/></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-blue-600">New Offering</span>
          </button>
        </div>
      ) : activeTab === 'ADDONS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {addons.map((a: any) => (
            <div key={a.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col gap-2 group hover:shadow-lg transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-gray-800 truncate">{a.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setModal({ type: 'edit-addon', data: a })} className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg transition-all"><Edit size={14}/></button>
                  <button onClick={() => setAddons(addons.filter((x:any)=>x.id!==a.id))} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg transition-all"><Trash2 size={14}/></button>
                </div>
              </div>
              <span className="text-[10px] font-black text-blue-600">Base: {settings.currencySymbol}{a.price}</span>
            </div>
          ))}
          <button onClick={() => setModal({ type: 'add-addon', data: null })} className="bg-white p-6 rounded-[1.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all">
            <Plus size={20} className="text-gray-400"/>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Add-on</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat: any) => (
            <div key={cat.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex justify-between items-center group hover:shadow-lg transition-all">
              <span className="text-sm font-black text-gray-800">{cat.name}</span>
              <div className="flex gap-2">
                <button onClick={() => setModal({ type: 'edit-cat', data: cat })} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16}/></button>
                <button onClick={() => setCategories(categories.filter((c:any)=>c.id!==cat.id))} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          <button onClick={() => setModal({ type: 'add-cat', data: null })} className="bg-white p-6 rounded-[1.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all">
            <Plus size={20} className="text-gray-400"/>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New category</span>
          </button>
        </div>
      )}

      {(modal?.type === 'add-item' || modal?.type === 'edit-item') && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setModal(null); setImagePreview(null); }} />
          <form onSubmit={saveItem} className="bg-white rounded-[2.5rem] w-full max-lg relative z-10 p-6 md:p-10 space-y-6 shadow-2xl animate-in zoom-in border border-gray-100 my-auto">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black uppercase tracking-widest">Offering Logic</h3>
                <button type="button" onClick={() => { setModal(null); setImagePreview(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <div className="relative h-40 md:h-48 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden group shadow-inner">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview"/> : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                    <div className="p-4 bg-white rounded-2xl shadow-sm"><ImageIcon size={32}/></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capture Visual</span>
                  </div>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="p-3 bg-white rounded-2xl shadow-2xl text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Upload size={14}/> Change Asset
                  </div>
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange}/>
             </div>
             <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
               <input name="name" type="text" placeholder="Designation" defaultValue={modal.data?.name} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Base Price</label>
                   <input name="price" type="number" placeholder="0.00" defaultValue={modal.data?.price} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Taxonomy</label>
                   <select name="category" className="w-full p-4 rounded-2xl bg-gray-50 border-none font-black text-xs outline-none focus:ring-4 focus:ring-blue-50">
                     {categories.map((c:any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                 </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">Node Availability (POS Display)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    {branches.map((b: Branch) => (
                      <label key={b.id} className="flex items-center gap-3 cursor-pointer p-1">
                        <input 
                          type="checkbox" 
                          name="allowedBranchIds" 
                          value={b.id} 
                          defaultChecked={modal.data?.allowedBranchIds?.includes(b.id) || !modal.data} 
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-gray-700 uppercase truncate">{b.name}</span>
                      </label>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">Branch-Specific Overrides</label>
                 <div className="space-y-2">
                    {branches.map((b: Branch) => (
                      <div key={b.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-gray-800 uppercase tracking-tighter truncate">{b.name}</p>
                        </div>
                        <input name={`price_${b.id}`} type="number" step="0.01" placeholder="Custom Price" defaultValue={modal.data?.branchPrices?.find((bp:any) => bp.branchId === b.id)?.price} className="w-28 p-2 rounded-lg bg-white border border-gray-200 text-xs font-bold outline-none"/>
                      </div>
                    ))}
                 </div>
               </div>
             </div>
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Settle Asset</button>
          </form>
        </div>
      )}

      {(modal?.type === 'add-addon' || modal?.type === 'edit-addon') && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={saveAddon} className="bg-white rounded-[2.5rem] w-full max-md relative z-10 p-8 space-y-6 shadow-2xl animate-in zoom-in border border-gray-100">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest">Add-on Matrix</h3>
                <button type="button" onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <div className="space-y-4">
                <input name="name" type="text" placeholder="Add-on Name" defaultValue={modal.data?.name} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
                <input name="price" type="number" placeholder="Base Price" defaultValue={modal.data?.price} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">Branch Overrides</label>
                   <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                      {branches.map((b: Branch) => (
                        <div key={b.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                           <span className="flex-1 text-[9px] font-black uppercase truncate">{b.name}</span>
                           <input name={`price_${b.id}`} type="number" step="0.01" placeholder="Override" defaultValue={modal.data?.branchPrices?.find((bp:any) => bp.branchId === b.id)?.price} className="w-20 p-2 rounded-lg bg-white border border-gray-200 text-xs font-bold outline-none"/>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Commit Add-on</button>
          </form>
        </div>
      )}

      {(modal?.type === 'add-cat' || modal?.type === 'edit-cat') && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={saveCategory} className="bg-white rounded-[2.5rem] w-full max-md relative z-10 p-8 space-y-6 shadow-2xl animate-in zoom-in border border-gray-100">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest">Category Config</h3>
                <button type="button" onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <input name="name" type="text" placeholder="Category Name" defaultValue={modal.data?.name} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Commit Category</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Module: Staff Management ---
const StaffManagementView = ({ staff, setStaff, branches, impersonateStaff, settings }: any) => {
  const [modal, setModal] = useState<any>(null);

  const saveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const selectedBranchIds = Array.from(formData.getAll('branchIds') as string[]);
    const selectedPermissions = Array.from(formData.getAll('permissions') as string[]);
    
    const data = {
      name: formData.get('name') as string,
      username: (formData.get('username') as string || "").trim(),
      password: (formData.get('password') as string || "").trim(),
      role: formData.get('role') as Role,
      assignedBranchIds: selectedBranchIds,
      salary: parseFloat(formData.get('salary') as string) || 0,
      advanceLimit: parseFloat(formData.get('advanceLimit') as string) || 0,
      walletBalance: parseFloat(formData.get('walletBalance') as string) || 0,
      permissions: selectedPermissions
    };
    
    if (modal.data) setStaff(staff.map((s: any) => s.id === modal.data.id ? { ...s, ...data } : s));
    else setStaff([...staff, { ...data, id: `u-${Date.now()}` }]);
    setModal(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Human Capital</h3>
        <button onClick={() => setModal({ type: 'add', data: null })} className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95"><UserPlus size={20}/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {staff.map((s: any) => (
          <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col group relative overflow-hidden hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-16 h-16 rounded-[1.8rem] bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">{s.name.charAt(0)}</div>
              <div className="flex gap-2">
                 <button onClick={() => setModal({ type: 'edit', data: s })} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16}/></button>
                 <button onClick={() => setStaff(staff.filter((x:any)=>x.id!==s.id))} className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
              </div>
            </div>
            <h4 className="text-xl font-black text-gray-900 tracking-tight truncate">{s.name}</h4>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{s.role.replace('_', ' ')}</p>
            <div className="mt-6 flex flex-col gap-2 border-t pt-4">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Base Salary</span>
                  <span className="text-sm font-black text-gray-800">{settings.currencySymbol}{s.salary?.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Advance Limit</span>
                  <span className="text-sm font-black text-rose-500">{settings.currencySymbol}{s.advanceLimit?.toLocaleString()}</span>
               </div>
            </div>
            <div className="mt-6">
              <button onClick={() => impersonateStaff(s)} className="w-full px-4 py-3 bg-gray-50 rounded-[1.2rem] text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95">Simulate Terminal</button>
            </div>
          </div>
        ))}
      </div>
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={saveStaff} className="bg-white rounded-[2.5rem] w-full max-lg relative z-10 p-6 md:p-10 space-y-5 shadow-2xl animate-in zoom-in border border-gray-100 my-auto">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-black uppercase tracking-widest">Staff Matrix Logic</h3>
                <button type="button" onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Full Name</label>
                      <input name="name" type="text" placeholder="John Doe" defaultValue={modal.data?.name} className="w-full p-3 rounded-xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" required />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Base Role Reference</label>
                      <select name="role" defaultValue={modal.data?.role || Role.CASHIER} className="w-full p-3 rounded-xl bg-gray-50 border-none font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-blue-100">
                         {Object.values(Role).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Username</label>
                      <input name="username" type="text" defaultValue={modal.data?.username} className="w-full p-3 rounded-xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" required />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Access Secret</label>
                      <input name="password" type="password" defaultValue={modal.data?.password} className="w-full p-3 rounded-xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" required />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Salary Allocation</label>
                      <input name="salary" type="number" defaultValue={modal.data?.salary} className="w-full p-3 rounded-xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" required />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-4">Advance Threshold</label>
                      <input name="advanceLimit" type="number" defaultValue={modal.data?.advanceLimit} className="w-full p-3 rounded-xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100" required />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">Custom Permission Set (Menu Access)</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto no-scrollbar bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      {NAV_ITEMS.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                           <input 
                            type="checkbox" 
                            name="permissions" 
                            value={item.id} 
                            defaultChecked={modal.data?.permissions?.includes(item.id) || (!modal.data && ['dashboard', 'pos'].includes(item.id))} 
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                           />
                           <span className="text-[9px] font-bold text-gray-600 uppercase truncate">{item.label}</span>
                        </label>
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">Branch Node Permissions</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      {branches.map((b: Branch) => (
                        <label key={b.id} className="flex items-center gap-3 cursor-pointer">
                           <input 
                            type="checkbox" 
                            name="branchIds" 
                            value={b.id} 
                            defaultChecked={modal.data?.assignedBranchIds?.includes(b.id)} 
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                           />
                           <span className="text-[10px] font-bold text-gray-700 uppercase truncate">{b.name}</span>
                        </label>
                      ))}
                   </div>
                </div>
             </div>
             <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-2">Commit Personnel Profile</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Component: Sidebar ---
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, settings, currentUser, onLogout }: any) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-100 z-50 transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Flame size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 tracking-tighter leading-none">{settings.appName}</h1>
              <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">Enterprise Core</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar space-y-1">
          {NAV_ITEMS.map((item) => {
            const hasAccess = currentUser.role === Role.SUPER_ADMIN || !currentUser.permissions || currentUser.permissions.includes(item.id);
            if (!hasAccess) return null;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {item.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-50 shrink-0">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all group"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// --- Component: Header ---
const Header = ({ title, toggleSidebar, activeBranch, setActiveBranch, branches, currentUser, notifications, markAllRead }: any) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications ? notifications.filter((n: any) => !n.read).length : 0;

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">{title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Enterprise Sync: Active</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex items-center bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-100">
          <Building2 size={16} className="text-gray-400 mr-2" />
          <select 
            value={activeBranch?.id} 
            onChange={(e) => {
              const b = branches.find((br: any) => br.id === e.target.value);
              if (b) setActiveBranch(b);
            }}
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none pr-4"
          >
            {branches.filter((b: any) => currentUser.assignedBranchIds.includes(b.id)).map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <button 
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
            className={`p-3 rounded-2xl border transition-all relative ${showNotifs ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}
          </button>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[1rem] md:rounded-[1.2rem] bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-inner text-sm">
          {currentUser.name.charAt(0)}
        </div>
      </div>
    </header>
  );
};

// --- Module: Branch Management View ---
const BranchManagementView = ({ branches, setBranches }: any) => {
  const [modal, setModal] = useState<any>(null);

  const saveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as any,
      address: formData.get('address') as string,
      profitMargin: parseFloat(formData.get('profitMargin') as string) || 0
    };
    if (modal && modal.data) {
      setBranches(branches.map((b: any) => b.id === modal.data.id ? { ...b, ...data } : b));
    } else {
      setBranches([...branches, { ...data, id: `b-${Date.now()}` }]);
    }
    setModal(null);
  };

  const deleteBranch = (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      setBranches(branches.filter((b: any) => b.id !== id));
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Global Nodes</h3>
        <button onClick={() => setModal({ type: 'add', data: null })} className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95">
          <Plus size={24}/>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {branches.map((b: any) => (
          <div key={b.id} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-[1.5rem] ${b.type === BranchType.RESTAURANT ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'} shadow-inner`}>
                {b.type === BranchType.RESTAURANT ? <Home size={28}/> : <Coffee size={28}/>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ type: 'edit', data: b })} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18}/></button>
                <button onClick={() => deleteBranch(b.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-black text-gray-900 tracking-tight truncate leading-none">{b.name}</h4>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">{b.type.replace('_', ' ')}</p>
              <div className="mt-6 flex items-center gap-4 border-t pt-4">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Profit Margin</p>
                  <p className="text-sm font-black text-blue-600">{b.profitMargin || 0}%</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                  <p className="text-[10px] font-bold text-gray-500 truncate">{b.address}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={saveBranch} className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 p-8 md:p-10 space-y-5 shadow-2xl animate-in zoom-in border border-gray-100">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-black uppercase tracking-widest text-gray-900">{modal.type === 'edit' ? 'Update Branch' : 'Add New Branch'}</h3>
                <button type="button" onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24}/></button>
             </div>
             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Branch Name</label>
                  <input name="name" type="text" placeholder="e.g. Gulshan Outlet" defaultValue={modal.data?.name} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Type</label>
                    <select name="type" defaultValue={modal.data?.type || BranchType.RESTAURANT} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-black text-[10px] outline-none focus:ring-4 focus:ring-blue-50 uppercase tracking-widest">
                      <option value={BranchType.RESTAURANT}>Restaurant</option>
                      <option value={BranchType.FOOD_CART}>Food Cart</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Profit Margin (%)</label>
                    <input name="profitMargin" type="number" placeholder="40" defaultValue={modal.data?.profitMargin} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Address</label>
                  <textarea name="address" placeholder="Full address details..." defaultValue={modal.data?.address} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none h-24 focus:ring-4 focus:ring-blue-50 resize-none" required />
                </div>
             </div>
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-4">
               {modal.type === 'edit' ? 'Update Node' : 'Initialize Node'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Module: Settings View ---
const SettingsView = ({ 
  settings, setSettings,
  branches, setBranches,
  orders, setOrders,
  accountingEntries, setAccountingEntries,
  staff, setStaff,
  menuItems, setMenuItems,
  stockItems, setStockItems,
  categories, setCategories,
  addons, setAddons,
  withdrawalRequests, setWithdrawalRequests
}: any) => {
  const [promoModal, setPromoModal] = useState<any>(null);
  
  const savePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newPromo = {
      id: promoModal.data?.id || `p-${Date.now()}`,
      code: formData.get('code') as string,
      type: formData.get('type') as any,
      value: parseFloat(formData.get('value') as string),
      minOrderAmount: parseFloat(formData.get('minOrderAmount') as string) || 0
    };
    const currentPromos = settings.promoCodes || [];
    const updatedPromos = promoModal.data 
      ? currentPromos.map((p: any) => p.id === newPromo.id ? newPromo : p)
      : [...currentPromos, newPromo];
    
    setSettings({ ...settings, promoCodes: updatedPromos });
    setPromoModal(null);
  };

  const handleExport = () => {
    const data = { settings, branches, orders, accountingEntries, staff, menuItems, stockItems, categories, addons, withdrawalRequests, exportDate: new Date().toISOString(), version: "1.3.Enterprise" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POS_BACKUP_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!confirm("This will overwrite ALL current local data. Continue?")) return;
        if(data.settings) setSettings(data.settings);
        if(data.branches) setBranches(data.branches);
        if(data.orders) setOrders(data.orders);
        if(data.accountingEntries) setAccountingEntries(data.accountingEntries);
        if(data.staff) setStaff(data.staff);
        if(data.menuItems) setMenuItems(data.menuItems);
        if(data.stockItems) setStockItems(data.stockItems);
        if(data.categories) setCategories(data.categories);
        if(data.addons) setAddons(data.addons);
        if(data.withdrawalRequests) setWithdrawalRequests(data.withdrawalRequests);
        alert("System State Restored Successfully.");
        window.location.reload();
      } catch (err) {
        alert("Invalid Backup File.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-4xl mx-auto h-full overflow-y-auto pb-32 no-scrollbar">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
        <h3 className="text-2xl md:text-3xl font-black mb-12 text-gray-900 uppercase tracking-tighter">Enterprise Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
           <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Business Label</label>
             <input type="text" value={settings.appName} className="w-full p-5 rounded-[1.8rem] border-none bg-gray-50 font-black text-gray-800 outline-none" onChange={e => setSettings({...settings, appName: e.target.value})} />
           </div>
           <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Currency Code</label>
             <input type="text" value={settings.currencySymbol} className="w-full p-5 rounded-[1.8rem] border-none bg-gray-50 font-black text-gray-800 outline-none" onChange={e => setSettings({...settings, currencySymbol: e.target.value})} />
           </div>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-xl font-black uppercase tracking-tight">Promotional Engine</h3>
           <button onClick={() => setPromoModal({ type: 'add' })} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={16}/></button>
        </div>
        <div className="space-y-3">
           {(settings.promoCodes || []).map((p: any) => (
             <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><Ticket size={18}/></div>
                   <div>
                      <p className="text-sm font-black text-gray-800">{p.code}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{p.value}{p.type === 'PERCENT' ? '%' : settings.currencySymbol} Discount • Min: {settings.currencySymbol}{p.minOrderAmount || 0}</p>
                   </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setPromoModal({ type: 'edit', data: p })} className="p-2 text-gray-400 hover:text-blue-600"><Edit size={16}/></button>
                   <button onClick={() => setSettings({...settings, promoCodes: settings.promoCodes.filter((x:any)=>x.id!==p.id)})} className="p-2 text-gray-400 hover:text-rose-600"><Trash2 size={16}/></button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-black p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
           <div className="p-4 bg-white/10 rounded-2xl"><Database size={24} className="text-blue-400" /></div>
           <div>
             <h3 className="text-xl font-black uppercase tracking-tight">Data Management Core</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enterprise Portability Mode</p>
           </div>
        </div>
        <p className="text-sm text-gray-400 mb-8 max-w-md leading-relaxed">
          Your data is stored locally. Ensure you backup your data regularly to prevent loss.
        </p>
        <div className="flex flex-wrap gap-4">
           <button onClick={handleExport} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"><Save size={16}/> Full System Backup</button>
           <label className="flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 cursor-pointer">
             <UploadCloud size={16}/> Restore System
             <input type="file" className="hidden" accept=".json" onChange={handleImport} />
           </label>
        </div>
      </div>

      {promoModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPromoModal(null)} />
          <form onSubmit={savePromoCode} className="bg-white rounded-[2.5rem] w-full max-md relative z-10 p-8 space-y-6 shadow-2xl animate-in zoom-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase tracking-widest text-gray-900">Promo Logic</h3>
                <button type="button" onClick={() => setPromoModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20}/></button>
             </div>
             <div className="space-y-4">
                <input name="code" type="text" placeholder="Promo Code (e.g. SAVER20)" defaultValue={promoModal.data?.code} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-black text-sm outline-none focus:ring-4 focus:ring-blue-50 uppercase" required />
                <div className="grid grid-cols-2 gap-4">
                  <select name="type" defaultValue={promoModal.data?.type || 'FIXED'} className="p-4 rounded-2xl bg-gray-50 border-none font-black text-[10px] uppercase outline-none">
                    <option value="FIXED">Fixed Discount</option>
                    <option value="PERCENT">Percentage %</option>
                  </select>
                  <input name="value" type="number" step="0.01" placeholder="Value" defaultValue={promoModal.data?.value} className="p-4 rounded-2xl bg-gray-50 border-none font-black text-sm outline-none" required />
                </div>
                <input name="minOrderAmount" type="number" placeholder="Min Order Amount" defaultValue={promoModal.data?.minOrderAmount} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-black text-sm outline-none" />
             </div>
             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Save Promo</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Main App Controller ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = usePersistentState('app-settings', DEFAULT_SETTINGS);
  const [branches, setBranches] = usePersistentState('app-branches', MOCK_BRANCHES);
  
  const [orders, setOrders] = usePersistentState('orders-list', []);
  const [withdrawalRequests, setWithdrawalRequests] = usePersistentState('withdrawal-requests', []);
  const [accountingEntries, setAccountingEntries] = usePersistentState('accounting-records', []);
  const [staff, setStaff] = usePersistentState('staff-list', [
    { id: 'admin-1', name: 'Super Admin', role: Role.SUPER_ADMIN, assignedBranchIds: MOCK_BRANCHES.map(b => b.id), username: 'admin', password: 'password', permissions: NAV_ITEMS.map(n => n.id), salary: 50000, advanceLimit: 10000, walletBalance: 0 }
  ]);
  const [categories, setCategories] = usePersistentState('app-categories', INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = usePersistentState('menu-items', MOCK_MENU_ITEMS);
  const [addons, setAddons] = usePersistentState('app-addons', MOCK_ADDONS);
  const [stockItems, setStockItems] = usePersistentState('inventory-stock', []);
  const [notifications, setNotifications] = usePersistentState('app-notifications', []);
  const [currentUser, setCurrentUser] = usePersistentState('current-user', null);
  const [originalAdmin, setOriginalAdmin] = useState<UserType | null>(null);

  // Initialize active branch based on current user if present
  const [activeBranch, setActiveBranch] = useState(() => {
    if (currentUser && currentUser.assignedBranchIds?.length > 0) {
      return branches.find((b: any) => currentUser.assignedBranchIds.includes(b.id)) || branches[0];
    }
    return branches[0];
  });

  const [filterBranchId, setFilterBranchId] = useState('ALL');
  const [filterFrequency, setFilterFrequency] = useState('DAILY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const customerPointsMap = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o: Order) => {
      if (!o.customerPhone) return;
      const key = o.customerPhone;
      if (o.status !== OrderStatus.CANCELLED) {
        map[key] = (map[key] || 0) + (o.loyaltyPointsEarned || 0) - (o.loyaltyPointsRedeemed || 0);
      }
    });
    return map;
  }, [orders]);

  const addNotification = (title: string, message: string, type: Notification['type'] = 'INFO') => {
    const newNotif: Notification = { id: `NOTIF-${Date.now()}`, title, message, type, createdAt: Date.now(), read: false };
    setNotifications((prev: Notification[]) => [newNotif, ...prev].slice(0, 50));
  };

  const markAllRead = () => setNotifications(notifications.map((n: Notification) => ({ ...n, read: true })));

  const addOrder = (order: Order) => {
    const isFirstOrder = order.customerPhone && !orders.some(o => o.customerPhone === order.customerPhone);
    const earnedPoints = Math.floor(order.total / 100) + (isFirstOrder ? 10 : 0);
    const enrichedOrder = { ...order, loyaltyPointsEarned: earnedPoints };

    setOrders([enrichedOrder, ...orders]);
    const newEntry: AccountingEntry = { id: `INC-${Date.now()}`, date: Date.now(), description: `Sales - Order #${order.id.split('-')[1]} (${order.paymentMethod || 'CASH'})`, type: 'INCOME', amount: enrichedOrder.total, category: 'Sales', branchId: enrichedOrder.branchId };
    setAccountingEntries((prev: AccountingEntry[]) => [newEntry, ...prev]);
    
    if (isFirstOrder) {
       addNotification('Loyalty Milestone', `New patron ${order.customerName || order.customerPhone} awarded 10 welcome points.`, 'SUCCESS');
    }
  };
  
  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
    const firstBranch = branches.find((b: any) => user.assignedBranchIds.includes(b.id)) || branches[0];
    setActiveBranch(firstBranch);
  };

  const impersonateStaff = (user: UserType) => { 
    setOriginalAdmin(currentUser);
    setCurrentUser(user); 
    const firstBranch = branches.find((b: any) => user.assignedBranchIds.includes(b.id)) || branches[0];
    setActiveBranch(firstBranch); 
    setActiveTab('pos'); 
  };

  const stopImpersonating = () => {
    if (originalAdmin) { setCurrentUser(originalAdmin); setOriginalAdmin(null); setActiveTab('staff'); } 
    else { setCurrentUser(null); }
  };

  if (!currentUser) return <LoginView onLogin={handleLogin} staff={staff} />;

  const renderContent = () => {
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.permissions && !currentUser.permissions.includes(activeTab)) {
       return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50/20">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6"><ShieldAlert size={40}/></div>
             <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Access Restricted</h3>
             <button onClick={() => setActiveTab('dashboard')} className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Return to Hub</button>
          </div>
       );
    }
    switch (activeTab) {
      case 'dashboard': return <DashboardView orders={orders} settings={settings} branches={branches} currentUser={currentUser} />;
      case 'pos': return <POSView branch={activeBranch} settings={settings} addOrder={addOrder} categories={categories} menuItems={menuItems} allAddons={addons} orders={orders} customerPointsMap={customerPointsMap} addNotification={addNotification} />;
      case 'orders': return <OrderHistoryView orders={orders} setOrders={setOrders} settings={settings} branches={branches} setAccountingEntries={setAccountingEntries} />;
      case 'wallet': return <WalletView currentUser={currentUser} withdrawalRequests={withdrawalRequests} setWithdrawalRequests={setWithdrawalRequests} settings={settings} addNotification={addNotification} />;
      case 'branches': return <BranchManagementView branches={branches} setBranches={setBranches} />;
      case 'inventory': return <InventoryView settings={settings} stockItems={stockItems} setStockItems={setStockItems} />;
      case 'menu': return <MenuSetupView settings={settings} categories={categories} setCategories={setCategories} menuItems={menuItems} setMenuItems={setMenuItems} addons={addons} setAddons={setAddons} branches={branches} />;
      case 'customers': return <CustomersView orders={orders} settings={settings} customerPointsMap={customerPointsMap} />;
      case 'staff': return <StaffManagementView staff={staff} setStaff={setStaff} branches={branches} impersonateStaff={impersonateStaff} settings={settings} withdrawalRequests={withdrawalRequests} setWithdrawalRequests={setWithdrawalRequests} accountingEntries={accountingEntries} setAccountingEntries={setAccountingEntries} addNotification={addNotification} orders={orders} />;
      case 'accounting': return <AccountingView settings={settings} entries={accountingEntries} setEntries={setAccountingEntries} withdrawalRequests={withdrawalRequests} setWithdrawalRequests={setWithdrawalRequests} staff={staff} />;
      case 'reports': return (
        <div className="p-4 lg:p-8 space-y-8 h-full overflow-y-auto pb-32 no-scrollbar bg-gray-50/20">
          <div className="flex justify-between items-center">
            <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest">Enterprise Analytics</h3>
          </div>
          <GlobalFilterBar 
            branches={branches}
            filterBranchId={filterBranchId} setFilterBranchId={setFilterBranchId}
            filterFrequency={filterFrequency} setFilterFrequency={setFilterFrequency}
            startDate={startDate} setStartDate={setStartDate}
            endDate={endDate} setEndDate={setEndDate}
          />
          <AdvancedReportingView 
            orders={orders} 
            branches={branches} 
            accountingEntries={accountingEntries} 
            menuItems={menuItems} 
            categories={categories} 
            settings={settings}
            filterBranchId={filterBranchId}
            filterFrequency={filterFrequency}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      );
      case 'settings': return <SettingsView settings={settings} setSettings={setSettings} branches={branches} setBranches={setBranches} orders={orders} setOrders={setOrders} accountingEntries={accountingEntries} setAccountingEntries={setAccountingEntries} staff={staff} setStaff={setStaff} menuItems={menuItems} setMenuItems={setMenuItems} stockItems={stockItems} setStockItems={setStockItems} categories={categories} setCategories={setCategories} addons={addons} setAddons={setAddons} withdrawalRequests={withdrawalRequests} setWithdrawalRequests={setWithdrawalRequests} />;
      default: return <DashboardView orders={orders} settings={settings} branches={branches} currentUser={currentUser} />;
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} settings={settings} currentUser={currentUser} onLogout={() => stopImpersonating()} />
      <main className="flex-1 lg:pl-64 flex flex-col h-full transition-all duration-300 relative overflow-hidden">
        <Header title={NAV_ITEMS.find(n => n.id === activeTab)?.label} toggleSidebar={toggleSidebar} activeBranch={activeBranch} setActiveBranch={setActiveBranch} branches={branches} currentUser={currentUser} notifications={notifications} markAllRead={markAllRead} />
        <div className="flex-1 overflow-hidden relative h-full">{renderContent()}</div>
      </main>
      <div className="fixed bottom-0 left-0 w-full lg:hidden bg-white/80 backdrop-blur-xl border-t px-6 py-2 flex justify-around items-center shadow-2xl z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-300'}`}><LayoutDashboard size={18} /><span className="text-[7px] font-black uppercase tracking-widest">Hub</span></button>
        <button onClick={() => setActiveTab('pos')} className={`p-3 rounded-[1.2rem] -mt-10 shadow-2xl ${activeTab === 'pos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}><ShoppingCart size={22} /></button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-300'}`}><Wallet size={18} /><span className="text-[7px] font-black uppercase tracking-widest">Wallet</span></button>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation-duration: 0.3s; animation-fill-mode: both; }
        .zoom-in { animation-name: zoom-in; }
      `}</style>
    </div>
  );
}
