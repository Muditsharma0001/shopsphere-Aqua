'use client';

import { useState, useEffect } from 'react';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';
import { useCartStore } from '../../store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Address {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  address: string;
}

export default function CheckoutPage() {
  const { cart, appliedCoupon, discountPercent, freeShipping, clearCart } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  
  // Shipping Address Form
  const [address, setAddress] = useState<Address>({
    fullName: '',
    phone: '',
    email: '',
    country: 'India',
    state: '',
    city: '',
    zip: '',
    address: '',
  });

  const [addressBook, setAddressBook] = useState<Address[]>([]);
  const [saveToBook, setSaveToBook] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof Address, string>>>({});

  // Delivery Method Selection
  const deliveryMethods = [
    { id: 'standard', name: 'Standard Delivery', time: '4-6 business days', cost: 0, label: 'Free' },
    { id: 'express', name: 'Express Cargo', time: '2-3 business days', cost: 9.99, label: '$9.99' },
    { id: 'nextday', name: 'Next Day Delivery', time: 'Tomorrow afternoon', cost: 19.99, label: '$19.99' },
  ];
  const [selectedDelivery, setSelectedDelivery] = useState('standard');

  // Checkout summary state calculated values
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  
  const currentDeliveryCost = deliveryMethods.find((d) => d.id === selectedDelivery)?.cost || 0;
  const shippingCost = subtotal > 150 || freeShipping || subtotal === 0 ? 0 : currentDeliveryCost;
  
  const gstAmount = (subtotal - discountAmount) * 0.05;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost + gstAmount);

  interface CompletedOrder {
    id: string;
    orderNumber: string;
    shippingMethod: string;
    grandTotal: number;
  }

  // Completed Order State from server
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Address book load
  useEffect(() => {
    const stored = localStorage.getItem('shopsphere_address_book');
    if (stored) {
      const parsed = JSON.parse(stored);
      setAddressBook(parsed);
      if (parsed.length > 0) {
        setAddress(parsed[0]); // default to first address
      }
    }
  }, []);

  const validateAddress = () => {
    const errors: Partial<Record<keyof Address, string>> = {};
    if (!address.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!address.phone.trim()) errors.phone = 'Phone Number is required';
    if (!address.email.trim() || !address.email.includes('@')) errors.email = 'Valid Email is required';
    if (!address.state.trim()) errors.state = 'State is required';
    if (!address.city.trim()) errors.city = 'City is required';
    if (!address.zip.trim()) errors.zip = 'ZIP code is required';
    if (!address.address.trim()) errors.address = 'Complete street address is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep1 = () => {
    if (validateAddress()) {
      if (saveToBook) {
        const isAlreadySaved = addressBook.some((a) => a.fullName === address.fullName && a.address === address.address);
        if (!isAlreadySaved) {
          const updatedBook = [address, ...addressBook].slice(0, 3);
          setAddressBook(updatedBook);
          localStorage.setItem('shopsphere_address_book', JSON.stringify(updatedBook));
        }
      }
      setStep(2);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiatePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // 1. Create checkout ORD record on server
      const checkoutRes = await fetch(`${apiUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: address.fullName,
          customerEmail: address.email,
          customerPhone: address.phone,
          shippingAddress: `${address.address}, ${address.city}, ${address.state} - ${address.zip}, ${address.country}`,
          shippingMethod: deliveryMethods.find(d => d.id === selectedDelivery)?.name || 'Standard',
          couponCode: appliedCoupon,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
            color: item.selectedColor,
            capacity: item.selectedCapacity,
          })),
        }),
      });

      if (!checkoutRes.ok) {
        throw new Error('Checkout API failed to create order');
      }

      const checkoutData = await checkoutRes.json();
      if (!checkoutData.success) {
        throw new Error(checkoutData.message || 'Failed to create order on server');
      }

      const { order, razorpayOrderId, razorpayKeyId } = checkoutData.data;

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment SDK script.');
      }

      // 3. Configure Razorpay modal
      const options = {
        key: razorpayKeyId,
        amount: order.grandTotal * 100, // paisa
        currency: 'INR',
        name: 'ShopSphere Aqua',
        description: `Order ${order.orderNumber} Payment`,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
        order_id: razorpayOrderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setIsProcessingPayment(true);
          try {
            // Verify signature
            const verifyRes = await fetch(`${apiUrl}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber: order.orderNumber,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCompletedOrder(order);
              clearCart(); // clear state cart items on payment verified success
              setStep(5); // Success step
            } else {
              setStep(6); // Failure step
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            setStep(6);
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      };

      // Open Razorpay modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Initiating payment failed:', err);
      setStep(6); // Go to Failure Step
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!completedOrder) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    window.location.href = `${apiUrl}/api/orders/${completedOrder.id}/invoice`;
  };

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        
        {/* Glow backdrop */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          
          {/* Timeline progress header */}
          {step <= 4 && (
            <div className="max-w-xl mx-auto mb-16 relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-900 -translate-y-1/2 z-0" />
              
              <div className="relative z-10 flex justify-between">
                {[
                  { num: 1, label: 'Address' },
                  { num: 2, label: 'Delivery' },
                  { num: 3, label: 'Review' },
                  { num: 4, label: 'Pay' },
                ].map((item) => (
                  <div key={item.num} className="flex flex-col items-center gap-2">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                        step === item.num
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : step > item.num
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-zinc-900 bg-zinc-950 text-zinc-600'
                      }`}
                    >
                      {step > item.num ? '✓' : item.num}
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-widest font-bold transition-all ${
                        step >= item.num ? 'text-indigo-400' : 'text-zinc-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Body Steps */}
          <div className="max-w-4xl mx-auto">
            
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Shipping Address */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  {/* Address form (Col-span 8) */}
                  <div className="lg:col-span-8 p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Shipping Address</h2>
                    
                    {/* Address Book selectors */}
                    {addressBook.length > 0 && (
                      <div className="space-y-2 border-b border-zinc-900 pb-6">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Select Saved Address</span>
                        <div className="flex flex-wrap gap-2">
                          {addressBook.map((savedAddr, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAddress(savedAddr)}
                              className={`px-3 py-2 rounded-xl border text-left text-[10px] max-w-[200px] line-clamp-1 transition-all ${
                                address.fullName === savedAddr.fullName && address.address === savedAddr.address
                                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                  : 'border-zinc-900 bg-zinc-950/30 text-zinc-500 hover:border-zinc-800'
                              }`}
                            >
                              🏠 {savedAddr.fullName} &bull; {savedAddr.city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Full Name</label>
                        <input
                          type="text"
                          value={address.fullName}
                          onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.fullName && <p className="text-[9px] text-red-400 font-mono">{validationErrors.fullName}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Email</label>
                        <input
                          type="email"
                          value={address.email}
                          onChange={(e) => setAddress({ ...address, email: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.email && <p className="text-[9px] text-red-400 font-mono">{validationErrors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Phone Number</label>
                        <input
                          type="text"
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.phone && <p className="text-[9px] text-red-400 font-mono">{validationErrors.phone}</p>}
                      </div>

                      {/* ZIP Code */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">ZIP Code</label>
                        <input
                          type="text"
                          value={address.zip}
                          onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.zip && <p className="text-[9px] text-red-400 font-mono">{validationErrors.zip}</p>}
                      </div>

                      {/* Country */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Country</label>
                        <input
                          type="text"
                          value={address.country}
                          disabled
                          className="w-full bg-zinc-950 border border-zinc-900/60 rounded-xl px-4 py-3 text-xs text-zinc-500 cursor-not-allowed"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">State</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.state && <p className="text-[9px] text-red-400 font-mono">{validationErrors.state}</p>}
                      </div>

                      {/* City */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">City</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.city && <p className="text-[9px] text-red-400 font-mono">{validationErrors.city}</p>}
                      </div>

                      {/* Complete Street Address */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Street Address</label>
                        <input
                          type="text"
                          value={address.address}
                          onChange={(e) => setAddress({ ...address, address: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        {validationErrors.address && <p className="text-[9px] text-red-400 font-mono">{validationErrors.address}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="saveAddressCheckbox"
                        checked={saveToBook}
                        onChange={(e) => setSaveToBook(e.target.checked)}
                        className="rounded accent-indigo-600 focus:ring-0 focus:outline-none"
                      />
                      <label htmlFor="saveAddressCheckbox" className="text-[10px] text-zinc-500 tracking-wide font-medium">Save to Address Book</label>
                    </div>

                    <button
                      onClick={handleNextStep1}
                      className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest transition-colors mt-6"
                    >
                      Save & Continue
                    </button>

                  </div>

                  {/* Summary (Col-span 4) */}
                  <div className="lg:col-span-4 p-6 rounded-3xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bag</h3>
                    <div className="divide-y divide-zinc-900 max-h-[220px] overflow-y-auto pr-1">
                      {cart.map((item, idx) => (
                        <div key={idx} className="py-3 flex justify-between text-[10px]">
                          <div>
                            <span className="font-bold text-white uppercase">{item.product.name}</span>
                            <span className="block text-[8px] text-zinc-500">{item.selectedColor} / {item.selectedCapacity} (x{item.quantity})</span>
                          </div>
                          <span className="font-mono text-white font-bold">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Delivery Option */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-xl mx-auto"
                >
                  <div className="p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">Select Delivery Mode</h2>
                    
                    <div className="space-y-4">
                      {deliveryMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedDelivery(method.id)}
                          className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                            selectedDelivery === method.id
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wide">{method.name}</h4>
                            <span className="text-[10px] text-zinc-500 mt-1 block">{method.time}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-white">{method.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-zinc-900">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white uppercase font-bold text-[10px] tracking-widest transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                      >
                        Next
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STEP 3: Order Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  {/* Left Column: Information Review list */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Billed To Review */}
                    <div className="p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">Shipping To</h3>
                        <button onClick={() => setStep(1)} className="text-[10px] text-indigo-400 hover:underline">Edit</button>
                      </div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <p className="font-bold text-white">{address.fullName}</p>
                        <p>{address.address}, {address.city}, {address.state} - {address.zip}, {address.country}</p>
                        <p>Phone: {address.phone} &bull; Email: {address.email}</p>
                      </div>
                    </div>

                    {/* Delivery Method Review */}
                    <div className="p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">Delivery Mode</h3>
                        <button onClick={() => setStep(2)} className="text-[10px] text-indigo-400 hover:underline">Edit</button>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        <p className="font-bold text-white">
                          {deliveryMethods.find((d) => d.id === selectedDelivery)?.name}
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">
                          {deliveryMethods.find((d) => d.id === selectedDelivery)?.time}
                        </p>
                      </div>
                    </div>

                    {/* Product items review list */}
                    <div className="p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">Specimen Inventory</h3>
                      <div className="divide-y divide-zinc-900">
                        {cart.map((item, idx) => {
                          const mainImage = item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
                          return (
                            <div key={idx} className="py-4 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-zinc-950 rounded-lg border border-zinc-900 overflow-hidden flex items-center justify-center p-1 shrink-0">
                                  <img src={mainImage} alt={item.product.name} className="h-full w-auto object-contain" />
                                </div>
                                <div>
                                  <span className="font-bold text-white uppercase">{item.product.name}</span>
                                  <span className="block text-[8px] text-zinc-500">{item.selectedColor} / {item.selectedCapacity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block font-bold text-white">${(item.product.price * item.quantity).toFixed(2)}</span>
                                <span className="block text-[8px] text-zinc-500">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Checkout Pricing list */}
                  <div className="lg:col-span-4 p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Final Calculation</h3>
                    
                    <div className="space-y-3 text-[10px] font-mono text-zinc-400 border-b border-zinc-900 pb-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-white">${subtotal.toFixed(2)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-indigo-400 font-semibold">
                          <span>Discount ({appliedCoupon})</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Cargo Shipping</span>
                        <span className="text-white">
                          {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>GST (5%)</span>
                        <span className="text-white">${gstAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Grand Total</span>
                      <span className="text-lg font-black text-white font-mono">${grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-zinc-900">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white uppercase font-bold text-[10px] tracking-widest transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(4)}
                        className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                      >
                        Review Pay
                      </button>
                    </div>

                  </div>

                </motion.div>
              )}

              {/* STEP 4: Initiate payment trigger button details */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6 max-w-md mx-auto text-center"
                >
                  <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-6">
                    <span className="text-3xl block">🔒</span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">SECURE PAYMENT OVERLAY</h2>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-2">
                        You will be redirected to the secure Razorpay payment test-sandbox portal.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900/60 flex justify-between items-baseline font-mono">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Pay Amount</span>
                      <span className="text-base font-black text-white">${grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="space-y-3 pt-4">
                      <button
                        onClick={handleInitiatePayment}
                        disabled={isProcessingPayment}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isProcessingPayment ? 'Processing Gateway...' : 'Pay with Razorpay'}
                      </button>
                      
                      <button
                        onClick={() => setStep(3)}
                        disabled={isProcessingPayment}
                        className="w-full py-3 rounded-xl border border-zinc-900 bg-zinc-950 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Payment Success Page */}
              {step === 5 && completedOrder && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 max-w-lg mx-auto text-center"
                >
                  <div className="p-8 rounded-3xl border border-indigo-500/20 bg-zinc-950/40 space-y-6">
                    <div className="h-16 w-16 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 mx-auto text-2xl animate-pulse">
                      ✓
                    </div>

                    <div>
                      <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.25em]">TRANSACTION SUCCESSFUL</span>
                      <h2 className="text-3xl font-black text-white mt-3 font-serif">THANK YOU FOR YOUR ORDER</h2>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-2">
                        We have verified your payment configuration. Your cargo tracking and logistics update has been queued.
                      </p>
                    </div>

                    {/* Receipt breakdown */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900/80 space-y-2 text-left font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase">Order Reference</span>
                        <span className="text-white font-bold">{completedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase">Delivery Method</span>
                        <span className="text-white font-bold">{completedOrder.shippingMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase">Grand Total</span>
                        <span className="text-white font-bold">${completedOrder.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-900">
                      <button
                        onClick={handleDownloadInvoice}
                        className="flex-1 py-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-750 text-[10px] font-bold text-zinc-300 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                      >
                        📄 Download Invoice (PDF)
                      </button>
                      <Link
                        href="/shop"
                        className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest text-center transition-colors flex items-center justify-center"
                      >
                        Continue Shopping
                      </Link>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STEP 6: Order Failure */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 max-w-md mx-auto text-center"
                >
                  <div className="p-8 rounded-3xl border border-red-500/20 bg-zinc-950/40 space-y-6">
                    <div className="h-16 w-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 mx-auto text-2xl">
                      ✕
                    </div>

                    <div>
                      <span className="text-red-400 text-[10px] font-bold uppercase tracking-[0.25em]">TRANSACTION DECLINED</span>
                      <h2 className="text-3xl font-black text-white mt-3 font-serif">PAYMENT TRANSACTION FAILED</h2>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-2">
                        The merchant payment verification returned signature mismatch or disdismiss flags. Please try again.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-zinc-900">
                      <button
                        onClick={() => setStep(4)}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all"
                      >
                        Retry Payment Option
                      </button>
                      <Link
                        href="/shop"
                        className="w-full py-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest text-center transition-colors"
                      >
                        Back to Shop
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </main>

        <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-xs text-zinc-500">
          <p>&copy; 2026 ShopSphere Aqua Inc. All rights reserved.</p>
        </footer>

      </div>
    </ScrollFoundation>
  );
}
