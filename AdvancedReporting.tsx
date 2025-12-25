
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Target, Briefcase, Layers, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Activity, Percent,
  CreditCard, Package, Building2, ClipboardList
} from 'lucide-react';
import { Order, OrderStatus, Branch, AccountingEntry, MenuItem, Category, PaymentMethod } from './types';

// 🔹 REPORTING FEATURE START

interface AdvancedReportingProps {
  orders: Order[];
  branches: Branch[];
  accountingEntries: AccountingEntry[];
  menuItems: MenuItem[];
  categories: Category[];
  settings: any;
  filterBranchId: string;
  filterFrequency: string;
  startDate: string;
  endDate: string;
}

const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export const AdvancedReportingView: React.FC<AdvancedReportingProps> = ({ 
  orders, 
  branches, 
  accountingEntries, 
  menuItems, 
  categories, 
  settings,
  filterBranchId,
  filterFrequency,
  startDate,
  endDate
}) => {

  // Data Processor: Aggregates metrics based on filters
  const analytics = useMemo(() => {
    // 1. Filter Orders
    const filteredOrders = orders.filter((o) => {
      if (filterBranchId !== 'ALL' && o.branchId !== filterBranchId) return false;
      const orderDate = new Date(o.createdAt);
      if (filterFrequency === 'DAILY' && orderDate.toDateString() !== new Date().toDateString()) return false;
      if (filterFrequency === 'CUSTOM') {
        if (startDate && orderDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
      return true;
    });

    // 2. Filter Accounting (Expenses)
    const filteredEntries = accountingEntries.filter((e) => {
      if (filterBranchId !== 'ALL' && e.branchId !== filterBranchId) return false;
      const entryDate = new Date(e.date);
      if (filterFrequency === 'DAILY' && entryDate.toDateString() !== new Date().toDateString()) return false;
      if (filterFrequency === 'CUSTOM') {
        if (startDate && entryDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (entryDate > end) return false;
        }
      }
      return true;
    });

    // 3. Financial KPIs
    const revenue = filteredOrders
      .filter(o => o.status !== OrderStatus.CANCELLED)
      .reduce((acc, o) => acc + o.total, 0);
    
    const expenses = filteredEntries
      .filter(e => e.type === 'EXPENSE')
      .reduce((acc, e) => acc + e.amount, 0);

    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // 4. Payment Method Distribution
    const paymentData = Object.values(PaymentMethod).map(method => {
      const value = filteredOrders
        .filter(o => o.status !== OrderStatus.CANCELLED && o.paymentMethod === method)
        .reduce((acc, o) => acc + o.total, 0);
      return { name: method, value };
    }).filter(p => p.value > 0);

    // 5. Product Performance
    const productStats: Record<string, { name: string, qty: number, revenue: number }> = {};
    filteredOrders.filter(o => o.status !== OrderStatus.CANCELLED).forEach(o => {
      o.items.forEach(item => {
        if (!productStats[item.menuItemId]) {
          productStats[item.menuItemId] = { name: item.name, qty: 0, revenue: 0 };
        }
        productStats[item.menuItemId].qty += item.quantity;
        productStats[item.menuItemId].revenue += (item.unitPrice * item.quantity);
      });
    });
    const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // 6. Branch Comparison
    const branchStats = branches.map(b => {
      const bRev = filteredOrders
        .filter(o => o.status !== OrderStatus.CANCELLED && o.branchId === b.id)
        .reduce((acc, o) => acc + o.total, 0);
      const bExp = filteredEntries
        .filter(e => e.type === 'EXPENSE' && e.branchId === b.id)
        .reduce((acc, e) => acc + e.amount, 0);
      return { name: b.name, revenue: bRev, profit: bRev - bExp };
    });

    return {
      revenue,
      expenses,
      netProfit,
      profitMargin,
      paymentData,
      topProducts,
      branchStats,
      orderCount: filteredOrders.length
    };
  }, [orders, branches, accountingEntries, filterBranchId, filterFrequency, startDate, endDate]);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* 🔹 KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={`${settings.currencySymbol}${analytics.revenue.toLocaleString()}`} 
          icon={<DollarSign size={20}/>} 
          color="blue"
          subText={`${analytics.orderCount} Successful Orders`}
        />
        <KPICard 
          title="Operating Expenses" 
          value={`${settings.currencySymbol}${analytics.expenses.toLocaleString()}`} 
          icon={<TrendingDown size={20}/>} 
          color="rose"
          subText="Outbound Cashflow"
        />
        <KPICard 
          title="Net Liquidity" 
          value={`${settings.currencySymbol}${analytics.netProfit.toLocaleString()}`} 
          icon={<Activity size={20}/>} 
          color={analytics.netProfit >= 0 ? "emerald" : "rose"}
          subText="Bottom-line Performance"
        />
        <KPICard 
          title="Profit Margin" 
          value={`${analytics.profitMargin.toFixed(1)}%`} 
          icon={<Percent size={20}/>} 
          color="purple"
          subText="Efficiency Index"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🔹 PRIMARY TREND: Revenue vs Expense */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Fiscal Performance Trend</h4>
              <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">Comprehensive Node Tracking</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600"></div><span className="text-[9px] font-black uppercase text-gray-400">Revenue</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-400"></div><span className="text-[9px] font-black uppercase text-gray-400">Profit</span></div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.branchStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[10, 10, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="profit" stroke="#fb7185" strokeWidth={3} dot={{ r: 4, fill: '#fb7185' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔹 PAYMENT CHANNEL DISTRIBUTION */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Payment Velocity</h4>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {analytics.paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: 'bold'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {analytics.paymentData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                   <span className="text-gray-500">{item.name}</span>
                 </div>
                 <span className="text-gray-900">{settings.currencySymbol}{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 🔹 PRODUCT PERFORMANCE LEADERBOARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Top Yielding Offerings</h4>
          <div className="space-y-4">
            {analytics.topProducts.map((p, idx) => (
              <div key={p.name} className="group p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-blue-600 text-xs">#{idx+1}</div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{p.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{p.qty} Units Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{settings.currencySymbol}{p.revenue.toLocaleString()}</p>
                  <div className="h-1 w-20 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{width: `${(p.revenue / analytics.topProducts[0].revenue) * 100}%`}}
                    />
                  </div>
                </div>
              </div>
            ))}
            {analytics.topProducts.length === 0 && (
              <div className="py-20 flex flex-col items-center opacity-20"><Package size={40}/><p className="text-[10px] font-black uppercase mt-2">No Sales Data</p></div>
            )}
          </div>
        </div>

        {/* 🔹 FORENSIC BRANCH SUMMARY */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Branch Forensic Audit</h4>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="pb-4">Branch Node</th>
                   <th className="pb-4 text-right">Gross Sales</th>
                   <th className="pb-4 text-right">Net Yield</th>
                   <th className="pb-4 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {analytics.branchStats.map(b => (
                   <tr key={b.name} className="group hover:bg-gray-50/50 transition-colors">
                     <td className="py-5">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={14}/></div>
                           <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{b.name}</span>
                        </div>
                     </td>
                     <td className="py-5 text-right font-black text-xs text-gray-900">{settings.currencySymbol}{b.revenue.toLocaleString()}</td>
                     <td className={`py-5 text-right font-black text-xs ${b.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {settings.currencySymbol}{b.profit.toLocaleString()}
                     </td>
                     <td className="py-5 text-right">
                        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${b.profit > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {b.profit > 0 ? 'Optimal' : 'Distressed'}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'rose' | 'purple';
  subText: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subText }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all duration-500">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-[1.5rem] ${colorClasses[color]} border shadow-inner group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="bg-gray-50 p-2 rounded-xl">
           <ArrowUpRight size={14} className="text-gray-300"/>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
        <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{subText}</p>
      </div>
    </div>
  );
};

// 🔹 REPORTING FEATURE END
