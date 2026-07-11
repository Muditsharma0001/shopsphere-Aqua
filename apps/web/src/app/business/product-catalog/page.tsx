'use client';

import { useState, useEffect } from 'react';
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
  collection?: string;
  images: string[];
  status: 'Published' | 'Draft' | 'Archived';
  rating: number;
  totalSales: number;
  isFeatured: boolean;
  lastUpdated: string;
  createdAt: string;
  
  // Advanced tech specs
  colors?: string;
  capacity?: string;
  material?: string;
  specifications?: string;
  warranty?: string;
  
  // Media & Assets
  gltfModelUrl?: string;
  jpgAnimationPath?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  tags?: string;
}

export default function BusinessProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtering
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all'); // all, low, out

  // Active Modals & Overlay Drawers
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTab, setEditTab] = useState<'general' | 'details' | 'specs' | 'media' | 'seo'>('general');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [deleteConfirmProd, setDeleteConfirmProd] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [mediaProduct, setMediaProduct] = useState<Product | null>(null);
  const [viewingAnalyticsProd, setViewingAnalyticsProd] = useState<Product | null>(null);
  const [viewingInventoryProd, setViewingInventoryProd] = useState<Product | null>(null);

  // Bulk dialog inputs
  const [showDiscountPrompt, setShowDiscountPrompt] = useState(false);
  const [bulkDiscountVal, setBulkDiscountVal] = useState('10');
  const [showMoveCatPrompt, setShowMoveCatPrompt] = useState(false);
  const [bulkCatName, setBulkCatName] = useState('Smart Bottles');
  const [showMoveCollPrompt, setShowMoveCollPrompt] = useState(false);
  const [bulkCollName, setBulkCollName] = useState('Summer Series');

  // Create Form States
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('Smart Bottles');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Edit Form States (Richer fields)
  const [editName, setEditName] = useState('');
  const [editSKU, setEditSKU] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editCompareAtPrice, setEditCompareAtPrice] = useState<number | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [editCategory, setEditCategory] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCollection, setEditCollection] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'Published' | 'Draft' | 'Archived'>('Published');
  const [editColors, setEditColors] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editMaterial, setEditMaterial] = useState('');
  const [editSpecs, setEditSpecs] = useState('');
  const [editWarranty, setEditWarranty] = useState('');
  const [editGltf, setEditGltf] = useState('');
  const [editJpgAnim, setEditJpgAnim] = useState('');
  const [editMetaTitle, setEditMetaTitle] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editTags, setEditTags] = useState('');

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
      console.error('Fetch business products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Suggestions
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

  // Create Product in DB
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          price: parseFloat(newPrice),
          stock: parseInt(newStock) || 0,
          categoryName: newCategory,
          description: newDesc,
          imageUrls: newImageUrl ? [newImageUrl] : ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80']
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast(`Product "${newName}" successfully created!`);
        setShowCreateDrawer(false);
        setNewName('');
        setNewPrice('');
        setNewStock('');
        setNewDesc('');
        setNewImageUrl('');
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Product Form Trigger
  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditSKU(prod.sku || '');
    setEditPrice(prod.price);
    setEditCompareAtPrice(prod.compareAtPrice);
    setEditStock(prod.stock);
    setEditCategory(prod.category);
    setEditBrand(prod.brand || 'Aqua');
    setEditCollection(prod.collection || 'Active Series');
    setEditDesc(prod.description || '');
    setEditStatus(prod.status);
    setEditColors(prod.colors || 'Silver Matte, Aurora Blue, Velvet Purple');
    setEditCapacity(prod.capacity || '750ml, 1000ml');
    setEditMaterial(prod.material || 'Double-wall Stainless Steel');
    setEditSpecs(prod.specifications || 'Temp retention: Hot 12 hrs, Cold 24 hrs');
    setEditWarranty(prod.warranty || 'Lifetime warranty coverage');
    setEditGltf(prod.gltfModelUrl || '/assets/models/aqua_bottle.gltf');
    setEditJpgAnim(prod.jpgAnimationPath || '/assets/animations/hero_scroll.jpg');
    setEditMetaTitle(prod.metaTitle || `${prod.name} | ShopSphere`);
    setEditMetaDesc(prod.metaDescription || prod.description.slice(0, 150));
    setEditTags(prod.tags || 'bottle, vacuum insulated, copper layer, thermal');
    setEditTab('general');
  };

  // Save Edit Product to DB
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          sku: editSKU,
          price: editPrice,
          compareAtPrice: editCompareAtPrice,
          stock: editStock,
          description: editDesc,
          categoryName: editCategory,
          brandName: editBrand,
          collectionName: editCollection,
          status: editStatus,
          colors: editColors,
          capacity: editCapacity,
          material: editMaterial,
          specifications: editSpecs,
          warranty: editWarranty,
          gltfModelUrl: editGltf,
          jpgAnimationPath: editJpgAnim,
          metaTitle: editMetaTitle,
          metaDescription: editMetaDesc,
          tags: editTags,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast('Product details saved to PostgreSQL!');
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Product in DB
  const handleDuplicate = async (prod: Product) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${prod.name} (Copy)`,
          price: prod.price,
          stock: prod.stock,
          categoryName: prod.category,
          description: prod.description,
          imageUrls: prod.images,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast(`Duplicated "${prod.name}" successfully.`);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Single Quick Archive action
  const handleQuickArchive = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products/bulk-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast('Product archived successfully.');
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product with confirmation modal
  const handleExecuteDelete = async () => {
    if (!deleteConfirmProd) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/business/products/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [deleteConfirmProd.id] }),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast('Product deleted from database and storefront.');
        setDeleteConfirmProd(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
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
        triggerToast(`Product is now ${action}ed.`);
        fetchProducts();
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  // Bulk Operations
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete' | 'archive' | 'discount' | 'move-category') => {
    if (selectedIds.length === 0) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      let body: any = { ids: selectedIds };

      if (action === 'discount') {
        body.discountPercentage = parseFloat(bulkDiscountVal);
      } else if (action === 'move-category') {
        body.categoryName = bulkCatName;
      }

      const res = await fetch(`${apiUrl}/api/business/products/bulk-${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast(resData.message || 'Operation succeeded.');
        setSelectedIds([]);
        setShowDiscountPrompt(false);
        setShowMoveCatPrompt(false);
        fetchProducts();
      }
    } catch (err) {
      console.error('Bulk action error:', err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = 'ID,Name,SKU,Category,Brand,Price,Stock,Status\n';
    const rows = products
      .filter((p) => selectedIds.includes(p.id))
      .map((p) => `"${p.id}","${p.name}","${p.sku || ''}","${p.category}","${p.brand || ''}",${p.price},${p.stock},"${p.status}"`)
      .join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ShopSphere_Products_Export_${Date.now()}.csv`);
    a.click();
    triggerToast(`Exported ${selectedIds.length} products to CSV.`);
  };

  // Processing metrics calculation
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'Published').length;
  const draftProducts = products.filter((p) => p.status === 'Draft').length;
  const archivedProducts = products.filter((p) => p.status === 'Archived').length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const featuredProducts = products.filter((p) => p.isFeatured).length;
  const bestSellers = products.filter((p) => p.totalSales > 10).length;

  const categoriesList = Array.from(new Set(products.map((p) => p.category)));
  const brandsList = Array.from(new Set(products.map((p) => p.brand || 'Aqua')));
  const collectionsList = Array.from(new Set(products.map((p) => p.collection || 'Active Series')));

  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchBrand = filterBrand === 'all' || (p.brand || 'Aqua') === filterBrand;
      const matchCollection = filterCollection === 'all' || (p.collection || 'Active Series') === filterCollection;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchStock =
        filterStock === 'all' ||
        (filterStock === 'out' && p.stock === 0) ||
        (filterStock === 'low' && p.stock > 0 && p.stock <= 10);

      return matchSearch && matchCategory && matchBrand && matchCollection && matchStatus && matchStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'stock') comparison = a.stock - b.stock;
      else if (sortBy === 'sales') comparison = a.totalSales - b.totalSales;
      else if (sortBy === 'rating') comparison = a.rating - b.rating;
      else if (sortBy === 'newest') comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortBy === 'oldest') comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative flex flex-col md:flex-row">
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
        <div className="hidden md:block md:w-20 lg:w-64 border-r border-zinc-900 bg-zinc-950/20 p-6 space-y-8 shrink-0 min-h-screen pt-36 animate-fadeIn">
          <div className="space-y-4">
            <span className="block text-[8px] font-bold text-zinc-600 uppercase tracking-widest px-4 hidden lg:block">Workspace</span>
            <Link href="/business/dashboard" className="w-full px-4 py-2.5 rounded-xl transition-all flex items-center justify-center lg:justify-start gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-zinc-900/30" title="Corporate OS">
              📊 <span className="hidden lg:inline">Corporate OS</span>
            </Link>
            <Link href="/business/product-catalog" className="w-full px-4 py-2.5 rounded-xl transition-all flex items-center justify-center lg:justify-start gap-3 bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 text-[10px] font-bold uppercase tracking-wider" title="Product Catalog">
              📦 <span className="hidden lg:inline">Product Catalog</span>
            </Link>
          </div>
        </div>

        {/* Mobile Drawer Trigger Floating Button */}
        <div className="md:hidden fixed bottom-6 left-6 z-40">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="h-12 w-12 rounded-full bg-indigo-600 border border-indigo-400/20 text-white flex items-center justify-center shadow-2xl text-xl cursor-pointer"
          >
            ☰
          </button>
        </div>

        {/* Mobile Slide-out Drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="relative w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-900 p-6 overflow-y-auto h-full flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Business OS</h3>
                      <span className="text-[7px] font-mono text-zinc-550 uppercase tracking-widest font-semibold block mt-0.5">
                        ShopSphere Product Catalog
                      </span>
                    </div>
                    <button onClick={() => setMobileDrawerOpen(false)} className="text-zinc-550 hover:text-white text-xs">✕</button>
                  </div>

                  <div className="space-y-4">
                    <span className="block text-[8px] font-bold text-zinc-655 uppercase tracking-widest px-2">Navigation</span>
                    <Link
                      href="/business/dashboard"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-zinc-900/30"
                    >
                      📊 Corporate OS
                    </Link>
                    <Link
                      href="/business/product-catalog"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider"
                    >
                      📦 Product Catalog
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 pt-36 pb-32 overflow-hidden">
          <Navbar />

          <div className="space-y-8">
            {/* Header info */}
            <div>
              <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Product Catalog</span>
              <h1 className="text-3xl font-black text-white mt-2 tracking-tight uppercase">Product Catalog</h1>
            </div>

            {/* Statistics Summary Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
              {[
                { label: 'Total Products', count: totalProducts, icon: '📦' },
                { label: 'Published', count: publishedProducts, icon: '🟢' },
                { label: 'Drafts', count: draftProducts, icon: '🟡' },
                { label: 'Archived', count: archivedProducts, icon: '🗂️' },
                { label: 'Out of Stock', count: outOfStock, icon: '🔴', alert: outOfStock > 0 },
                { label: 'Low Stock', count: lowStock, icon: '⚠️', alert: lowStock > 0 },
                { label: 'Featured', count: featuredProducts, icon: '⭐' },
                { label: 'Best Sellers', count: bestSellers, icon: '🔥' },
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
              
              {/* Search with suggestions dropdown */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="SKU, collection, brand, name search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-indigo-500/50 font-mono"
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

              {/* View options selectors */}
              <div className="flex flex-wrap items-center gap-3">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="all">Category (All)</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select value={filterCollection} onChange={(e) => setFilterCollection(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="all">Collection (All)</option>
                  {collectionsList.map((coll) => (
                    <option key={coll} value={coll}>{coll}</option>
                  ))}
                </select>

                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none font-bold uppercase tracking-wider">
                  <option value="all">Brand (All)</option>
                  {brandsList.map((brnd) => (
                    <option key={brnd} value={brnd}>{brnd}</option>
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
                  <option value="newest">Sort by Newest</option>
                  <option value="oldest">Sort by Oldest</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-zinc-900 rounded-xl hover:bg-zinc-900 text-xs cursor-pointer"
                >
                  {sortOrder === 'asc' ? '▲' : '▼'}
                </button>

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

            {/* Selection indicators */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center gap-3 px-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredProducts.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filteredProducts.map((p) => p.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded border-zinc-900 bg-zinc-950 cursor-pointer"
                />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Select All Listed ({filteredProducts.length})</span>
              </div>
            )}

            {/* Layout viewports */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center border border-zinc-900 rounded-3xl bg-zinc-950/20">
                <span className="text-3xl block">🔍</span>
                <p className="text-zinc-550 text-xs mt-3 uppercase tracking-wider font-bold">No products match your active search filters.</p>
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
                        className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 flex flex-col justify-between min-h-[460px] group relative hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
                      >
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

                          <div className="space-y-1">
                            <span className="text-[7px] font-mono text-zinc-550 uppercase tracking-widest block">{prod.sku} &bull; {prod.category}</span>
                            <h3 className="font-black text-white text-xs uppercase tracking-wider truncate">{prod.name}</h3>
                            
                            <div className="flex justify-between items-center pt-2 text-[9px] text-zinc-400 font-mono">
                              <span>Price: <span className="text-white font-bold">${prod.price.toFixed(2)}</span></span>
                              <span>Stock: <span className={prod.stock === 0 ? 'text-red-400' : 'text-white'}>{prod.stock}</span></span>
                            </div>

                            <div className="flex justify-between items-center pt-1 text-[8px] text-zinc-500 uppercase tracking-wider font-bold">
                              <span>Collection: <span className="text-zinc-300">{prod.collection || 'Active Series'}</span></span>
                              <span>Sales: <span className="text-zinc-300">{prod.totalSales} units</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Actions List */}
                        <div className="border-t border-zinc-900 pt-4 mt-4 grid grid-cols-3 gap-1.5 text-[8px] font-bold uppercase tracking-wider text-center">
                          <button
                            onClick={() => startEditProduct(prod)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            ✏ Edit
                          </button>
                          
                          <button
                            onClick={() => setPreviewProduct(prod)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            👁 Preview
                          </button>

                          <button
                            onClick={() => setViewingAnalyticsProd(prod)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            📊 Analytics
                          </button>

                          <button
                            onClick={() => setViewingInventoryProd(prod)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            📦 Inventory
                          </button>

                          <button
                            onClick={() => setMediaProduct(prod)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            📷 Media
                          </button>

                          <button
                            onClick={() => handleDuplicate(prod)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            📋 Dupe
                          </button>

                          <button
                            onClick={() => handleSinglePublishToggle(prod.id, prod.status)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {prod.status === 'Published' ? '📥 Unpub' : '📤 Pub'}
                          </button>

                          <button
                            onClick={() => handleQuickArchive(prod.id)}
                            className="py-2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            📁 Archive
                          </button>

                          <button
                            onClick={() => setDeleteConfirmProd(prod)}
                            className="py-2 rounded border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            🗑 Delete
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
                            <span className="block text-[8px] text-zinc-500 mt-1 font-mono">
                              SKU: {prod.sku} &bull; Category: {prod.category} &bull; Brand: {prod.brand || 'Aqua'} &bull; Collection: {prod.collection || 'Active Series'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
                          <span className="font-mono font-bold text-white text-xs">${prod.price.toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            prod.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {prod.status}
                          </span>
                          <button
                            onClick={() => startEditProduct(prod)}
                            className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] font-bold uppercase hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                          >
                            ✏ Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProd(prod)}
                            className="px-3 py-1.5 rounded border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 cursor-pointer text-[8px] font-bold uppercase"
                          >
                            🗑 Delete
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
                      <thead className="bg-zinc-950 border-b border-zinc-900 text-zinc-550 uppercase tracking-widest text-[8px] font-black">
                        <tr>
                          <th className="px-6 py-4"></th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">Product ID</th>
                          <th className="px-6 py-4">SKU</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Brand</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Sales</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Actions</th>
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
                            <td className="px-6 py-3.5 font-mono text-[8px] text-zinc-555">{prod.id}</td>
                            <td className="px-6 py-3.5 font-mono">{prod.sku}</td>
                            <td className="px-6 py-3.5 uppercase">{prod.category}</td>
                            <td className="px-6 py-3.5 uppercase">{prod.brand || 'Aqua'}</td>
                            <td className="px-6 py-3.5 font-mono text-white font-bold">${prod.price.toFixed(2)}</td>
                            <td className="px-6 py-3.5 font-mono">{prod.stock}</td>
                            <td className="px-6 py-3.5 font-mono">{prod.totalSales}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                prod.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {prod.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex gap-2">
                                <button onClick={() => setPreviewProduct(prod)} className="hover:text-white">👁 Preview</button>
                                <button onClick={() => setDeleteConfirmProd(prod)} className="text-red-400 hover:text-red-300">🗑 Delete</button>
                              </div>
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

        {/* Floating Action Button "Add Product" */}
        <button
          onClick={() => setShowCreateDrawer(true)}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-xl shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all z-40 border border-indigo-400/20"
          title="Add New Product"
        >
          ➕
        </button>

        {/* Custom Confirmation Modal Dialog */}
        <AnimatePresence>
          {deleteConfirmProd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmProd(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-950 p-6 text-center space-y-6 shadow-2xl z-10">
                <span className="text-4xl block">⚠️</span>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Confirm Catalog Deletion</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                    Are you sure you want to permanently delete this product?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleExecuteDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] uppercase tracking-widest cursor-pointer">
                    Delete Product
                  </button>
                  <button onClick={() => setDeleteConfirmProd(null)} className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-550 hover:text-zinc-300 font-bold text-[9px] uppercase tracking-widest cursor-pointer">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Advanced Bulk Actions Sliding Drawer */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-2xl border border-indigo-500/30 bg-zinc-950/90 backdrop-blur px-6 py-4 flex flex-col gap-3 shadow-2xl w-full max-w-2xl"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">
                  Bulk Selections: <span className="text-white font-black">{selectedIds.length} items selected</span>
                </span>
                <button onClick={() => { setSelectedIds([]); triggerToast('Bulk selections cleared.'); }} className="text-[9px] text-zinc-550 hover:text-zinc-355 uppercase tracking-widest font-bold">Clear All</button>
              </div>

              <div className="flex flex-wrap gap-2 text-[8px] font-bold uppercase tracking-wider">
                <button onClick={() => handleBulkAction('publish')} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">Publish</button>
                <button onClick={() => handleBulkAction('unpublish')} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer">Unpublish</button>
                <button onClick={() => handleBulkAction('archive')} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer">Archive</button>
                <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer">Export CSV</button>
                <button onClick={() => setShowDiscountPrompt(!showDiscountPrompt)} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer">Apply Discount</button>
                <button onClick={() => setShowMoveCatPrompt(!showMoveCatPrompt)} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer">Move Category</button>
                <button onClick={() => setShowMoveCollPrompt(!showMoveCollPrompt)} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer">Move Collection</button>
                <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 cursor-pointer">Delete</button>
              </div>

              {/* Dynamic prompt forms inside bulk bar */}
              {showDiscountPrompt && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-900 animate-scaleIn">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-widest font-bold">Discount Percentage (%):</span>
                  <input type="number" value={bulkDiscountVal} onChange={(e) => setBulkDiscountVal(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white w-20" />
                  <button onClick={() => handleBulkAction('discount')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8px] uppercase tracking-widest font-black">Apply</button>
                </div>
              )}

              {showMoveCatPrompt && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-900 animate-scaleIn">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-widest font-bold">Target Category:</span>
                  <input type="text" value={bulkCatName} onChange={(e) => setBulkCatName(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white w-40" />
                  <button onClick={() => handleBulkAction('move-category')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8px] uppercase tracking-widest font-black">Move</button>
                </div>
              )}

              {showMoveCollPrompt && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-900 animate-scaleIn">
                  <span className="text-[8px] text-zinc-555 uppercase tracking-widest font-bold">Target Collection:</span>
                  <input type="text" value={bulkCollName} onChange={(e) => setBulkCollName(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white w-40" />
                  <button onClick={() => { triggerToast(`Moved items to collection: ${bulkCollName}`); setShowMoveCollPrompt(false); }} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8px] uppercase tracking-widest font-black">Move</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabbed Product Studio Edit Drawer */}
        <AnimatePresence>
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProduct(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} className="w-[500px] bg-zinc-955 border-l border-zinc-900 p-8 space-y-6 relative z-10 overflow-y-auto">
                <div>
                  <span className="text-indigo-400 text-[8px] font-bold uppercase tracking-[0.2em]">Product Studio v2</span>
                  <h3 className="text-lg font-black text-white uppercase mt-1 tracking-tight">Edit Product Catalog</h3>
                </div>

                {/* Studio Tab selectors */}
                <div className="flex border-b border-zinc-900 pb-1.5 gap-4 overflow-x-auto">
                  {[
                    { id: 'general', label: 'General' },
                    { id: 'details', label: 'Details' },
                    { id: 'specs', label: 'Specs & Tech' },
                    { id: 'media', label: 'Assets' },
                    { id: 'seo', label: 'SEO' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEditTab(tab.id as any)}
                      className={`text-[9px] font-bold uppercase tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                        editTab === tab.id ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-550 hover:text-zinc-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Tab 1: General */}
                  {editTab === 'general' && (
                    <div className="space-y-4 animate-scaleIn">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase tracking-widest block font-bold">Product Title</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">SKU</label>
                          <input type="text" value={editSKU} onChange={(e) => setEditSKU(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-550 uppercase tracking-widest block font-bold">Warehouse Stock</label>
                          <input type="number" value={editStock} onChange={(e) => setEditStock(parseInt(e.target.value))} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Price ($)</label>
                          <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(parseFloat(e.target.value))} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Compare-At Price ($)</label>
                          <input type="number" step="0.01" value={editCompareAtPrice || ''} onChange={(e) => setEditCompareAtPrice(e.target.value ? parseFloat(e.target.value) : null)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Description</label>
                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full h-20 bg-zinc-990 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Status</label>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Details */}
                  {editTab === 'details' && (
                    <div className="space-y-4 animate-scaleIn">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Category</label>
                        <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Collection</label>
                        <input type="text" value={editCollection} onChange={(e) => setEditCollection(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Brand</label>
                        <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Product Material</label>
                        <input type="text" value={editMaterial} onChange={(e) => setEditMaterial(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Tech Specs */}
                  {editTab === 'specs' && (
                    <div className="space-y-4 animate-scaleIn">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Available Colors (Comma-separated)</label>
                        <input type="text" value={editColors} onChange={(e) => setEditColors(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Capacities (Comma-separated)</label>
                        <input type="text" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Technical Specifications</label>
                        <textarea value={editSpecs} onChange={(e) => setEditSpecs(e.target.value)} className="w-full h-16 bg-zinc-990 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Warranty Coverage</label>
                        <input type="text" value={editWarranty} onChange={(e) => setEditWarranty(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Assets & Media */}
                  {editTab === 'media' && (
                    <div className="space-y-4 animate-scaleIn">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">GLTF 3D Model Path</label>
                        <input type="text" value={editGltf} onChange={(e) => setEditGltf(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">JPG Scroll Animation Path</label>
                        <input type="text" value={editJpgAnim} onChange={(e) => setEditJpgAnim(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {/* Tab 5: SEO */}
                  {editTab === 'seo' && (
                    <div className="space-y-4 animate-scaleIn">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Meta Title</label>
                        <input type="text" value={editMetaTitle} onChange={(e) => setEditMetaTitle(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Meta Description</label>
                        <textarea value={editMetaDesc} onChange={(e) => setEditMetaDesc(e.target.value)} className="w-full h-16 bg-zinc-990 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-widest block font-bold">Keywords / Tags (Comma-separated)</label>
                        <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} className="w-full bg-zinc-990 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {/* Submit actions */}
                  <div className="pt-4 flex gap-2">
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest cursor-pointer">Save catalog</button>
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300 rounded-xl font-bold text-[9px] uppercase tracking-widest cursor-pointer">Cancel</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Live Storefront Mock Preview Modal */}
        <AnimatePresence>
          {previewProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewProduct(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl rounded-2xl border border-zinc-900 bg-zinc-950 p-8 shadow-2xl z-10 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
                <button onClick={() => setPreviewProduct(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer">✕</button>
                
                <div className="flex-1 h-64 rounded-xl bg-zinc-900 border border-zinc-850 overflow-hidden shrink-0">
                  {previewProduct.images[0] ? (
                    <img src={previewProduct.images[0]} alt={previewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                  )}
                </div>

                <div className="flex-1 space-y-4 text-left">
                  <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase block">{previewProduct.sku} &bull; {previewProduct.category}</span>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">{previewProduct.name}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{previewProduct.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">${previewProduct.price.toFixed(2)}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      ★ {previewProduct.rating.toFixed(1)} ({previewProduct.totalSales} sales)
                    </span>
                  </div>

                  <div className="pt-4 border-t border-zinc-900 text-[9px] text-zinc-500 uppercase tracking-wider space-y-1">
                    <div>Brand: <span className="text-zinc-300 font-bold">{previewProduct.brand}</span></div>
                    <div>Stock status: <span className={previewProduct.stock === 0 ? 'text-red-400 font-bold' : 'text-zinc-300 font-bold'}>{previewProduct.stock} units available</span></div>
                    <div>Status: <span className="text-zinc-300 font-bold">{previewProduct.status}</span></div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Media Quick Action Modal */}
        <AnimatePresence>
          {mediaProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMediaProduct(null)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl z-10 text-center space-y-6">
                <button onClick={() => setMediaProduct(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer">✕</button>
                <span className="text-3xl block">📷</span>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase block">{mediaProduct.sku}</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{mediaProduct.name}</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {mediaProduct.images.map((imgUrl, i) => (
                    <div key={i} className="h-24 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
                      <img src={imgUrl} alt="media gallery" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 text-left text-[9px] text-zinc-500 space-y-1">
                  <div>3D glTF Model URL: <span className="text-white font-mono">{mediaProduct.gltfModelUrl || '/assets/models/aqua_bottle.gltf'}</span></div>
                  <div>Hero scroll JPG path: <span className="text-white font-mono">{mediaProduct.jpgAnimationPath || '/assets/animations/hero_scroll.jpg'}</span></div>
                </div>

                <button onClick={() => setMediaProduct(null)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] uppercase tracking-widest cursor-pointer">
                  Close Media Gallery
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Mock Analytics Modal */}
        <AnimatePresence>
          {viewingAnalyticsProd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingAnalyticsProd(null)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl z-10 text-center space-y-6">
                <span className="text-3xl block">📊</span>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase block">{viewingAnalyticsProd.sku}</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{viewingAnalyticsProd.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850">
                    <span className="text-[8px] text-zinc-555 uppercase block font-bold">Total Sales Volume</span>
                    <span className="text-sm font-mono font-bold text-white mt-1 block">{viewingAnalyticsProd.totalSales} Units</span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850">
                    <span className="text-[8px] text-zinc-555 uppercase block font-bold">Gross Revenue</span>
                    <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">${(viewingAnalyticsProd.totalSales * viewingAnalyticsProd.price).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setViewingAnalyticsProd(null)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] uppercase tracking-widest cursor-pointer">
                  Close Analytics
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Mock Inventory Modal */}
        <AnimatePresence>
          {viewingInventoryProd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingInventoryProd(null)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl z-10 text-center space-y-6">
                <span className="text-3xl block">📦</span>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase block">{viewingInventoryProd.sku}</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{viewingInventoryProd.name}</h3>
                </div>
                <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-855 text-left space-y-3 text-[10px] text-zinc-400">
                  <div className="flex justify-between"><span>Central Jersey Depot:</span><span className="text-white font-bold">{Math.floor(viewingInventoryProd.stock * 0.6)} Units</span></div>
                  <div className="flex justify-between"><span>West Oakland Depot:</span><span className="text-white font-bold">{Math.floor(viewingInventoryProd.stock * 0.4)} Units</span></div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2 text-white font-bold"><span>Total On Hand:</span><span>{viewingInventoryProd.stock} Units</span></div>
                </div>
                <button onClick={() => setViewingInventoryProd(null)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] uppercase tracking-widest cursor-pointer">
                  Close Inventory
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ScrollFoundation>
  );
}
