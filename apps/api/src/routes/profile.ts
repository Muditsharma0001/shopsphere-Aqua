import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();

// Helper to extract user or fallback to first user
async function resolveUser(req: Request) {
  // 1. Check accessToken cookie first
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback_access_secret_key';
      const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
      if (decoded && decoded.id) {
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (user) return user;
      }
    } catch (err) {
      console.error('[resolveUser cookie decoding error]:', err);
    }
  }

  // 2. Check query/body parameters
  const userId = (req.query.userId as string) || (req.body.userId as string);
  
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  // Fallback to first user in database
  const firstUser = await prisma.user.findFirst();
  if (firstUser) return firstUser;

  // Fallback to creating a test user if database has absolutely no records
  return await prisma.user.create({
    data: {
      email: 'customer@shopsphere.com',
      name: 'Aqua Enthusiast',
      role: 'CUSTOMER',
      rewardPoints: 150,
      membershipLevel: 'SILVER',
      isVerified: true,
    },
  });
}

// 1. GET /profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 2. PUT /profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const { name, email, phone, avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 3. GET /addresses
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 4. POST /addresses
router.post('/addresses', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const { fullName, phone, email, country, state, city, zip, address, isDefault } = req.body;

    if (isDefault) {
      // unset current defaults
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        email,
        country: country || 'India',
        state,
        city,
        zip,
        address,
        isDefault: !!isDefault,
      },
    });

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ success: false, message: 'Server create error.' });
  }
});

// 5. PUT /addresses/:id
router.put('/addresses/:id', async (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, country, state, city, zip, address, isDefault } = req.body;
    const addrId = req.params.id;

    const existing = await prisma.address.findUnique({ where: { id: addrId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: existing.userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addrId },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        zip: zip || undefined,
        address: address || undefined,
        isDefault: isDefault !== undefined ? !!isDefault : undefined,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 6. DELETE /addresses/:id
router.delete('/addresses/:id', async (req: Request, res: Response) => {
  try {
    const addrId = req.params.id;
    const existing = await prisma.address.findUnique({ where: { id: addrId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    await prisma.address.delete({ where: { id: addrId } });
    res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Server delete error.' });
  }
});

// 7. GET /notifications
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    
    // Seed some initial welcome notifications if empty
    const count = await prisma.notification.count({ where: { userId: user.id } });
    if (count === 0) {
      await prisma.notification.createMany({
        data: [
          { userId: user.id, title: 'Order Confirmed', message: 'Your ShopSphere Aqua Pro order ORD_90812 has been confirmed.', type: 'ORDER', isRead: false },
          { userId: user.id, title: 'Welcome Reward Points', message: 'You have been awarded 150 points for registering with Aqua.', type: 'UPDATE', isRead: false },
          { userId: user.id, title: 'Limited Drop Alert', message: 'Alpine Gold edition is back in stock. Check collections.', type: 'OFFER', isRead: true },
        ],
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 8. PUT /notifications/read
router.put('/notifications/read', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const { notificationId } = req.body;

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.id },
        data: { isRead: true },
      });
    }

    res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Server update error.' });
  }
});

// 9. GET /rewards
router.get('/rewards', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    res.status(200).json({
      success: true,
      data: {
        points: user.rewardPoints,
        referralBonus: 25.00,
        membershipLevel: user.membershipLevel,
        coupons: [
          { code: 'AQUA20', discount: '20% Off', description: 'Applicable on any Smart container' },
          { code: 'FREESHIP', discount: 'Free Cargo', description: 'Zero shipping costs on any orders' },
        ],
      },
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 10. GET /warranty
router.get('/warranty', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const warranties = await prisma.warranty.findMany({
      where: { userId: user.id },
      orderBy: { activationDate: 'desc' },
    });
    res.status(200).json({ success: true, data: warranties });
  } catch (error) {
    console.error('Get warranties error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error.' });
  }
});

// 11. POST /warranty/register
router.post('/warranty/register', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const { serialNumber, purchaseDate, productModel } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ success: false, message: 'Serial number is required.' });
    }

    const newWarranty = await prisma.warranty.create({
      data: {
        userId: user.id,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        productModel: productModel || 'Aqua Pro',
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, data: newWarranty });
  } catch (error) {
    console.error('Register warranty error:', error);
    res.status(500).json({ success: false, message: 'Server register error.' });
  }
});

export default router;
