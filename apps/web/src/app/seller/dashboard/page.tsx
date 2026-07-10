'use client';

import { useState, useEffect } from 'react';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  description: string;
  category: { name: string } | null;
  images: { url: string }[];
}

interface Order {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  customerName: string;
  shippingAddress: string;
  createdAt: string;
}

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  usageLimit: number | null;
  usedCount: number;
}

interface CustomerMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  reply: string | null;
  createdAt: string;
}

interface StoreSettings {
  storeName: string;
  storeLogo: string | null;
  storeBanner: string | null;
  description: string | null;
  contactInfo: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'inventory' | 'orders' | 'coupons' | 'messages' | 'settings'>('home');

  // Seller Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    productsSold: 0,
    activeProducts: 0,
    pendingOrders: 0,
    lowStockAlertsCount: 0,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [store, setStore] = useState<StoreSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal / Form States
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: '', usageLimit: '' });
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchSellerData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // 1. Dashboard Metrics
      const metrRes = await fetch(`${apiUrl}/api/seller/dashboard`);
      const metrData = await metrRes.json();
      if (metrData.success) setMetrics(metrData.data);

      // 2. Products
      const prodRes = await fetch(`${apiUrl}/api/seller/products`);
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data);

      // 3. Orders
      const ordRes = await fetch(`${apiUrl}/api/seller/orders`);
      const ordData = await ordRes.json();
      if (ordData.success) setOrders(ordData.data);

      // 4. Coupons
      const cpnRes = await fetch(`${apiUrl}/api/seller/coupons`);
      const cpnData = await cpnRes.json();
      if (cpnData.success) setCoupons(cpnData.data);

      // 5. Messages
      const msgRes = await fetch(`${apiUrl}/api/seller/messages`);
      const msgData = await msgRes.json();
      if (msgData.success) setMessages(msgData.data);

      // 6. Store Settings
      const storeRes = await fetch(`${apiUrl}/api/seller/store`);
      const storeData = await storeRes.json();
      if (storeData.success) setStore(storeData.data);

    } catch (err) {
      console.error('Error fetching seller workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const isNew = !editProduct.id;
      const url = isNew ? `${apiUrl}/api/seller/products` : `${apiUrl}/api/seller/products/${editProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const bodyContent = isNew
        ? {
            name: editProduct.name,
            description: editProduct.description,
            price: editProduct.price,
            stock: editProduct.stock,
            categoryName: 'Smart Bottles', // Default category
            imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
          }
        : editProduct;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyContent),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(isNew ? 'Product added successfully!' : 'Product details modified!');
        setShowProductForm(false);
        setEditProduct(null);
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/seller/products/${prodId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Product deleted from active catalog.');
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/seller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Order status updated to ${nextStatus}.`);
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/seller/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Discount coupon code generated!');
        setNewCoupon({ code: '', discountPercent: '', usageLimit: '' });
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplyMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessageId || !replyText.trim()) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/seller/messages/${replyMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Reply dispatched to customer email address!');
        setReplyMessageId(null);
        setReplyText('');
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/seller/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Store profiles and policies saved!');
        fetchSellerData();
      }
    } catch (err) {
      console.error(err);
    }
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

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        
        {/* Glow backdrop styling */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Global Toast Alert */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ y: -50, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -50, x: '-50%', opacity: 0 }}
              className="fixed top-24 left-1/2 z-50 px-5 py-3 rounded-full border border-indigo-500/30 bg-zinc-950/80 backdrop-blur text-xs text-white font-bold tracking-wider uppercase shadow-xl flex items-center gap-2"
            >
              <span className="text-indigo-400">✓</span> {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation Options */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Seller Central</h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-semibold block">
                  ShopSphere Merchant Account
                </span>
              </div>

              <div className="p-3 rounded-3xl border border-zinc-900 bg-zinc-950/20 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                {[
                  { id: 'home', label: 'Overview', icon: '📊' },
                  { id: 'products', label: 'Products Catalog', icon: '🛍️' },
                  { id: 'inventory', label: 'Inventory', icon: '📁' },
                  { id: 'orders', label: 'Order Pipeline', icon: '📦' },
                  { id: 'coupons', label: 'Discount Codes', icon: '🏷️' },
                  { id: 'messages', label: 'Client Messages', icon: '💬' },
                  { id: 'settings', label: 'Store Settings', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'home' | 'products' | 'inventory' | 'orders' | 'coupons' | 'messages' | 'settings')}
                    className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow shadow-indigo-500/10'
                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main tab viewer area */}
            <div className="lg:col-span-9 p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 min-h-[480px]">
              
              <AnimatePresence mode="wait">
                
                {/* 1. OVERVIEW / METRICS HOME */}
                {activeTab === 'home' && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Dashboard Home</span>
                      <h2 className="text-3xl font-black text-white mt-2 tracking-tight">MERCHANT WORKSPACE</h2>
                    </div>

                    {/* Sales Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Total Revenue</span>
                        <span className="text-xl font-black font-mono text-white mt-2 block">${metrics.totalRevenue.toFixed(2)}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Orders count</span>
                        <span className="text-xl font-black font-mono text-white mt-2 block">{metrics.totalOrders}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Smart Bottles Sold</span>
                        <span className="text-xl font-black font-mono text-white mt-2 block">{metrics.productsSold}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Active Catalog Items</span>
                        <span className="text-xl font-black font-mono text-white mt-2 block">{metrics.activeProducts}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Unresolved Orders</span>
                        <span className="text-xl font-black font-mono text-white mt-2 block">{metrics.pendingOrders}</span>
                      </div>

                      <div className={`p-5 rounded-2xl border ${metrics.lowStockAlertsCount > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-zinc-900 bg-zinc-950'}`}>
                        <span className="text-[9px] uppercase tracking-widest font-bold block text-zinc-500">Low Stock items</span>
                        <span className={`text-xl font-black font-mono mt-2 block ${metrics.lowStockAlertsCount > 0 ? 'text-red-400' : 'text-white'}`}>
                          {metrics.lowStockAlertsCount}
                        </span>
                      </div>

                    </div>

                    {/* Animated SVG revenue graph */}
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Monthly Sales Volume</h4>
                      <div className="h-48 w-full flex items-end gap-3 pt-6 border-b border-l border-zinc-900 pl-3">
                        {[12, 19, 31, 24, 48, 61, 40].map((val, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(val / 65) * 120}px` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-pink-500"
                            />
                            <span className="text-[8px] font-mono text-zinc-600">Month {idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 2. PRODUCT CATALOG CRUD */}
                {activeTab === 'products' && (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Catalog Manager</h2>
                      <button
                        onClick={() => {
                          setEditProduct({ name: '', price: 0, stock: 0, description: '' });
                          setShowProductForm(true);
                        }}
                        className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
                      >
                        + Add Product
                      </button>
                    </div>

                    {showProductForm && editProduct && (
                      <form onSubmit={handleSaveProduct} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-4 max-w-md">
                        <h3 className="text-xs font-bold text-white uppercase">{editProduct.id ? 'Edit Product' : 'Add New Product'}</h3>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Product Title"
                            value={editProduct.name || ''}
                            onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Price (USD)"
                            value={editProduct.price || ''}
                            onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Current Stock"
                            value={editProduct.stock || ''}
                            onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <textarea
                            placeholder="Description"
                            value={editProduct.description || ''}
                            onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white h-24 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowProductForm(false);
                              setEditProduct(null);
                            }}
                            className="flex-1 py-3 border border-zinc-800 rounded-xl bg-zinc-950 text-xs font-bold text-zinc-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-3 bg-indigo-600 rounded-xl text-xs font-bold text-white"
                          >
                            Save Product
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((prod) => (
                        <div key={prod.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex gap-4 items-center">
                          <div className="h-16 w-16 bg-zinc-950 rounded-xl border border-zinc-900 overflow-hidden flex items-center justify-center p-2 shrink-0">
                            <img
                              src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={prod.name}
                              className="h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white uppercase truncate">{prod.name}</h4>
                            <span className="block text-[9px] text-zinc-500 font-mono mt-1">
                              Price: ${prod.price.toFixed(2)} &bull; Stock: {prod.stock}
                            </span>
                            
                            <div className="mt-3 flex gap-3 text-[9px] font-mono text-zinc-600">
                              <button
                                onClick={() => {
                                  setEditProduct(prod);
                                  setShowProductForm(true);
                                }}
                                className="hover:text-white transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="hover:text-red-400 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. INVENTORY LEVELS */}
                {activeTab === 'inventory' && (
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Stock Allocation</h2>

                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] font-mono">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500">
                              <th className="py-3 uppercase font-bold">Model SKU</th>
                              <th className="py-3 uppercase font-bold text-center">Current Stock</th>
                              <th className="py-3 uppercase font-bold text-center">Status</th>
                              <th className="py-3 uppercase font-bold text-right">Quick Stock Addition</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {products.map((prod) => (
                              <tr key={prod.id} className="text-zinc-300">
                                <td className="py-3.5 uppercase font-bold text-white">{prod.name}</td>
                                <td className="py-3.5 text-center font-bold">{prod.stock} units</td>
                                <td className="py-3.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                                    prod.stock < 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}>
                                    {prod.stock < 5 ? 'Low Stock' : 'Good'}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="inline-flex gap-1">
                                    <button
                                      onClick={async () => {
                                        const nextStock = Math.max(0, prod.stock - 5);
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
                                        await fetch(`${apiUrl}/api/seller/products/${prod.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ stock: nextStock }),
                                        });
                                        fetchSellerData();
                                      }}
                                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-white rounded hover:bg-zinc-800"
                                    >
                                      -5
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const nextStock = prod.stock + 10;
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
                                        await fetch(`${apiUrl}/api/seller/products/${prod.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ stock: nextStock }),
                                        });
                                        fetchSellerData();
                                      }}
                                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-white rounded hover:bg-zinc-800"
                                    >
                                      +10
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. ORDER PIPELINE MANAGEMENT */}
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Order Pipeline</h2>

                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-3 text-[10px]">
                            <div>
                              <span className="block font-bold text-white uppercase">{order.orderNumber}</span>
                              <span className="block text-zinc-500 mt-0.5">Customer: {order.customerName}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-bold uppercase">
                                {order.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-zinc-500 leading-normal">
                            <p className="font-bold text-zinc-400">Destination Address:</p>
                            <p className="mt-0.5">{order.shippingAddress}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-zinc-900/60 text-[9px] font-mono">
                            <span className="font-bold text-white">${order.grandTotal.toFixed(2)}</span>
                            
                            <div className="flex gap-2">
                              {order.status === 'PENDING' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold"
                                >
                                  Process Order
                                </button>
                              )}
                              {order.status === 'PROCESSING' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold"
                                >
                                  Ship Package
                                </button>
                              )}
                              {order.status === 'SHIPPED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold"
                                >
                                  Mark Delivered
                                </button>
                              )}
                              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                  className="px-3 py-1 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. COUPONS MANAGER */}
                {activeTab === 'coupons' && (
                  <motion.div
                    key="coupons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column: Create Coupon */}
                    <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Generate Coupon</h3>
                      
                      <form onSubmit={handleCreateCoupon} className="space-y-3">
                        <input
                          type="text"
                          placeholder="PROMO CODE (e.g. EXTRA10)"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white uppercase"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Discount Percentage"
                          value={newCoupon.discountPercent}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Usage limit"
                          value={newCoupon.usageLimit}
                          onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-colors pt-3"
                        >
                          Generate
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Coupon list */}
                    <div className="lg:col-span-7 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Promotional Codes</h3>
                      
                      <div className="space-y-2">
                        {coupons.map((coupon) => (
                          <div key={coupon.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-[10px]">
                            <div>
                              <span className="font-bold text-white uppercase tracking-widest">{coupon.code}</span>
                              <span className="block text-[8px] text-zinc-500 mt-0.5">
                                Limit: {coupon.usageLimit || 'Unlimited'} &bull; Used: {coupon.usedCount}
                              </span>
                            </div>
                            <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                              {coupon.discountPercent}% Off
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. CLIENT MESSAGES INBOX */}
                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Queries Inbox</h2>

                    {replyMessageId && (
                      <form onSubmit={handleReplyMessage} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-3 max-w-md">
                        <h4 className="text-xs font-bold text-white uppercase">Send Reply to Customer</h4>
                        <textarea
                          placeholder="Type reply message..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white h-24"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyMessageId(null)}
                            className="flex-1 py-2 border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                          >
                            Send Email
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-3">
                          <div className="flex justify-between items-start text-[10px]">
                            <div>
                              <h4 className="font-bold text-white uppercase">{msg.subject}</h4>
                              <span className="block text-[8px] text-zinc-500 mt-0.5">
                                Sender: {msg.senderName} ({msg.senderEmail})
                              </span>
                            </div>
                            <span className="text-[8px] text-zinc-600 font-mono">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-[10px] text-zinc-400 leading-relaxed bg-zinc-950/20 p-3 rounded-lg border border-zinc-900/60">
                            {msg.message}
                          </p>

                          {msg.reply ? (
                            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] text-zinc-500 leading-relaxed pl-8 relative">
                              <span className="absolute left-3 top-3">↪</span>
                              <p className="font-bold text-zinc-400">Replied:</p>
                              <p className="mt-0.5">{msg.reply}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyMessageId(msg.id)}
                              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-[8px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
                            >
                              Reply Query
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 7. STORE PROFILE SETTINGS */}
                {activeTab === 'settings' && store && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Store Configurations</h2>

                    <form onSubmit={handleSaveStoreSettings} className="space-y-4 max-w-md">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Store Name</label>
                        <input
                          type="text"
                          value={store.storeName}
                          onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Logo URL</label>
                        <input
                          type="text"
                          value={store.storeLogo || ''}
                          onChange={(e) => setStore({ ...store, storeLogo: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Banner URL</label>
                        <input
                          type="text"
                          value={store.storeBanner || ''}
                          onChange={(e) => setStore({ ...store, storeBanner: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Description</label>
                        <textarea
                          value={store.description || ''}
                          onChange={(e) => setStore({ ...store, description: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none h-20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Shipping Policy</label>
                        <input
                          type="text"
                          value={store.shippingPolicy || ''}
                          onChange={(e) => setStore({ ...store, shippingPolicy: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Return Policy</label>
                        <input
                          type="text"
                          value={store.returnPolicy || ''}
                          onChange={(e) => setStore({ ...store, returnPolicy: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-colors pt-3"
                      >
                        Save Configurations
                      </button>

                    </form>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </div>

        </main>

        <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-xs text-zinc-500">
          <p>&copy; 2026 ShopSphere Aqua Inc. All rights reserved.</p>
        </footer>

      </div>
    </ScrollFoundation>
  );
}
