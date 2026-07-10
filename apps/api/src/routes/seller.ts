import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// Helper to seed store settings if empty
async function resolveStoreSettings() {
  const settings = await prisma.storeSettings.findFirst();
  if (settings) return settings;
  return await prisma.storeSettings.create({
    data: {
      storeName: 'ShopSphere Aqua Series',
      description: 'Luxury thermal computational hydration containers.',
      contactInfo: 'support@shopsphere-aqua.com',
      shippingPolicy: 'Free carbon-neutral courier worldwide.',
      returnPolicy: '30-day hassle-free returns.',
    },
  });
}

// 1. GET /seller/dashboard
router.get('/seller/dashboard', async (req: Request, res: Response) => {
  try {
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const activeProducts = await prisma.product.count();
    
    // Sum of paid orders
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
      include: { orderItems: true },
    });
    
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const productsSold = paidOrders.reduce((sum, o) => sum + o.orderItems.reduce((s, item) => s + item.quantity, 0), 0);
    
    // Low stock items (stock < 5)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 5 } },
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        productsSold,
        activeProducts,
        pendingOrders,
        lowStockAlertsCount: lowStockProducts.length,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error('Seller dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Server analytics error.' });
  }
});

// 2. GET /seller/products
router.get('/seller/products', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { images: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 3. POST /seller/products
router.post('/seller/products', async (req: Request, res: Response) => {
  try {
    const { name, description, price, compareAtPrice, stock, categoryName, imageUrls } = req.body;

    if (!name || !price || !categoryName) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    
    // Find or create category
    let category = await prisma.category.findUnique({ where: { name: categoryName } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
      });
    }

    // Default Brand
    let brand = await prisma.brand.findFirst();
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: 'Aqua', slug: 'aqua' },
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: parseInt(stock) || 0,
        categoryId: category.id,
        brandId: brand.id,
        images: {
          create: (imageUrls || []).map((url: string, idx: number) => ({
            url,
            isFeatured: idx === 0,
          })),
        },
      },
      include: {
        images: true,
        category: true,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server product creation error.' });
  }
});

// 4. PUT /seller/products/:id
router.put('/seller/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, price, compareAtPrice, stock } = req.body;
    const prodId = req.params.id;

    const existing = await prisma.product.findUnique({ where: { id: prodId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id: prodId },
      data: {
        name: name || undefined,
        description: description || undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? parseFloat(compareAtPrice) : null) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 5. DELETE /seller/products/:id
router.delete('/seller/products/:id', async (req: Request, res: Response) => {
  try {
    const prodId = req.params.id;
    const existing = await prisma.product.findUnique({ where: { id: prodId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await prisma.product.delete({ where: { id: prodId } });
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server delete error.' });
  }
});

// 6. GET /seller/orders
router.get('/seller/orders', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 7. PUT /seller/orders/:id
router.put('/seller/orders/:id', async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus } = req.body;
    const ordId = req.params.id;

    const existing = await prisma.order.findUnique({ where: { id: ordId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updated = await prisma.order.update({
      where: { id: ordId },
      data: {
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 8. GET /seller/analytics
router.get('/seller/analytics', async (req: Request, res: Response) => {
  try {
    // Generate simple monthly analytic chart parameters
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
    });

    const monthlyData = [
      { label: 'Jan', revenue: 1200 },
      { label: 'Feb', revenue: 1900 },
      { label: 'Mar', revenue: 3100 },
      { label: 'Apr', revenue: 2400 },
      { label: 'May', revenue: 4800 },
      { label: 'Jun', revenue: 6100 },
      { label: 'Jul', revenue: paidOrders.reduce((sum, o) => sum + o.grandTotal, 0) },
    ];

    res.status(200).json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, message: 'Server analytics fetch error.' });
  }
});

// 9. GET /seller/coupons
router.get('/seller/coupons', async (req: Request, res: Response) => {
  try {
    // Pre-populate some coupon records if table is completely empty
    const count = await prisma.coupon.count();
    if (count === 0) {
      await prisma.coupon.createMany({
        data: [
          { code: 'AQUA20', discountPercent: 20, usageLimit: 100 },
          { code: 'FREESHIP', discountPercent: 0, usageLimit: 500 },
        ],
      });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 10. POST /seller/coupons
router.post('/seller/coupons', async (req: Request, res: Response) => {
  try {
    const { code, discountPercent, usageLimit } = req.body;

    if (!code || discountPercent === undefined) {
      return res.status(400).json({ success: false, message: 'Code and discount percentage are required.' });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountPercent: parseFloat(discountPercent),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    });

    res.status(201).json({ success: true, data: newCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: 'Server coupon creation error.' });
  }
});

// 11. PUT /seller/store
router.put('/seller/store', async (req: Request, res: Response) => {
  try {
    const settings = await resolveStoreSettings();
    const { storeName, storeLogo, storeBanner, description, contactInfo, shippingPolicy, returnPolicy } = req.body;

    const updated = await prisma.storeSettings.update({
      where: { id: settings.id },
      data: {
        storeName: storeName || undefined,
        storeLogo: storeLogo || null,
        storeBanner: storeBanner || null,
        description: description || null,
        contactInfo: contactInfo || null,
        shippingPolicy: shippingPolicy || null,
        returnPolicy: returnPolicy || null,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update store settings error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 12. GET /seller/store
router.get('/seller/store', async (req: Request, res: Response) => {
  try {
    const settings = await resolveStoreSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Get store settings error:', error);
    res.status(500).json({ success: false, message: 'Server settings fetch error.' });
  }
});

// 13. GET /seller/messages (Customer messages list)
router.get('/seller/messages', async (req: Request, res: Response) => {
  try {
    // Seed messages if table is empty
    const count = await prisma.customerMessage.count();
    if (count === 0) {
      await prisma.customerMessage.createMany({
        data: [
          { senderName: 'Alice Johnson', senderEmail: 'alice@gmail.com', subject: 'Carbon Neutral Delivery Speed', message: 'Hi! How fast does standard delivery ship to Mumbai?' },
          { senderName: 'Bob Smith', senderEmail: 'bob@gmail.com', subject: 'Insulated Lid replacement', message: 'Hello, can I order replacement cap seals separately?' },
        ],
      });
    }

    const messages = await prisma.customerMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 14. PUT /seller/messages/:id (Reply message)
router.put('/seller/messages/:id', async (req: Request, res: Response) => {
  try {
    const { reply } = req.body;
    const msgId = req.params.id;

    const existing = await prisma.customerMessage.findUnique({ where: { id: msgId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const updated = await prisma.customerMessage.update({
      where: { id: msgId },
      data: { reply },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Reply message error:', error);
    res.status(500).json({ success: false, message: 'Server reply error.' });
  }
});

export default router;
