import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { ApiResponse, Product } from '@shopsphere/shared-types';

const router = Router();

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch products with relations, ordered by creation date
    const dbProducts = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to typed shared objects if needed, or return directly since database schema matches
    const response: ApiResponse<Product[]> = {
      success: true,
      message: 'Products retrieved successfully',
      data: dbProducts as unknown as Product[],
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('[Products API Error]:', error);
    const errorResponse: ApiResponse = {
      success: false,
      message: 'Failed to retrieve products',
      errors: [error.message || 'Unknown database error'],
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
