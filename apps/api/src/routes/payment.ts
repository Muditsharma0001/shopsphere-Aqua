import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const router = Router();

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id';
const keySecret = process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret';

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// Helper to calculate grand total
function calculateTotalCost(items: any[], couponCode: string | null) {
  const subtotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
  
  let discountPercent = 0;
  if (couponCode === 'AQUA20') {
    discountPercent = 20;
  }
  
  const discountCost = (subtotal * discountPercent) / 100;
  const shippingCost = subtotal > 150 || subtotal === 0 ? 0 : 9.99;
  const gstCost = (subtotal - discountCost) * 0.05;
  const grandTotal = Math.max(0, subtotal - discountCost + shippingCost + gstCost);
  
  return {
    subtotal,
    discountCost,
    shippingCost,
    gstCost,
    grandTotal,
  };
}

// 1. Create Checkout & Razorpay Order
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingMethod,
      couponCode,
      items, // array of { productId, productName, productPrice, quantity, color, capacity }
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Shopping cart is empty.' });
    }

    const { subtotal, discountCost, shippingCost, gstCost, grandTotal } = calculateTotalCost(items, couponCode);
    const orderNumber = `ORD_${Date.now()}`;

    // Create Razorpay Order
    let razorpayOrderId: string | null = null;
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(grandTotal * 100), // paise
        currency: 'INR',
        receipt: orderNumber,
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn('Razorpay order creation skipped/failed:', rzpErr);
      // Mock Razorpay order ID if keys are invalid to allow test checkout flow
      razorpayOrderId = `rzp_mock_${Date.now()}`;
    }

    // Save Order to PostgreSQL
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingMethod,
        shippingCost,
        gstCost,
        discountCost,
        subtotal,
        grandTotal,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        razorpayOrderId,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            color: item.color,
            capacity: item.capacity,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        order,
        razorpayOrderId,
        razorpayKeyId: keyId,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Server checkout error occurred.' });
  }
});

// 2. Verify Payment Signature
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderNumber,
    } = req.body;

    const secret = keySecret;
    let isVerified = false;

    if (razorpay_signature) {
      const generatedSig = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      
      isVerified = generatedSig === razorpay_signature;
    } else {
      // Mock verification for mock keys
      isVerified = razorpay_order_id.startsWith('rzp_mock_');
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (isVerified) {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          razorpayPaymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
        },
      });
      return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
    } else {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'FAILED',
        },
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server verification error occurred.' });
  }
});

// 3. Get Orders List (with optional userId filter)
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const orders = await prisma.order.findMany({
      where: userId ? { userId } : {},
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error occurred.' });
  }
});

// 4. Get Single Order Detail
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ success: false, message: 'Server fetch error occurred.' });
  }
});

