import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// Helper to log audit actions
async function logAudit(action: string, details: string, userId?: string) {
  try {
    await prisma.auditLog.create({
      data: { action, details, userId },
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

// 1. GET /admin/dashboard
router.get('/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
    });
    
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const activeUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const activeSellers = await prisma.user.count({ where: { role: 'SELLER' } });
    const totalProducts = await prisma.product.count();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: todayStart } },
    });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = 3.4; // Mock conversion rate metric %

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        ordersCount: totalOrders,
        activeUsers,
        activeSellers,
        totalProducts,
        conversionRate,
        averageOrderValue,
        recentActivity: auditLogs.map(log => ({
          description: `${log.action}: ${log.details || ''}`,
          time: log.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Server analytics error.' });
  }
});

// 2. GET /admin/users
router.get('/admin/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 3. PUT /admin/users/:id
router.put('/admin/users/:id', async (req: Request, res: Response) => {
  try {
    const { role, isBanned, isSuspended, name, email } = req.body;
    const userId = req.params.id;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role || undefined,
        isBanned: isBanned !== undefined ? !!isBanned : undefined,
        isSuspended: isSuspended !== undefined ? !!isSuspended : undefined,
        name: name || undefined,
        email: email || undefined,
      },
    });

    await logAudit(
      'UPDATE_USER',
      `Modified credentials of user: ${updated.email} (Banned: ${updated.isBanned}, Suspended: ${updated.isSuspended})`
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 4. DELETE /admin/users/:id
router.delete('/admin/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await prisma.user.delete({ where: { id: userId } });
    await logAudit('DELETE_USER', `Removed user credential account entry: ${existing.email}`);

    res.status(200).json({ success: true, message: 'User account removed.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server delete error.' });
  }
});

// 5. GET /admin/products
router.get('/admin/products', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get products admin error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 6. PUT /admin/products/:id
router.put('/admin/products/:id', async (req: Request, res: Response) => {
  try {
    const { isApproved, isFeatured, name, price, stock } = req.body;
    const prodId = req.params.id;

    const existing = await prisma.product.findUnique({ where: { id: prodId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id: prodId },
      data: {
        isApproved: isApproved !== undefined ? !!isApproved : undefined,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined,
        name: name || undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
      },
    });

    await logAudit(
      'UPDATE_PRODUCT',
      `Modified product settings for: ${updated.name} (Approved: ${updated.isApproved}, Featured: ${updated.isFeatured})`
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 7. DELETE /admin/products/:id
router.delete('/admin/products/:id', async (req: Request, res: Response) => {
  try {
    const prodId = req.params.id;
    const existing = await prisma.product.findUnique({ where: { id: prodId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await prisma.product.delete({ where: { id: prodId } });
    await logAudit('DELETE_PRODUCT', `Removed product catalog entry: ${existing.name}`);

    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server delete error.' });
  }
});

// 8. GET /admin/sellers
router.get('/admin/sellers', async (req: Request, res: Response) => {
  try {
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 9. PUT /admin/sellers/:id
router.put('/admin/sellers/:id', async (req: Request, res: Response) => {
  try {
    const { isSuspended, isBanned } = req.body;
    const sellerId = req.params.id;

    const existing = await prisma.user.findFirst({
      where: { id: sellerId, role: 'SELLER' },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: {
        isSuspended: isSuspended !== undefined ? !!isSuspended : undefined,
        isBanned: isBanned !== undefined ? !!isBanned : undefined,
      },
    });

    await logAudit(
      'UPDATE_SELLER_STATUS',
      `Modified merchant authorization flags for: ${updated.email} (Suspended: ${updated.isSuspended})`
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update seller error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 10. GET /admin/categories
router.get('/admin/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 11. POST /admin/categories
router.post('/admin/categories', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    await logAudit('CREATE_CATEGORY', `Created catalog category shelf: ${category.name}`);

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server create error.' });
  }
});

// 12. PUT /admin/categories/:id
router.put('/admin/categories/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const catId = req.params.id;

    const existing = await prisma.category.findUnique({ where: { id: catId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;

    const updated = await prisma.category.update({
      where: { id: catId },
      data: { name: name || undefined, slug },
    });

    await logAudit('UPDATE_CATEGORY', `Modified category shelf title from ${existing.name} to ${updated.name}`);

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 13. DELETE /admin/categories/:id
router.delete('/admin/categories/:id', async (req: Request, res: Response) => {
  try {
    const catId = req.params.id;
    const existing = await prisma.category.findUnique({ where: { id: catId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    await prisma.category.delete({ where: { id: catId } });
    await logAudit('DELETE_CATEGORY', `Removed catalog category: ${existing.name}`);

    res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server delete error.' });
  }
});

// 14. GET /admin/orders
router.get('/admin/orders', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

export default router;
