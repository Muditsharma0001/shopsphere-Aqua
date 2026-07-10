'use client';

import { useEffect, useState } from 'react';
import { Product, ApiResponse } from '@shopsphere/shared-types';
import PremiumShowcase from '../components/PremiumShowcase';
import ScrollFoundation from '../components/ScrollFoundation';
import Navbar from '../components/Navbar';
import HomepageSections from '../components/HomepageSections';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  // Fetch products
  useEffect(() => {
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

    fetchProducts();
  }, []);



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
