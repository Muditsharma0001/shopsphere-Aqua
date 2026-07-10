import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/business/dashboard
router.get('/business/dashboard', async (req: Request, res: Response) => {
  try {
    // Gather database indices
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.findMany({ where: { paymentStatus: 'PAID' } });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const conversionRate = 3.8;
    const topProducts = [
      { id: '1', name: 'Smart Bottle - Silver Matte', sales: 420, revenue: 39900 },
      { id: '2', name: 'Explorer Bottle - Aurora Blue', sales: 380, revenue: 20900 },
      { id: '3', name: 'Sports Bottle - Velvet Purple', sales: 210, revenue: 8190 }
    ];

    const warehouses = [
      { id: 'wh-1', name: 'East Coast Distribution Center', location: 'Newark, NJ', stock: 12500, status: 'Normal' },
      { id: 'wh-2', name: 'West Coast Supply Depot', location: 'Oakland, CA', stock: 6100, status: 'Normal' }
    ];

    const lowStockAlerts = [
      { id: 'p-1', name: 'Smart Bottle Cap - Chrome Blue', stock: 5, status: 'CRITICAL' },
      { id: 'p-2', name: 'Carbon Filter Pack', stock: 14, status: 'LOW' }
    ];

    const integrations = [
      { id: 'cloudinary', name: 'Cloudinary Media Storage', status: 'Connected', key: 'cloud_name=hydraflow' },
      { id: 'gemini', name: 'Google Gemini AI', status: 'Connected', key: 'api_version=v1beta' },
      { id: 'razorpay', name: 'Razorpay Checkout Gateway', status: 'Connected', key: 'rzp_live_••••' },
      { id: 'neon', name: 'Neon Serverless PostgreSQL', status: 'Connected', key: 'pooler=active' }
    ];

    const sessions = [
      { id: 'sess-1', device: 'MacBook Pro - Safari', location: 'San Francisco, CA', active: true, time: 'Current Session' },
      { id: 'sess-2', device: 'iPhone 15 - Chrome', location: 'Los Angeles, CA', active: false, time: '2 hours ago' }
    ];

    const backups = [
      { id: 'backup-1', name: 'HydraFlow Main Database - Backup v1.42', time: 'Today at 02:00 AM', size: '4.8 MB' },
      { id: 'backup-2', name: 'HydraFlow Main Database - Weekly Checkpoint', time: 'July 3, 2026', size: '4.5 MB' }
    ];

    const homepageSections = [
      { id: 'sec-1', name: 'Announcement Bar', visible: true, position: 1 },
      { id: 'sec-2', name: 'Hero (3D Animation scroll block)', visible: true, position: 2 },
      { id: 'sec-3', name: 'Featured Collections Grid', visible: true, position: 3 },
      { id: 'sec-4', name: 'HydraFlow Tech Showcase', visible: true, position: 4 },
      { id: 'sec-5', name: 'Customer Testimonials', visible: true, position: 5 }
    ];

    const systemLogs = [
      { time: '18:04:12', type: 'INFO', message: 'Razorpay webhook callback verified. Order #1042 marked paid.' },
      { time: '17:58:33', type: 'INFO', message: 'Gemini AI cached model session refreshed successfully.' },
      { time: '17:12:05', type: 'WARN', message: 'Neon Pooler hit 85% connection capacity limit. Rescaled pool size.' }
    ];

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        conversionRate,
        topProducts,
        warehouses,
        lowStockAlerts,
        integrations,
        sessions,
        backups,
        homepageSections,
        systemLogs
      }
    });
  } catch (error) {
    console.error('Business OS API Error:', error);
    res.status(500).json({ success: false, message: 'Server business OS error.' });
  }
});

export default router;
