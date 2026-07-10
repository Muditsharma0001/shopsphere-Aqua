'use client';

import { useState, useEffect } from 'react';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';
import { useCartStore } from '../../store/useCartStore';
import { useThemeStore } from '../../store/useThemeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@shopsphere/shared-types';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  rewardPoints: number;
  membershipLevel: string;
}

interface Order {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  shippingMethod: string;
  createdAt: string;
  orderItems: any[];
}

interface Address {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  address: string;
  isDefault: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

interface Warranty {
  id: string;
  serialNumber: string;
  productModel: string;
  status: string;
  purchaseDate: string;
  activationDate: string;
}

export default function Dashboard() {
  const { theme, toggleTheme } = useThemeStore();
  const { cart, wishlist, moveToCart, toggleWishlist } = useCartStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'addresses' | 'wishlist' | 'notifications' | 'warranty' | 'settings'>('overview');

  // Dashboard Data States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Address Forms
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Warranty Form
  const [warrantySerial, setWarrantySerial] = useState('');
  const [warrantyModel, setWarrantyModel] = useState('Aqua Pro');

  const triggerAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchDashboardData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // 1. Fetch Profile
      const profRes = await fetch(`${apiUrl}/api/profile`);
      const profData = await profRes.json();
      if (profData.success) setProfile(profData.data);

      // 2. Fetch Orders
      if (profData.success && profData.data) {
        const ordRes = await fetch(`${apiUrl}/api/orders?userId=${profData.data.id}`);
        const ordData = await ordRes.json();
        if (ordData.success) setOrders(ordData.data);
      }

      // 3. Fetch Addresses
      const addrRes = await fetch(`${apiUrl}/api/addresses`);
      const addrData = await addrRes.json();
      if (addrData.success) setAddresses(addrData.data);

      // 4. Fetch Notifications
      const notifRes = await fetch(`${apiUrl}/api/notifications`);
      const notifData = await notifRes.json();
      if (notifData.success) setNotifications(notifData.data);

      // 5. Fetch Warranties
      const warRes = await fetch(`${apiUrl}/api/warranty`);
      const warData = await warRes.json();
      if (warData.success) setWarranties(warData.data);

    } catch (err) {
      console.error('Error fetching dashboard content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        triggerAlert('Profile credentials updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddress) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const isNew = !editAddress.id;
      const url = isNew ? `${apiUrl}/api/addresses` : `${apiUrl}/api/addresses/${editAddress.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAddress),
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert(isNew ? 'Address saved successfully!' : 'Address updated successfully!');
        setShowAddressForm(false);
        setEditAddress(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/addresses/${addrId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Address deleted successfully.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/notifications/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Marked all notifications as read.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantySerial.trim()) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/warranty/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: warrantySerial,
          productModel: warrantyModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Warranty certificate registered successfully!');
        setWarrantySerial('');
        fetchDashboardData();
      } else {
        triggerAlert(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadInvoice = (orderId: string, orderNumber: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    window.location.href = `${apiUrl}/api/orders/${orderId}/invoice`;
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
        
        {/* Ambient background glows */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Global Toast Alert */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              initial={{ y: -50, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -50, x: '-50%', opacity: 0 }}
              className="fixed top-24 left-1/2 z-50 px-5 py-3 rounded-full border border-indigo-500/30 bg-zinc-950/80 backdrop-blur text-xs text-white font-bold tracking-wider uppercase shadow-xl flex items-center gap-2"
            >
              <span className="text-indigo-400">✓</span> {alertMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation (Col-span 3) */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Profile Brief card */}
              {profile && (
                <div className="p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-indigo-400 mx-auto overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">{profile.name}</h3>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-semibold block mt-1">
                      {profile.membershipLevel} Member &bull; {profile.rewardPoints} Points
                    </span>
                  </div>
                </div>
              )}

              {/* Sidebar Tabs */}
              <div className="p-3 rounded-3xl border border-zinc-900 bg-zinc-950/20 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                {[
                  { id: 'overview', label: 'Dashboard', icon: '👤' },
                  { id: 'orders', label: 'Orders', icon: '📦' },
                  { id: 'profile', label: 'Profile', icon: '📝' },
                  { id: 'addresses', label: 'Address Book', icon: '🏠' },
                  { id: 'wishlist', label: 'Wishlist', icon: '🤍' },
                  { id: 'notifications', label: 'Notifications', icon: '🔔' },
                  { id: 'warranty', label: 'Warranty', icon: '🛡️' },
                  { id: 'settings', label: 'Settings', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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

            {/* Main tab viewer (Col-span 9) */}
            <div className="lg:col-span-9 p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 min-h-[480px]">
              
              <AnimatePresence mode="wait">
                
                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && profile && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Customer Portal</span>
                      <h2 className="text-3xl font-black text-white mt-2 tracking-tight">WELCOME BACK, {profile.name.split(' ')[0].toUpperCase()}</h2>
                    </div>

                    {/* Dashboard Metrics grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">📦</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Total Orders</span>
                        <span className="block text-xl font-black text-white font-mono mt-1">{orders.length}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">🤍</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Saved Wishlist</span>
                        <span className="block text-xl font-black text-white font-mono mt-1">{wishlist.length}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">🛡️</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Warranty Certs</span>
                        <span className="block text-xl font-black text-white font-mono mt-1">{warranties.length}</span>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                        <span className="text-2xl">💎</span>
                        <span className="block text-[8px] text-zinc-500 font-mono tracking-wider font-semibold uppercase mt-2">Aqua Points</span>
                        <span className="block text-xl font-black text-white font-mono mt-1">{profile.rewardPoints}</span>
                      </div>

                    </div>

                    {/* Recent activity list */}
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Recent Activity</h4>
                      <div className="divide-y divide-zinc-900 space-y-3">
                        {orders.slice(0, 2).map((order, idx) => (
                          <div key={idx} className="pt-3 flex justify-between text-[10px] items-center">
                            <div>
                              <span className="font-bold text-white uppercase">Order Placed</span>
                              <span className="block text-[8px] text-zinc-500 mt-0.5">Reference: {order.orderNumber}</span>
                            </div>
                            <span className="font-bold text-white">${order.grandTotal.toFixed(2)}</span>
                          </div>
                        ))}
                        {warranties.slice(0, 1).map((war, idx) => (
                          <div key={idx} className="pt-3 flex justify-between text-[10px] items-center">
                            <div>
                              <span className="font-bold text-white uppercase">Warranty Registered</span>
                              <span className="block text-[8px] text-zinc-500 mt-0.5">Serial: {war.serialNumber}</span>
                            </div>
                            <span className="text-indigo-400 font-bold uppercase tracking-wider text-[8px]">{war.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 2. ORDERS */}
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Order History</h2>

                    {orders.length === 0 ? (
                      <p className="text-xs text-zinc-500">You have no matching order details in PostgreSQL.</p>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
                              <div>
                                <span className="block text-xs font-bold text-white uppercase">{order.orderNumber}</span>
                                <span className="block text-[8px] text-zinc-500 mt-0.5">
                                  Placed: {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
                                  {order.status}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>

                            {/* Order Items list */}
                            <div className="divide-y divide-zinc-900">
                              {order.orderItems?.map((item: any, idx: number) => (
                                <div key={idx} className="py-2.5 flex justify-between text-[10px]">
                                  <div>
                                    <span className="font-bold text-white uppercase">{item.productName}</span>
                                    <span className="block text-[8px] text-zinc-500 mt-0.5">{item.color} &bull; {item.capacity}</span>
                                  </div>
                                  <span className="font-mono text-zinc-400">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            {/* Subtotals download */}
                            <div className="flex justify-between items-baseline pt-2 border-t border-zinc-900">
                              <div className="text-[10px]">
                                <span className="text-zinc-500">Paid:</span>{' '}
                                <span className="font-black text-white">${order.grandTotal.toFixed(2)}</span>
                              </div>
                              
                              <button
                                onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                                className="px-3.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-[8px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                              >
                                Download Invoice
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. PROFILE */}
                {activeTab === 'profile' && profile && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Profile Credentials</h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Full Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Phone Number</label>
                        <input
                          type="text"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Avatar URL</label>
                        <input
                          type="text"
                          value={profile.avatarUrl || ''}
                          onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value || null })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                          placeholder="https://image-url"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-colors pt-3"
                      >
                        Save Changes
                      </button>

                    </form>
                  </motion.div>
                )}

                {/* 4. ADDRESS BOOK */}
                {activeTab === 'addresses' && (
                  <motion.div
                    key="addresses"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Address Book</h2>
                      <button
                        onClick={() => {
                          setEditAddress({
                            fullName: '',
                            phone: '',
                            email: '',
                            country: 'India',
                            state: '',
                            city: '',
                            zip: '',
                            address: '',
                            isDefault: false,
                          });
                          setShowAddressForm(true);
                        }}
                        className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
                      >
                        + Add Address
                      </button>
                    </div>

                    {showAddressForm && editAddress && (
                      <form onSubmit={handleSaveAddress} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-4 max-w-md">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={editAddress.fullName}
                            onChange={(e) => setEditAddress({ ...editAddress, fullName: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Phone"
                            value={editAddress.phone}
                            onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={editAddress.email}
                            onChange={(e) => setEditAddress({ ...editAddress, email: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={editAddress.zip}
                            onChange={(e) => setEditAddress({ ...editAddress, zip: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={editAddress.city}
                            onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={editAddress.state}
                            onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Street Address"
                            value={editAddress.address}
                            onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })}
                            className="col-span-2 w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="defaultAddressCheck"
                            checked={editAddress.isDefault}
                            onChange={(e) => setEditAddress({ ...editAddress, isDefault: e.target.checked })}
                          />
                          <label htmlFor="defaultAddressCheck" className="text-[10px] text-zinc-500 font-medium">Set as default address</label>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditAddress(null);
                            }}
                            className="flex-1 py-3 border border-zinc-800 rounded-xl bg-zinc-950 text-xs font-bold text-zinc-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-3 bg-indigo-600 rounded-xl text-xs font-bold text-white"
                          >
                            Save Address
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 relative">
                          {addr.isDefault && (
                            <span className="absolute top-4 right-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Default
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-white uppercase">{addr.fullName}</h4>
                          <div className="text-[10px] text-zinc-500 mt-2 space-y-0.5 leading-relaxed">
                            <p>{addr.address}</p>
                            <p>{addr.city}, {addr.state} - {addr.zip}</p>
                            <p>Phone: {addr.phone}</p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-zinc-900/60 flex gap-4 text-[9px] font-mono text-zinc-600">
                            <button
                              onClick={() => {
                                setEditAddress(addr);
                                setShowAddressForm(true);
                              }}
                              className="hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id!)}
                              className="hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. WISHLIST */}
                {activeTab === 'wishlist' && (
                  <motion.div
                    key="wishlist"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Your Saved Wishlist</h2>

                    {wishlist.length === 0 ? (
                      <p className="text-xs text-zinc-500">Your wishlist is empty. Browse collections to bookmark items.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {wishlist.map((product) => {
                          const imgUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                          return (
                            <div key={product.id} className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 text-center">
                              <div className="h-28 w-auto bg-zinc-950 rounded-xl border border-zinc-900 flex items-center justify-center p-3 overflow-hidden">
                                <img src={imgUrl} alt={product.name} className="h-full object-contain" />
                              </div>
                              <h4 className="text-[11px] font-bold text-white uppercase mt-3 tracking-wide">{product.name}</h4>
                              <span className="text-[10px] text-zinc-500 font-semibold block mt-1">${product.price.toFixed(2)}</span>
                              
                              <div className="mt-4 pt-3 border-t border-zinc-900/60 flex gap-2">
                                <button
                                  onClick={() => toggleWishlist(product)}
                                  className="flex-1 py-1.5 text-[8px] font-bold uppercase rounded-lg border border-zinc-900 text-zinc-500 hover:text-white"
                                >
                                  Remove
                                </button>
                                <button
                                  onClick={() => {
                                    moveToCart(product);
                                    triggerAlert('Moved product to cart!');
                                  }}
                                  className="flex-1 py-1.5 text-[8px] font-bold uppercase rounded-lg bg-indigo-600 text-white"
                                >
                                  + Cart
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 6. NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Notifications Center</h2>
                      <button
                        onClick={handleMarkNotificationsRead}
                        className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider hover:underline"
                      >
                        Mark All Read
                      </button>
                    </div>

                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-xl border flex justify-between items-start gap-4 transition-all ${
                            notif.isRead
                              ? 'border-zinc-900/50 bg-zinc-950/20 text-zinc-500'
                              : 'border-indigo-500/20 bg-zinc-950/60 text-white shadow shadow-indigo-500/2'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />}
                              <h4 className="text-xs font-bold uppercase tracking-wide">{notif.title}</h4>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 7. WARRANTY */}
                {activeTab === 'warranty' && (
                  <motion.div
                    key="warranty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Register Bottle Warranty</h2>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                        Activate your lifetime computational thermal container warranty. Register by inputting the serial code on the base of your bottle.
                      </p>
                    </div>

                    <form onSubmit={handleRegisterWarranty} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 max-w-md space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Serial Number</label>
                        <input
                          type="text"
                          placeholder="e.g. AQUA-PRO-890A-XYZ"
                          value={warrantySerial}
                          onChange={(e) => setWarrantySerial(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white uppercase focus:outline-none focus:border-indigo-500/50"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Product Model</label>
                        <select
                          value={warrantyModel}
                          onChange={(e) => setWarrantyModel(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="Aqua Pro">ShopSphere Aqua Pro</option>
                          <option value="Aqua Slim">ShopSphere Aqua Slim</option>
                          <option value="Aqua Lite">ShopSphere Aqua Lite</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-colors"
                      >
                        Activate Lifetime Warranty
                      </button>
                    </form>

                    {/* Active registrations */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">Registered Warranties</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {warranties.map((war) => (
                          <div key={war.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 relative">
                            <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {war.status}
                            </span>
                            <h4 className="text-xs font-bold text-white uppercase">{war.productModel}</h4>
                            <p className="text-[9px] font-mono text-zinc-500 mt-2">Serial: {war.serialNumber}</p>
                            <p className="text-[9px] text-zinc-600 mt-1">
                              Activated: {new Date(war.activationDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 8. SETTINGS */}
                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Account Settings</h2>

                    <div className="divide-y divide-zinc-900 space-y-4">
                      
                      {/* Theme toggle setting row */}
                      <div className="flex justify-between items-center py-4">
                        <div>
                          <span className="block text-xs font-bold text-white uppercase">Visual Interface Theme</span>
                          <span className="block text-[9px] text-zinc-500 mt-1">Select your preferred color profile.</span>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
                        >
                          {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
                        </button>
                      </div>

                      {/* Currency Settings */}
                      <div className="flex justify-between items-center py-4">
                        <div>
                          <span className="block text-xs font-bold text-white uppercase">Display Currency</span>
                          <span className="block text-[9px] text-zinc-500 mt-1">Select currency values.</span>
                        </div>
                        <select className="bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2 text-xs text-white focus:outline-none">
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>

                      {/* Account deletion warning */}
                      <div className="flex justify-between items-center py-4">
                        <div>
                          <span className="block text-xs font-bold text-red-400 uppercase">Danger Zone</span>
                          <span className="block text-[9px] text-zinc-600 mt-1">Permanently remove user credentials from database logs.</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Permanently delete your ShopSphere credentials? This action is irreversible.')) {
                              alert('Sandbox account deleted. Redirecting to home...');
                              window.location.href = '/';
                            }
                          }}
                          className="px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20"
                        >
                          Delete Account
                        </button>
                      </div>

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
