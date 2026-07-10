'use client';

import { useState, useEffect } from 'react';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  isSuspended: boolean;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isApproved: boolean;
  isFeatured: boolean;
  category: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Order {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  customerName: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'sellers' | 'products' | 'categories' | 'orders'>('home');

  // Metrics States
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    ordersCount: 0,
    activeUsers: 0,
    activeSellers: 0,
    totalProducts: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    recentActivity: [] as { description: string; time: string }[],
  });

  const [users, setUsers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Forms
  const [searchUser, setSearchUser] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchAdminData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // 1. Metrics Overview
      const metrRes = await fetch(`${apiUrl}/api/admin/dashboard`);
      const metrData = await metrRes.json();
      if (metrData.success) setMetrics(metrData.data);

      // 2. Users
      const userRes = await fetch(`${apiUrl}/api/admin/users`);
      const userData = await userRes.json();
      if (userData.success) setUsers(userData.data);

      // 3. Sellers
      const sellRes = await fetch(`${apiUrl}/api/admin/sellers`);
      const sellData = await sellRes.json();
      if (sellData.success) setSellers(sellData.data);

      // 4. Products
      const prodRes = await fetch(`${apiUrl}/api/admin/products`);
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data);

      // 5. Categories
      const catRes = await fetch(`${apiUrl}/api/admin/categories`);
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.data);

      // 6. Orders
      const ordRes = await fetch(`${apiUrl}/api/admin/orders`);
      const ordData = await ordRes.json();
      if (ordData.success) setOrders(ordData.data);

    } catch (err) {
      console.error('Error fetching admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUserStatus = async (userId: string, updates: Partial<User>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('User status updated successfully.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('User deleted from database.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProductStatus = async (prodId: string, updates: Partial<Product>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/admin/products/${prodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Product credentials updated.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/admin/products/${prodId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Product deleted successfully.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const isNew = !editingCategory;
      const url = isNew ? `${apiUrl}/api/admin/categories` : `${apiUrl}/api/admin/categories/${editingCategory.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(isNew ? 'Category created!' : 'Category updated!');
        setNewCategoryName('');
        setEditingCategory(null);
        fetchAdminData();
      } else {
        triggerToast(data.message || 'Action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Delete this category shelf?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/admin/categories/${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Category deleted successfully.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));

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
        
        {/* Glow styling */}
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
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Enterprise Admin</h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-semibold block">
                  ShopSphere Root Portal
                </span>
              </div>

              <div className="p-3 rounded-3xl border border-zinc-900 bg-zinc-950/20 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                {[
                  { id: 'home', label: 'Analytics Home', icon: '📊' },
                  { id: 'users', label: 'User Accounts', icon: '👥' },
                  { id: 'sellers', label: 'Seller Stores', icon: '🏪' },
                  { id: 'products', label: 'Products Shelf', icon: '🛍' },
                  { id: 'categories', label: 'Categories Shelves', icon: '📁' },
                  { id: 'orders', label: 'Audit Orders', icon: '📦' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main tab viewer */}
            <div className="lg:col-span-9 p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 min-h-[480px]">
              
              <AnimatePresence mode="wait">
                
                {/* 1. ANALYTICS HOME */}
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
                      <h2 className="text-3xl font-black text-white mt-2 tracking-tight">PLATFORM OVERVIEW</h2>
                    </div>

                    {/* Analytics grids */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Gross Revenue</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">${metrics.totalRevenue.toFixed(2)}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Today Revenue</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">${metrics.todayRevenue.toFixed(2)}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Orders Resolved</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">{metrics.ordersCount}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Conversion rate</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">{metrics.conversionRate}%</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Active Customers</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">{metrics.activeUsers}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Active Merchants</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">{metrics.activeSellers}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Products Catalog</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">{metrics.totalProducts}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Avg Order Value</span>
                        <span className="text-lg font-black font-mono text-white mt-2 block">${metrics.averageOrderValue.toFixed(2)}</span>
                      </div>

                    </div>

                    {/* Audit Activity center logs */}
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">System Audit logs</h4>
                      <div className="divide-y divide-zinc-900 space-y-3">
                        {metrics.recentActivity.map((act, idx) => (
                          <div key={idx} className="pt-3 flex justify-between text-[9px] items-center">
                            <span className="text-zinc-300 font-bold uppercase">{act.description}</span>
                            <span className="text-zinc-600 font-mono">{new Date(act.time).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 2. USER MODERATION LIST */}
                {activeTab === 'users' && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">User Accounts Moderation</h2>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2 text-xs text-white max-w-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase">{user.name}</h4>
                            <span className="block text-[8px] font-mono text-zinc-500 mt-1">
                              Email: {user.email} &bull; Role: {user.role}
                            </span>
                            <div className="mt-2 flex gap-2">
                              {user.isBanned && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-bold uppercase">
                                  Banned
                                </span>
                              )}
                              {user.isSuspended && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold uppercase">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 text-[9px] font-mono">
                            <button
                              onClick={() => handleUpdateUserStatus(user.id, { isSuspended: !user.isSuspended })}
                              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white"
                            >
                              {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleUpdateUserStatus(user.id, { isBanned: !user.isBanned })}
                              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white"
                            >
                              {user.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. SELLER MANAGEMENT */}
                {activeTab === 'sellers' && (
                  <motion.div
                    key="sellers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Merchant Outlets</h2>

                    <div className="space-y-4">
                      {sellers.map((seller) => (
                        <div key={seller.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-[10px]">
                          <div>
                            <h4 className="font-bold text-white uppercase">{seller.name}</h4>
                            <span className="block text-[8px] text-zinc-500 mt-0.5">Email: {seller.email}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateUserStatus(seller.id, { isSuspended: !seller.isSuspended })}
                              className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-colors ${
                                seller.isSuspended
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-zinc-800 text-zinc-500 hover:text-white'
                              }`}
                            >
                              {seller.isSuspended ? 'Approve Seller' : 'Suspend'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 4. PRODUCT MODERATION */}
                {activeTab === 'products' && (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Products Catalog Moderation</h2>

                    <div className="space-y-4">
                      {products.map((prod) => (
                        <div key={prod.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px]">
                          <div>
                            <h4 className="font-bold text-white uppercase">{prod.name}</h4>
                            <span className="block text-[8px] text-zinc-500 mt-1">
                              Price: ${prod.price.toFixed(2)} &bull; Stock: {prod.stock}
                            </span>
                            <div className="mt-2 flex gap-2">
                              {prod.isFeatured && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-bold uppercase">
                                  Featured
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                prod.isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {prod.isApproved ? 'Approved' : 'Suspended'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateProductStatus(prod.id, { isApproved: !prod.isApproved })}
                              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white"
                            >
                              {prod.isApproved ? 'Suspend' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleUpdateProductStatus(prod.id, { isFeatured: !prod.isFeatured })}
                              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white"
                            >
                              {prod.isFeatured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. CATEGORIES MANAGER */}
                {activeTab === 'categories' && (
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Create Category form */}
                    <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        {editingCategory ? 'Edit Category Shelf' : 'Add Category Shelf'}
                      </h3>
                      
                      <form onSubmit={handleSaveCategory} className="space-y-3">
                        <input
                          type="text"
                          placeholder="Category Title (e.g. Sports Bottles)"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                          required
                        />
                        <div className="flex gap-2 pt-2">
                          {editingCategory && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(null);
                                setNewCategoryName('');
                              }}
                              className="flex-1 py-3 border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-500 rounded-xl"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-colors pt-3"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Categories listing */}
                    <div className="lg:col-span-7 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Category Shelves</h3>
                      
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <div key={cat.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-[10px]">
                            <div>
                              <span className="font-bold text-white uppercase tracking-widest">{cat.name}</span>
                              <span className="block text-[8px] text-zinc-500 mt-0.5">Slug: {cat.slug}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setNewCategoryName(cat.name);
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 text-zinc-400"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="px-2 py-1 bg-zinc-900 border border-red-500/25 rounded hover:bg-red-500/10 text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. ORDERS AUDIT */}
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">System Orders Pipeline</h2>

                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-3 text-[10px]">
                          <div className="flex justify-between items-center text-[10px] border-b border-zinc-900 pb-2">
                            <div>
                              <span className="font-bold text-white uppercase">{order.orderNumber}</span>
                              <span className="block text-zinc-500 mt-0.5">Placed: {new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-bold uppercase">
                              {order.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline pt-2">
                            <span className="text-zinc-500">Total Volume:</span>
                            <span className="font-bold text-white font-mono">${order.grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
