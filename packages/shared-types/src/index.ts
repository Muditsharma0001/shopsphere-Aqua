export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'ENTERPRISE' | 'BUSINESS_OWNER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string | null;
  provider?: 'LOCAL' | 'GOOGLE';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  isFeatured: boolean;
  productId: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  brandId: string;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}
