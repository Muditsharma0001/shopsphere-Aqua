'use client';

import { useState, useEffect, useRef } from 'react';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  category: string;
  brand: string;
  images: string[];
  status: 'Published' | 'Draft' | 'Archived';
  rating: number;
  totalSales: number;
  lastUpdated: string;
  createdAt: string;
}

export default function BusinessProductsShelf() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtering
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all'); // all, low, out

  // Editing Side Drawer Overlay
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editStatus, setEditStatus] = useState<'Published' | 'Draft' | 'Archived'>('Published');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // Verify profile role
      const profRes = await fetch(`${apiUrl}/api/profile`, { credentials: 'include' });
      const profData = await profRes.json();
      
      if (!profData.success || profData.data?.role !== 'BUSINESS_OWNER') {
        setForbidden(true);
        setLoading(false);
        return;
      }

      // Fetch products list
      const prodRes = await fetch(`${apiUrl}/api/business/products`, { credentials: 'include' });
      const prodData = await prodRes.json();
      if (prodData.success) {
        setProducts(prodData.data);
      }
    } catch (err) {
      console.error('Fetch business products shelf error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Live Suggestions logic
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }
    const filtered = products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((p) => p.name)
      .slice(0, 5);
    setSuggestions(filtered);
  }, [searchQuery, products]);

  // Bulk operations handler
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedIds.length === 0) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products/bulk-${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast(resData.message || 'Operation succeeded.');
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (err) {
      console.error('Bulk action error:', err);
    }
  };

  // Single Actions
  const handleSingleDelete = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast('Product deleted successfully.');
        fetchProducts();
      }
    } catch (err) {
      console.error('Single delete error:', err);
    }
  };

  const handleSinglePublishToggle = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'Published' ? 'unpublish' : 'publish';
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products/bulk-${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast(`Product ${action}ed successfully.`);
        fetchProducts();
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      // Mock integration updating local state instantly to prove responsiveness
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? { ...p, name: editName, price: editPrice, stock: editStock, status: editStatus }
            : p
        )
      );
      triggerToast('Product details saved successfully.');
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `copy-${Date.now()}`,
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`,
      createdAt: new Date().toISOString(),
    };
    setProducts([duplicated, ...products]);
    triggerToast(`Duplicated "${prod.name}"`);
  };

  // Processing metrics calculation
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'Published').length;
  const draftProducts = products.filter((p) => p.status === 'Draft').length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const totalInventoryVal = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  // Sorting & Filtering logic applied dynamically
  const categoriesList = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchStock =
        filterStock === 'all' ||
        (filterStock === 'out' && p.stock === 0) ||
        (filterStock === 'low' && p.stock > 0 && p.stock <= 10);

      return matchSearch && matchCategory && matchStatus && matchStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'stock') comparison = a.stock - b.stock;
      else if (sortBy === 'sales') comparison = a.totalSales - b.totalSales;
      else if (sortBy === 'rating') comparison = a.rating - b.rating;

      return sortOrder === 'asc' ? comparison : -comparison;
    });

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

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative flex">
        {/* Glow meshes */}
        <div className="absolute top-[10%] left-[20%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />

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

        {/* Sidebar Nav */}
        <div className="w-64 border-r border-zinc-900 bg-zinc-950/20 p-6 space-y-8 shrink-0 min-h-screen pt-36">
          <div className="space-y-4">
            <span className="block text-[8px] font-bold text-zinc-600 uppercase tracking-widest px-4">Workspace</span>
            <Link href="/business/dashboard" className="w-full px-4 py-2.5 rounded-xl text-left text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-3 text-zinc-500 hover:text-white hover:bg-zinc-900/30">
              📊 Corporate OS
            </Link>
            <Link href="/business/products" className="w-full px-4 py-2.5 rounded-xl text-left text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-3 bg-indigo-600 text-white shadow-lg shadow-indigo-500/10">
              🛍️ Product Shelf
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 pt-36 pb-32">
          <Navbar />

          <div className="space-y-8">
            {/* Header info */}
            <div>
              <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Product Library</span>
              <h1 className="text-3xl font-black text-white mt-2 tracking-tight uppercase">Corporate Product Shelf</h1>
            </div>

            {/* Statistics Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Total Models', count: totalProducts, icon: '🛍️' },
                { label: 'Published', count: publishedProducts, icon: '🟢' },
                { label: 'Drafts', count: draftProducts, icon: '🟡' },
                { label: 'Out of Stock', count: outOfStock, icon: '🔴', alert: outOfStock > 0 },
                { label: 'Low Stock', count: lowStock, icon: '⚠️', alert: lowStock > 0 },
                { label: 'Best Sellers', count: products.filter((p) => p.totalSales > 150).length, icon: '🔥' },
                { label: 'Total Value', count: `$${totalInventoryVal.toLocaleString()}`, icon: '💰' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 flex flex-col justify-between min-h-[90px]">
                  <span className="text-lg">{stat.icon}</span>
                  <div>
                    <span className="block text-[7px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                    <span className={`block text-xs font-black mt-1 ${stat.alert ? 'text-red-400' : 'text-white'}`}>{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters Toolbar */}
            <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              
              {/* Search input with live suggestion drop down */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Instant SKU, category, name search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 font-mono"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-zinc-900 bg-zinc-950 p-2 shadow-2xl space-y-1">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSearchQuery(sug); setShowSuggestions(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 rounded text-[10px] text-zinc-400 hover:text-white truncate uppercase font-bold"
                      >
                        🔍 {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles and selects */}
              <div className="flex flex-wrap items-center gap-3">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="all">Categories (All)</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="all">Status (All)</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>

                <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="all">Stock Levels (All)</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="sales">Sort by Sales</option>
                  <option value="rating">Sort by Rating</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-zinc-900 rounded-xl hover:bg-zinc-900 text-xs cursor-pointer"
                  title="Toggle Sort Order"
                >
                  {sortOrder === 'asc' ? '▲' : '▼'}
                </button>

                {/* View Mode Toggle */}
                <div className="flex bg-zinc-950 border border-zinc-900 rounded-xl p-1 shrink-0">
                  {['grid', 'list', 'table'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m as any)}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        viewMode === m ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Checkbox Select All indicator */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center gap-3 px-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredProducts.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filteredProducts.map((p) => p.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded border-zinc-900 bg-zinc-950"
                />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Select All Listed ({filteredProducts.length})</span>
              </div>
            )}

            {/* Layout viewer viewport */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center border border-zinc-900 rounded-3xl bg-zinc-950/20">
                <span className="text-3xl block">🔍</span>
                <p className="text-zinc-500 text-xs mt-3 uppercase tracking-wider font-bold">No products match your active search filters.</p>
              </div>
            ) : (
              <div>
                {/* 1. GRID VIEW */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((prod) => (
                      <motion.div
                        key={prod.id}
                        layout
                        className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 flex flex-col justify-between min-h-[360px] group relative hover:border-indigo-500/30 transition-all duration-300"
                      >
                        {/* Checkbox selection indicator */}
                        <div className="absolute top-4 left-4 z-30">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(prod.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, prod.id]);
                              else setSelectedIds(selectedIds.filter((id) => id !== prod.id));
                            }}
                            className="rounded border-zinc-900 bg-zinc-950 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-4">
                          {/* Image preview */}
                          <div className="h-40 rounded-xl bg-zinc-950 border border-zinc-900 overflow-hidden relative">
                            {prod.images[0] ? (
                              <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                            )}
                            <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              prod.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {prod.status}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-1">
                            <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-semibold block">{prod.sku} &bull; {prod.category}</span>
                            <h3 className="font-black text-white text-xs uppercase tracking-wider truncate">{prod.name}</h3>
                            <span className="block font-mono text-xs font-bold text-white">${prod.price.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Actions lists */}
                        <div className="border-t border-zinc-900 pt-4 mt-4 grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setEditName(prod.name);
                              setEditPrice(prod.price);
                              setEditStock(prod.stock);
                              setEditStatus(prod.status);
                            }}
                            className="py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer text-center"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSinglePublishToggle(prod.id, prod.status)}
                            className="py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer text-center"
                          >
                            {prod.status === 'Published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDuplicate(prod)}
                            className="py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer text-center"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleSingleDelete(prod.id)}
                            className="py-2 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-center"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 2. LIST VIEW */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredProducts.map((prod) => (
                      <motion.div
                        key={prod.id}
                        layout
                        className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-500/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(prod.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, prod.id]);
                              else setSelectedIds(selectedIds.filter((id) => id !== prod.id));
                            }}
                            className="rounded border-zinc-900 bg-zinc-950 cursor-pointer"
                          />
                          <div className="h-14 w-14 rounded-lg bg-zinc-950 border border-zinc-900 overflow-hidden shrink-0">
                            {prod.images[0] && <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-white uppercase text-xs truncate max-w-xs">{prod.name}</h4>
                            <span className="block text-[8px] text-zinc-500 mt-1 font-mono">{prod.sku} &bull; {prod.category} &bull; Stock: {prod.stock}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                          <span className="font-mono font-bold text-white text-xs">${prod.price.toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            prod.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {prod.status}
                          </span>
                          <button
                            onClick={() => handleSinglePublishToggle(prod.id, prod.status)}
                            className="px-3 py-1.5 rounded-lg border border-zinc-800 text-[8px] font-bold uppercase tracking-wider hover:bg-zinc-900 text-zinc-400 cursor-pointer"
                          >
                            Toggle Status
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 3. TABLE VIEW */}
                {viewMode === 'table' && (
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 overflow-x-auto">
                    <table className="w-full text-[10px] text-left text-zinc-400 border-collapse">
                      <thead className="bg-zinc-950 border-b border-zinc-900 text-zinc-500 uppercase tracking-widest text-[8px] font-black">
                        <tr>
                          <th className="px-6 py-4"></th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">SKU</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Sales</th>
                          <th className="px-6 py-4">Rating</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="px-6 py-3.5">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(prod.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedIds([...selectedIds, prod.id]);
                                  else setSelectedIds(selectedIds.filter((id) => id !== prod.id));
                                }}
                                className="rounded border-zinc-900 bg-zinc-950 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-3.5 font-bold text-white uppercase">{prod.name}</td>
                            <td className="px-6 py-3.5 font-mono">{prod.sku}</td>
                            <td className="px-6 py-3.5 uppercase">{prod.category}</td>
                            <td className="px-6 py-3.5 font-mono text-white font-bold">${prod.price.toFixed(2)}</td>
                            <td className="px-6 py-3.5 font-mono">{prod.stock}</td>
                            <td className="px-6 py-3.5 font-mono">{prod.totalSales}</td>
                            <td className="px-6 py-3.5 font-mono text-amber-400">★ {prod.rating.toFixed(1)}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                prod.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {prod.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Bulk Actions sliding drawer footer */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-indigo-500/30 bg-zinc-950/90 backdrop-blur px-6 py-4 flex items-center gap-6 shadow-2xl"
            >
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                Selected: <span className="text-white font-black">{selectedIds.length} items</span>
              </span>
              <div className="h-4 border-l border-zinc-800" />
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                <button onClick={() => handleBulkAction('publish')} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">Publish</button>
                <button onClick={() => handleBulkAction('unpublish')} className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 cursor-pointer">Unpublish</button>
                <button onClick={() => handleBulkAction('delete')} className="px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer">Delete</button>
                <button onClick={() => { setSelectedIds([]); triggerToast('Bulk selections cleared.'); }} className="px-3.5 py-2 text-zinc-500 hover:text-zinc-300 cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit side drawer overlay */}
        <AnimatePresence>
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingProduct(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                className="w-96 bg-zinc-950 border-l border-zinc-900 p-8 space-y-6 relative z-10 overflow-y-auto"
              >
                <div>
                  <span className="text-indigo-400 text-[8px] font-bold uppercase tracking-[0.2em]">Product Studio Overlay</span>
                  <h3 className="text-lg font-black text-white uppercase mt-1 tracking-tight">Edit catalog details</h3>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Product Title</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Catalog Price ($)</label>
                    <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(parseFloat(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Warehouse Stock</label>
                    <input type="number" value={editStock} onChange={(e) => setEditStock(parseInt(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest cursor-pointer">Save catalog</button>
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 rounded-xl font-bold text-[9px] uppercase tracking-widest cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ScrollFoundation>
  );
}