// 5. Generate Dynamic PDF Invoice
router.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return res.status(404).send('Order not found.');
    }

    // Generate Invoice PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Stream PDF to HTTP response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderNumber}.pdf`);
    doc.pipe(res);

    // 1. Header (Company details)
    doc.fillColor('#0f172a').fontSize(20).text('SHOPSPHERE AQUA INC.', 50, 50, { align: 'left' });
    doc.fontSize(8).fillColor('#64748b').text('Thermal Computational Engineering Labs', 50, 75);
    doc.text('GSTIN: 27AAPCS1234F1Z5', 50, 88);

    doc.fillColor('#0f172a').fontSize(12).text('TAX INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(8).fillColor('#64748b').text(`Invoice #: INV-${order.orderNumber.split('_')[1]}`, 400, 70, { align: 'right' });
    doc.text(`Order Date: ${order.createdAt.toLocaleDateString()}`, 400, 82, { align: 'right' });
    doc.text(`Payment: ${order.paymentStatus}`, 400, 94, { align: 'right' });

    // Divider Line
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();

    // 2. Customer & Address Details
    doc.fillColor('#0f172a').fontSize(10).text('Billed To:', 50, 140, { underline: true });
    doc.fillColor('#334155').text(order.customerName, 50, 155);
    doc.text(order.customerEmail, 50, 168);
    doc.text(order.customerPhone, 50, 181);
    doc.text(order.shippingAddress, 50, 194, { width: 220 });

    // Shipping Details
    doc.fillColor('#0f172a').text('Shipping Mode:', 350, 140, { underline: true });
    doc.fillColor('#334155').text(order.shippingMethod, 350, 155);
    doc.text(`Gate lock Status: ${order.status}`, 350, 168);

    // 3. QR Code Embed (Generates containing order tracking URL)
    try {
      const qrData = `https://shopsphere.com/orders/${order.id}`;
      const qrImageBuffer = await QRCode.toBuffer(qrData, { width: 70, margin: 1 });
      doc.image(qrImageBuffer, 480, 150, { width: 60 });
    } catch (qrErr) {
      console.warn('QR Code generation skipped in PDF:', qrErr);
    }

    // Divider Line
    doc.strokeColor('#e2e8f0').moveTo(50, 260).lineTo(550, 260).stroke();

    // 4. Items Table Header
    doc.fillColor('#0f172a').fontSize(9).text('Item Description', 50, 280);
    doc.text('Color / Size', 220, 280);
    doc.text('Qty', 350, 280, { align: 'center' });
    doc.text('Price', 420, 280, { align: 'right' });
    doc.text('Total', 490, 280, { align: 'right' });

    doc.strokeColor('#cbd5e1').moveTo(50, 295).lineTo(550, 295).stroke();

    // Items List
    let currentY = 310;
    order.orderItems.forEach((item) => {
      doc.fillColor('#334155').fontSize(8).text(item.productName, 50, currentY, { width: 160 });
      doc.text(`${item.color} / ${item.capacity}`, 220, currentY);
      doc.text(item.quantity.toString(), 350, currentY, { align: 'center' });
      doc.text(`$${item.productPrice.toFixed(2)}`, 420, currentY, { align: 'right' });
      doc.text(`$${(item.productPrice * item.quantity).toFixed(2)}`, 490, currentY, { align: 'right' });
      currentY += 25;
    });

    // Divider Line
    doc.strokeColor('#cbd5e1').moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;

    // 5. Total Calculations block
    doc.fillColor('#334155').fontSize(9).text('Subtotal:', 380, currentY, { align: 'left' });
    doc.text(`$${order.subtotal.toFixed(2)}`, 490, currentY, { align: 'right' });
    currentY += 15;

    if (order.discountCost > 0) {
      doc.fillColor('#10b981').text('Promo Discount:', 380, currentY, { align: 'left' });
      doc.text(`-$${order.discountCost.toFixed(2)}`, 490, currentY, { align: 'right' });
      currentY += 15;
    }

    doc.fillColor('#334155').text('Carbon Free Shipping:', 380, currentY, { align: 'left' });
    doc.text(`$${order.shippingCost.toFixed(2)}`, 490, currentY, { align: 'right' });
    currentY += 15;

    doc.text('GST (5%):', 380, currentY, { align: 'left' });
    doc.text(`$${order.gstCost.toFixed(2)}`, 490, currentY, { align: 'right' });
    currentY += 20;

    doc.strokeColor('#e2e8f0').moveTo(350, currentY - 5).lineTo(550, currentY - 5).stroke();

    doc.fillColor('#0f172a').fontSize(11).text('Grand Total (USD):', 380, currentY, { align: 'left' });
    doc.text(`$${order.grandTotal.toFixed(2)}`, 490, currentY, { align: 'right' });

    // Footer info
    doc.fillColor('#94a3b8').fontSize(7).text('This is a computer-generated tax invoice and requires no physical signature.', 50, 720, { align: 'center' });
    doc.text('Thank you for choosing ShopSphere Aqua Series.', 50, 735, { align: 'center' });

    // Finalize
    doc.end();
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).send('Server error generating invoice PDF.');
  }
});

export default router;
