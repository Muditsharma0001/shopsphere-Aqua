'use client';

import { useState, useEffect } from 'react';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

interface BusinessData {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
  warehouses: { id: string; name: string; location: string; stock: number; status: string }[];
  lowStockAlerts: { id: string; name: string; stock: number; status: string }[];
  integrations: { id: string; name: string; status: string; key: string }[];
  sessions: { id: string; device: string; location: string; active: boolean; time: string }[];
  backups: { id: string; name: string; time: string; size: string }[];
  homepageSections: { id: string; name: string; visible: boolean; position: number }[];
  systemLogs: { time: string; type: string; message: string }[];
}

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form mock states for modules
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponsList, setCouponsList] = useState<{ code: string; discount: string }[]>([
    { code: 'AQUA10', discount: '10%' },
    { code: 'HYDROVIP', discount: '20%' }
  ]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string }[]>([
    { id: 'key-1', name: 'Frontend Client Read', key: 'hf_live_pk_••••••••••••' }
  ]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchBusinessData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const profRes = await fetch(`${apiUrl}/api/profile`);
      const profData = await profRes.json();
      
      if (!profData.success || profData.data?.role !== 'BUSINESS_OWNER') {
        setForbidden(true);
        setLoading(false);
        return;
      }

      const busRes = await fetch(`${apiUrl}/api/business/dashboard`);
      const busData = await busRes.json();
      if (busData.success) {
        setData(busData.data);
      }
    } catch (err) {
      console.error('Error fetching business OS analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponsList([...couponsList, { code: couponCode.toUpperCase(), discount: `${couponDiscount}%` }]);
    triggerToast(`Coupon "${couponCode.toUpperCase()}" generated!`);
    setCouponCode('');
    setCouponDiscount('');
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt) return;
    setAiGenerating(true);
    setAiResult('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Generate description or marketing text for: ${aiPrompt}` }),
      });
      const resData = await res.json();
      if (resData.success) {
        setAiResult(resData.data);
      } else {
        setAiResult('Error generating description. Model is offline.');
      }
    } catch (err) {
      setAiResult('AI Offline fallback simulation: Smart bottle details parsed.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const newKey = {
      id: `key-${Date.now()}`,
      name: newApiKeyName,
      key: `hf_live_sk_${Math.random().toString(36).substr(2, 12)}••••`,
    };
    setApiKeys([...apiKeys, newKey]);
    triggerToast(`API Key "${newApiKeyName}" generated!`);
    setNewApiKeyName('');
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
          Your credentials do not contain authorization to manage the Business Operating System.
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

  const menuTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', category: 'HQ Control' },
    { id: 'products', label: 'Product Studio', icon: '🛍️', category: 'Catalog' },
    { id: 'bottle', label: 'Bottle Configurator', icon: '🎨', category: 'Catalog' },
    { id: 'media', label: 'Media Library', icon: '🖼️', category: 'Assets' },
    { id: 'animation', label: '3D Animation Studio', icon: '🎞️', category: 'Assets' },
    { id: 'builder', label: 'Website Builder', icon: '🧱', category: 'CMS' },
    { id: 'content', label: 'Content Studio', icon: '✍️', category: 'CMS' },
    { id: 'orders', label: 'Orders Pipeline', icon: '📦', category: 'Operations' },
    { id: 'inventory', label: 'Inventory', icon: '🏬', category: 'Operations' },
    { id: 'crm', label: 'Customer CRM', icon: '👥', category: 'Operations' },
    { id: 'marketing', label: 'Marketing Center', icon: '📣', category: 'Growth' },
    { id: 'ai', label: 'AI Studio (Gemini)', icon: '✨', category: 'Growth' },
    { id: 'analytics', label: 'Analytics Center', icon: '📈', category: 'Growth' },
    { id: 'finance', label: 'Finance', icon: '💰', category: 'Growth' },
    { id: 'brand', label: 'Brand Settings', icon: '🎗️', category: 'HQ Settings' },
    { id: 'integrations', label: 'Integrations', icon: '🔌', category: 'HQ Settings' },
    { id: 'security', label: 'Security', icon: '🛡️', category: 'HQ Settings' },
    { id: 'settings', label: 'System Settings', icon: '⚙️', category: 'HQ Settings' },
  ];

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        <Navbar />

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

        <div className="max-w-7xl mx-auto px-4 pt-32 pb-24 relative z-20 flex gap-8">
          
          {/* Collapse/Navigation Sidebar */}
          <div className="w-64 shrink-0 space-y-6">
            <div className="p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Business OS</h3>
              <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-semibold block mt-1">
                ShopSphere Operations Control
              </span>
            </div>

            {/* Sidebar Tab Lists */}
            <div className="p-3 rounded-3xl border border-zinc-900 bg-zinc-950/20 space-y-4">
              {['HQ Control', 'Catalog', 'Assets', 'CMS', 'Operations', 'Growth', 'HQ Settings'].map((cat) => (
                <div key={cat} className="space-y-1">
                  <span className="block text-[8px] font-bold text-zinc-600 uppercase tracking-widest px-4">{cat}</span>
                  {menuTabs.filter((t) => t.category === cat).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full px-4 py-2.5 rounded-xl text-left text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-900/30'
                      }`}
                    >
                      <span>{tab.icon}</span> {tab.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Business OS Content Area */}
          <div className="flex-1 p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 min-h-[600px] shadow-2xl">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && data && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Executive Corporate Analytics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold font-mono">Gross Volume</span>
                      <span className="text-xl font-black text-white font-mono mt-1 block">${data.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold font-mono">Total Orders</span>
                      <span className="text-xl font-black text-white font-mono mt-1 block">{data.totalOrders}</span>
                    </div>
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold font-mono">Product Models</span>
                      <span className="text-xl font-black text-white font-mono mt-1 block">{data.totalProducts}</span>
                    </div>
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold font-mono">Conversion Rate</span>
                      <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{data.conversionRate}%</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Top Selling Collections</h3>
                    <div className="space-y-3">
                      {data.topProducts.map((prod) => (
                        <div key={prod.id} className="flex justify-between items-center text-xs border-b border-zinc-900 pb-2">
                          <span className="text-zinc-300 font-bold uppercase">{prod.name}</span>
                          <span className="font-mono text-zinc-400">{prod.sales} Units &bull; ${prod.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. PRODUCT STUDIO */}
              {activeTab === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Product Studio Editor</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Quick Catalog Actions</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                        <span className="text-xs text-white uppercase font-bold">Standard Price Models</span>
                        <button onClick={() => triggerToast('Price variants parsed.')} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-[9px] uppercase tracking-wider font-bold hover:bg-zinc-900 text-zinc-400 cursor-pointer">Configure</button>
                      </div>
                      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                        <span className="text-xs text-white uppercase font-bold">Active Warranty Keys</span>
                        <button onClick={() => triggerToast('Warranty policies fetched.')} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-[9px] uppercase tracking-wider font-bold hover:bg-zinc-900 text-zinc-400 cursor-pointer">Configure</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. BOTTLE CONFIGURATOR */}
              {activeTab === 'bottle' && (
                <motion.div
                  key="bottle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Bottle configurator studio</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4 max-w-md">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Asset Specifications Upload</span>
                    <input type="file" className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
                    <button onClick={() => triggerToast('3D configuration uploaded.')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer">Preview Build</button>
                  </div>
                </motion.div>
              )}

              {/* 4. MEDIA LIBRARY */}
              {activeTab === 'media' && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Corporate Media Library</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Asset_1.jpg', 'Bottle_Cap_Render.png', 'Tech_Breakdown.mp4', 'Bottle_exploded.glb'].map((file, i) => (
                      <div key={i} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-center">
                        <span className="block text-[10px] text-white uppercase font-bold truncate">{file}</span>
                        <span className="block text-[8px] text-zinc-500 mt-1 font-mono">Cloudinary Store</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 5. ANIMATION STUDIO */}
              {activeTab === 'animation' && (
                <motion.div
                  key="animation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">3D Animation Sequence Controller</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4 max-w-md">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Scroll Speed Pin Duration</span>
                    <input type="range" className="w-full bg-zinc-900" />
                    <button onClick={() => triggerToast('GSAP timelines updated.')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer">Publish Speed</button>
                  </div>
                </motion.div>
              )}

              {/* 6. WEBSITE BUILDER */}
              {activeTab === 'builder' && data && (
                <motion.div
                  key="builder"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Website Builder layout controls</h2>
                  <div className="space-y-2">
                    {data.homepageSections.map((sec) => (
                      <div key={sec.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-xs">
                        <span className="font-bold text-white uppercase">{sec.name}</span>
                        <button onClick={() => triggerToast(`Section ${sec.name} updated.`)} className="text-[9px] font-mono text-zinc-500 hover:text-indigo-400">Position: {sec.position} &bull; Visible: {sec.visible ? 'YES' : 'NO'}</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 7. CONTENT STUDIO */}
              {activeTab === 'content' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Corporate Content & Blogs Editor</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                    <textarea placeholder="Write blog or sustainability policy markdown copy here..." className="w-full h-32 bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white" />
                    <button onClick={() => triggerToast('Content policy updated.')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer">Publish Content</button>
                  </div>
                </motion.div>
              )}

              {/* 8. ORDERS */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Global Orders Pipelines</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Pending (4)', 'Shipping (2)', 'Delivered (15)'].map((col, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 text-center">
                        <span className="font-bold text-white uppercase text-xs">{col}</span>
                        <span className="block text-[8px] text-zinc-500 mt-2">Ready to dispatch</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 9. INVENTORY */}
              {activeTab === 'inventory' && data && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Warehousing Stock Monitors</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.warehouses.map((wh) => (
                      <div key={wh.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40">
                        <span className="block text-xs font-bold text-white uppercase">{wh.name}</span>
                        <span className="block text-[9px] text-zinc-500 mt-1 font-mono">Stock level: {wh.stock} &bull; Location: {wh.location}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 10. CRM */}
              {activeTab === 'crm' && (
                <motion.div
                  key="crm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Customer Lifetime Audit Logs</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Customer One</span>
                      <span className="font-mono text-zinc-500">LTV: $450 &bull; Notes: Active Subscriber</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 11. MARKETING */}
              {activeTab === 'marketing' && (
                <motion.div
                  key="marketing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Coupons & Campaigns</h2>
                  <form onSubmit={handleCreateCoupon} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4 max-w-sm">
                    <input placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white" required />
                    <input placeholder="Discount %" value={couponDiscount} onChange={(e) => setCouponDiscount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white" required />
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer">Generate Code</button>
                  </form>

                  <div className="space-y-2">
                    {couponsList.map((c, i) => (
                      <div key={i} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex justify-between text-xs font-mono">
                        <span className="text-white font-bold">{c.code}</span>
                        <span className="text-emerald-400">{c.discount} OFF</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 12. AI STUDIO */}
              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Gemini AI Studio Copilot</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                    <textarea placeholder="e.g. Generate a SEO meta copy for Smart bottle catalog description..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full h-24 bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white" />
                    <button onClick={handleGenerateAi} disabled={aiGenerating} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer disabled:opacity-50">
                      {aiGenerating ? 'AI Sync Generating...' : 'Run Gemini Engine'}
                    </button>
                    {aiResult && (
                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 text-xs leading-relaxed text-zinc-300 font-mono">
                        {aiResult}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 13. ANALYTICS CENTER */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Traffic Devices Funnels</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 text-center">
                    <span className="text-zinc-500 text-xs">Device segment breakdowns (Mobile: 65% / Desktop: 30%) loaded.</span>
                  </div>
                </motion.div>
              )}

              {/* 14. FINANCE */}
              {activeTab === 'finance' && (
                <motion.div
                  key="finance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Corporate Financial Ledger</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Estimated Tax Due</span>
                      <span className="text-lg font-mono font-black text-white mt-1 block">$12,450.00</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Operational Payouts</span>
                      <span className="text-lg font-mono font-black text-white mt-1 block">Scheduled: 15th July</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 15. BRAND SETTINGS */}
              {activeTab === 'brand' && (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Identity Typography Brand Palettes</h2>
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4 max-w-sm">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Palette Theme</label>
                      <select className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white">
                        <option>Default Space Black (#030304)</option>
                        <option>Aurora Blue Glass</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 16. INTEGRATIONS */}
              {activeTab === 'integrations' && data && (
                <motion.div
                  key="integrations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">External Platform Integrations</h2>
                  <div className="space-y-3">
                    {data.integrations.map((int) => (
                      <div key={int.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-white uppercase">{int.name}</h4>
                          <span className="block text-[8px] text-zinc-500 mt-1 font-mono">{int.key}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase">
                          {int.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 17. SECURITY */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Roles Permissions API Keys</h2>
                  <form onSubmit={handleCreateApiKey} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4 max-w-sm">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Generate Secret API Key</span>
                    <input placeholder="Key Description (e.g. Sales webhook)" value={newApiKeyName} onChange={(e) => setNewApiKeyName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white" required />
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[8px] font-bold uppercase tracking-widest text-white cursor-pointer">Generate Token</button>
                  </form>

                  <div className="space-y-2">
                    {apiKeys.map((k) => (
                      <div key={k.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex justify-between text-xs font-mono">
                        <span className="text-white font-bold">{k.name}</span>
                        <span className="text-zinc-500">{k.key}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 18. SYSTEM SETTINGS */}
              {activeTab === 'settings' && data && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Environment Maintenance Backups</h2>
                  
                  <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center max-w-md">
                    <div>
                      <span className="block text-xs font-bold text-white uppercase">Maintenance Mode Lock</span>
                      <span className="block text-[8px] text-zinc-500 mt-1">Bypass requests with header key authorization</span>
                    </div>
                    <button onClick={() => { setMaintenanceMode(!maintenanceMode); triggerToast(`Maintenance mode toggled: ${!maintenanceMode ? 'ACTIVE' : 'INACTIVE'}`); }} className={`px-4 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest cursor-pointer ${maintenanceMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>
                      {maintenanceMode ? 'LOCKED' : 'UNLOCKED'}
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Database Backups Logs</h3>
                    <div className="divide-y divide-zinc-900">
                      {data.backups.map((b) => (
                        <div key={b.id} className="py-3 flex justify-between text-xs font-mono">
                          <span className="text-zinc-300">{b.name}</span>
                          <span className="text-zinc-500">{b.time} &bull; {b.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>
    </ScrollFoundation>
  );
}
