'use client';

import { useState, useEffect } from 'react';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

interface Store {
  id: string;
  name: string;
  manager: string;
  location: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: string;
  inventoryCount: number;
}

interface SalesReport {
  period: string;
  totalSales: number;
  topProduct: string;
  targetMet: boolean;
}

interface EnterpriseData {
  stores: Store[];
  employees: Employee[];
  warehouses: Warehouse[];
  salesReports: SalesReport[];
  customerInsights: {
    retentionRate: string;
    npsScore: number;
    totalSubscribers: number;
    activeUsersGrowth: string;
  };
  financialReports: {
    grossProfit: string;
    netMargin: string;
    operationalCost: string;
    marketingSpend: string;
  };
  productPerformance: {
    model: string;
    marketShare: string;
    unitCost: number;
    price: number;
  }[];
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
}

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'employees' | 'warehouses' | 'analytics' | 'inventory' | 'settings'>('overview');
  const [data, setData] = useState<EnterpriseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states for adding items
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');
  const [newStoreManager, setNewStoreManager] = useState('');

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchEnterpriseData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // 1. Verify Authentication & Role
      const profRes = await fetch(`${apiUrl}/api/profile`);
      const profData = await profRes.json();
      
      if (!profData.success || profData.data?.role !== 'ENTERPRISE') {
        setForbidden(true);
        setLoading(false);
        return;
      }

      // 2. Fetch Enterprise analytics
      const entRes = await fetch(`${apiUrl}/api/enterprise/dashboard`);
      const entData = await entRes.json();
      if (entData.success) {
        setData(entData.data);
      }
    } catch (err) {
      console.error('Error loading enterprise dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    const newStore: Store = {
      id: `store-${Date.now()}`,
      name: newStoreName,
      location: newStoreLocation,
      manager: newStoreManager,
      status: 'Active',
    };

    setData({
      ...data,
      stores: [...data.stores, newStore],
    });

    triggerToast(`Store "${newStoreName}" registered successfully!`);
    setNewStoreName('');
    setNewStoreLocation('');
    setNewStoreManager('');
    setShowAddStore(false);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName,
      role: newEmpRole,
      department: newEmpDept,
      email: newEmpEmail,
    };

    setData({
      ...data,
      employees: [...data.employees, newEmp],
    });

    triggerToast(`Employee ${newEmpName} registered successfully!`);
    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpDept('');
    setNewEmpEmail('');
    setShowAddEmployee(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 animate-pulse">
          <span className="text-2xl font-black text-white">S</span>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#030304] flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">🔒</span>
        <h1 className="text-3xl font-black tracking-tight text-white mt-6 uppercase">403 Forbidden Access</h1>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm">
          Your profile credentials do not have the required corporate privileges to access this Enterprise Dashboard.
        </p>
        <button
          onClick={() => window.location.href = '/portal'}
          className="mt-8 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-widest transition-all"
        >
          Return to Portal Gateway
        </button>
      </div>
    );
  }

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        {/* Glow meshes */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Global Toast */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ y: -50, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -50, x: '-50%', opacity: 0 }}
              className="fixed top-24 left-1/2 z-50 px-5 py-3 rounded-full border border-indigo-500/30 bg-zinc-950/80 backdrop-blur text-xs text-white font-bold tracking-wider uppercase shadow-xl"
            >
              <span className="text-indigo-400 mr-2">✓</span> {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation (3 columns) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Enterprise Admin</h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-semibold block">
                  Corporate HQ Hub
                </span>
              </div>

              <div className="p-3 rounded-3xl border border-zinc-900 bg-zinc-950/20 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                {[
                  { id: 'overview', label: 'Corporate Overview', icon: '📊' },
                  { id: 'stores', label: 'Retail Outlets', icon: '🏪' },
                  { id: 'employees', label: 'Personnel', icon: '👥' },
                  { id: 'warehouses', label: 'Logistics Depot', icon: '📦' },
                  { id: 'analytics', label: 'Sales Reports', icon: '📈' },
                  { id: 'inventory', label: 'Global Stock', icon: '📁' },
                  { id: 'settings', label: 'HQ Settings', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main tab viewer (9 columns) */}
            <div className="lg:col-span-9 p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 min-h-[500px] shadow-2xl">
              <AnimatePresence mode="wait">
                
                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && data && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Corporate Control</span>
                      <h2 className="text-3xl font-black text-white mt-2 tracking-tight">GLOBAL OPERATIONS OVERVIEW</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">🏪</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Active Stores</span>
                        <span className="block text-xl font-black text-white mt-1">{data.stores.length}</span>
                      </div>
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">👥</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Team Personnel</span>
                        <span className="block text-xl font-black text-white mt-1">{data.employees.length}</span>
                      </div>
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">📦</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Warehouses</span>
                        <span className="block text-xl font-black text-white mt-1">{data.warehouses.length}</span>
                      </div>
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">💎</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Product Lines</span>
                        <span className="block text-xl font-black text-white mt-1">{data.totalProducts}</span>
                      </div>
                    </div>

                    {/* Financial Summary cards */}
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Financial Indicators</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                          <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Gross Profit</span>
                          <span className="block text-lg font-black text-white font-mono mt-1">{data.financialReports.grossProfit}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                          <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Net Margin</span>
                          <span className="block text-lg font-black text-emerald-400 font-mono mt-1">{data.financialReports.netMargin}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                          <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Operational Cost</span>
                          <span className="block text-lg font-black text-zinc-400 font-mono mt-1">{data.financialReports.operationalCost}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. STORES */}
                {activeTab === 'stores' && data && (
                  <motion.div
                    key="stores"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Corporate Retail Outlets</h2>
                      <button
                        onClick={() => setShowAddStore(!showAddStore)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        {showAddStore ? 'Cancel' : 'Register Store'}
                      </button>
                    </div>

                    {showAddStore && (
                      <form onSubmit={handleAddStore} className="p-5 rounded-2xl border border-indigo-500/20 bg-zinc-950/40 space-y-4 max-w-md">
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Store Title</label>
                          <input
                            type="text"
                            placeholder="e.g. HydraFlow Chicago"
                            value={newStoreName}
                            onChange={(e) => setNewStoreName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Michigan Ave, Chicago"
                            value={newStoreLocation}
                            onChange={(e) => setNewStoreLocation(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Manager</label>
                          <input
                            type="text"
                            placeholder="e.g. John Miller"
                            value={newStoreManager}
                            onChange={(e) => setNewStoreManager(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer"
                        >
                          Confirm Store Registration
                        </button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {data.stores.map((store) => (
                        <div key={store.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-white uppercase tracking-wide">{store.name}</h4>
                            <span className="block text-[8px] text-zinc-500 mt-1">Location: {store.location} &bull; Manager: {store.manager}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase">
                            {store.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. EMPLOYEES */}
                {activeTab === 'employees' && data && (
                  <motion.div
                    key="employees"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Personnel Directory</h2>
                      <button
                        onClick={() => setShowAddEmployee(!showAddEmployee)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        {showAddEmployee ? 'Cancel' : 'Hire Employee'}
                      </button>
                    </div>

                    {showAddEmployee && (
                      <form onSubmit={handleAddEmployee} className="p-5 rounded-2xl border border-indigo-500/20 bg-zinc-950/40 space-y-4 max-w-md">
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Employee Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Thomas Shelby"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Corporate Role</label>
                          <input
                            type="text"
                            placeholder="e.g. Regional Supervisor"
                            value={newEmpRole}
                            onChange={(e) => setNewEmpRole(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Department</label>
                          <input
                            type="text"
                            placeholder="e.g. Operations"
                            value={newEmpDept}
                            onChange={(e) => setNewEmpDept(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Work Email</label>
                          <input
                            type="email"
                            placeholder="thomas@shopsphere.com"
                            value={newEmpEmail}
                            onChange={(e) => setNewEmpEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer"
                        >
                          Confirm Hire
                        </button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {data.employees.map((emp) => (
                        <div key={emp.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-white uppercase tracking-wide">{emp.name}</h4>
                            <span className="block text-[8px] text-zinc-500 mt-1">Role: {emp.role} &bull; Dept: {emp.department}</span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400">{emp.email}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 4. WAREHOUSES */}
                {activeTab === 'warehouses' && data && (
                  <motion.div
                    key="warehouses"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Logistics & Supply Warehouses</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {data.warehouses.map((wh) => (
                        <div key={wh.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-3">
                          <span className="text-2xl">🏭</span>
                          <div>
                            <h4 className="font-bold text-white uppercase text-[11px]">{wh.name}</h4>
                            <span className="block text-[8px] text-zinc-500 mt-0.5">{wh.location}</span>
                          </div>
                          <div className="border-t border-zinc-900 pt-2 flex justify-between text-[9px] font-mono text-zinc-400">
                            <span>Capacity:</span>
                            <span className="text-white font-bold">{wh.capacity}</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                            <span>Inventory:</span>
                            <span className="text-white font-bold">{wh.inventoryCount.toLocaleString()} units</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. ANALYTICS */}
                {activeTab === 'analytics' && data && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Financial & Sales Audit Reports</h2>
                    
                    <div className="space-y-4">
                      {data.salesReports.map((report, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-white uppercase tracking-wider">{report.period} Reports</h4>
                            <span className="block text-[8px] text-zinc-500 mt-1">Top Selling Model: {report.topProduct}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-mono text-white font-bold">${report.totalSales.toLocaleString()}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${report.targetMet ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {report.targetMet ? 'Target Achieved' : 'Below Projection'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 6. INVENTORY */}
                {activeTab === 'inventory' && data && (
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Product Performance Matrix</h2>
                    
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                      <div className="divide-y divide-zinc-900">
                        {data.productPerformance.map((prod, i) => (
                          <div key={i} className="py-4 flex justify-between items-center text-xs">
                            <div>
                              <h4 className="font-bold text-white uppercase tracking-wider">{prod.model}</h4>
                              <span className="block text-[8px] text-zinc-500 mt-1">Market Segment Share: {prod.marketShare}</span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="block text-white">Price: ${prod.price}</span>
                              <span className="block text-[8px] text-zinc-500">Unit Cost: ${prod.unitCost}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 7. SETTINGS */}
                {activeTab === 'settings' && data && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Enterprise Hub Profile Settings</h2>
                    
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-6 max-w-md">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Company Registry Name</label>
                        <input
                          type="text"
                          defaultValue="HydraFlow Operations Inc."
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Primary Business Region</label>
                        <select className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
                          <option value="US">North America (US/CA)</option>
                          <option value="EU">European Union (EU)</option>
                          <option value="AS">Asia-Pacific (APAC)</option>
                        </select>
                      </div>

                      <button
                        onClick={() => triggerToast('Corporate hq profiles saved.')}
                        className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        Save Configurations
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
          </div>
        </main>
      </div>
    </ScrollFoundation>
  );
}
