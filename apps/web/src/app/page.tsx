'use client';

import { useEffect, useState } from 'react';
import { Product, ApiResponse, User } from '@shopsphere/shared-types';
import PremiumShowcase from '../components/PremiumShowcase';
import ScrollFoundation from '../components/ScrollFoundation';
import Navbar from '../components/Navbar';
import HomepageSections from '../components/HomepageSections';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Initialize Lenis Smooth Scroll

  // Fetch authentication status and products
  useEffect(() => {
    const fetchProfile = async (retry = true) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
        
        if (res.status === 401 && retry) {
          const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshRes.ok) {
            await fetchProfile(false);
          } else {
            setUser(null);
          }
        } else if (res.ok) {
          const data: ApiResponse<User> = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setUser(null);
      }
    };

    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data: ApiResponse<Product[]> = await res.json();
        if (data.success && data.data) {
          setProducts(data.data);
        } else {
          throw new Error(data.message || 'Failed to retrieve products');
        }
      } catch (err: unknown) {
        console.error('Error fetching products:', err);
        const errMsg = err instanceof Error ? err.message : 'An error occurred.';
        setErrorProducts(errMsg);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProfile();
    fetchProducts();
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };



  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
        
        <Navbar />

        <PremiumShowcase />

        <HomepageSections
          products={products}
          loadingProducts={loadingProducts}
          errorProducts={errorProducts}
        />

      </div>
    </ScrollFoundation>
  );
}
