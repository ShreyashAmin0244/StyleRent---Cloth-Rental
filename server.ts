import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// The administrator security PIN
const ADMIN_PIN = process.env.ADMIN_PIN || '996946';

app.use(express.json());

// In-memory session store for verified Admin/Staff tokens
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, AdminSession>();

// In-memory store for orders and database tracking on the server
let serverOrders: any[] = [
  {
    id: 'ord-801',
    orderNumber: 'SR-10842',
    createdAt: '2026-10-10T14:30:00.000Z',
    customer: {
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '9820144521',
      address: 'Flat 402, Sea Green Apartments, Worli Sea Face',
      city: 'Mumbai',
      pincode: '400018',
    },
    items: [
      {
        cartItemId: 'item-801',
        product: {
          id: 'prod-01',
          name: 'Emerald Green Designer Zardozi Lehenga',
          category: 'Lehenga',
          rentalPrice3d: 1999,
          retailPrice: 42000,
          securityDeposit: 2500,
        },
        selectedSize: 'M',
        rentalDuration: '3_days',
        rentalDays: 3,
        startDate: '2026-10-25',
        deliveryDate: '2026-10-24',
        returnDate: '2026-10-28',
        rentalFee: 1999,
        securityDeposit: 2500,
        fittingOption: 'custom',
        backupOption: 'backup_size',
        backupSize: 'L',
        backupPrice: 399,
        damageProtection: true,
        damageProtectionPrice: 299,
      },
    ],
    pricing: {
      rentalSubtotal: 1999,
      securityDepositTotal: 2500,
      backupOptionsTotal: 399,
      damageProtectionTotal: 299,
      deliveryFee: 0,
      grandTotal: 5197,
    },
    payment: {
      method: 'UPI',
      upiProvider: 'PhonePe',
      transactionId: 'TXN_98102381',
      status: 'Paid',
    },
    orderStatus: 'Delivered',
    returnBagTracking: 'DELHIVERY-RT-981023',
  },
  {
    id: 'ord-802',
    orderNumber: 'SR-10855',
    createdAt: '2026-10-15T18:15:00.000Z',
    customer: {
      fullName: 'Rohan Mehra',
      email: 'rohan.mehra@example.com',
      phone: '9811233490',
      address: 'B-14, Greater Kailash 1',
      city: 'Delhi NCR',
      pincode: '110048',
    },
    items: [
      {
        cartItemId: 'item-802',
        product: {
          id: 'prod-02',
          name: 'Royal Maroon Embroidered Silk Sherwani',
          category: 'Sherwani',
          rentalPrice3d: 1499,
          retailPrice: 38000,
          securityDeposit: 2000,
        },
        selectedSize: 'L',
        rentalDuration: '3_days',
        rentalDays: 3,
        startDate: '2026-10-28',
        deliveryDate: '2026-10-27',
        returnDate: '2026-10-31',
        rentalFee: 1499,
        securityDeposit: 2000,
        fittingOption: 'standard',
        backupOption: 'none',
        backupPrice: 0,
        damageProtection: true,
        damageProtectionPrice: 299,
      },
    ],
    pricing: {
      rentalSubtotal: 1499,
      securityDepositTotal: 2000,
      backupOptionsTotal: 0,
      damageProtectionTotal: 299,
      deliveryFee: 0,
      grandTotal: 3798,
    },
    payment: {
      method: 'UPI',
      upiProvider: 'GooglePay',
      transactionId: 'TXN_98102450',
      status: 'Paid',
    },
    orderStatus: 'Preparing',
    returnBagTracking: 'DELHIVERY-RT-981045',
  },
];

// Middleware: Require Admin Authentication via Bearer Session Token
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Admin authentication required. Access denied.',
      authenticated: false,
    });
  }

  const token = authHeader.slice(7).trim();
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid session token. Access denied.',
      authenticated: false,
    });
  }

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({
      error: 'Unauthorized: Session expired. Please enter PIN again.',
      authenticated: false,
    });
  }

  // Extend sliding session window
  session.expiresAt = Date.now() + 4 * 60 * 60 * 1000;
  next();
}

/* ====================================================================
   AUTHENTICATION ENDPOINTS
   ==================================================================== */

// Verify Admin PIN on server
app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;

  if (!pin || String(pin).trim() !== ADMIN_PIN) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect PIN. Access denied.',
    });
  }

  // Generate cryptographically secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours

  activeSessions.set(token, {
    token,
    createdAt: Date.now(),
    expiresAt,
  });

  return res.json({
    success: true,
    token,
    expiresAt,
    message: 'PIN verified successfully. Access granted.',
  });
});

// Verify active session token
app.post('/api/admin/verify-session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body.token)?.trim();

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ valid: false, error: 'Session expired or invalid' });
  }

  return res.json({ valid: true, expiresAt: session.expiresAt });
});

// Admin Logout endpoint: Revokes session token
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body.token)?.trim();

  if (token) {
    activeSessions.delete(token);
  }

  return res.json({ success: true, message: 'Logged out successfully. Access locked.' });
});

/* ====================================================================
   PROTECTED ADMIN & DATABASE ENDPOINTS
   ==================================================================== */

// Protected: Get Database Records and Schema DDL
app.get('/api/admin/database-data', requireAdminAuth, (req, res) => {
  // Ordered products dynamically mapped from all orders
  const orderedProducts = serverOrders.flatMap((o) =>
    (o.items || []).map((item: any, idx: number) => ({
      row_id: `${o.orderNumber}-${idx + 1}`,
      order_number: o.orderNumber,
      product_id: item.product?.id || 'unknown',
      product_name: item.product?.name || 'Designer Outfit',
      customer_name: o.customer?.fullName || 'Customer',
      city: o.customer?.city || 'Mumbai',
      size: item.selectedSize || 'M',
      duration: `${item.rentalDays || 3} Days`,
      dates: `${item.startDate} to ${item.returnDate}`,
      rental_fee: item.rentalFee,
      deposit: item.securityDeposit,
      payment_method: o.payment?.bankName
        ? `NetBanking (${o.payment.bankName})`
        : o.payment?.upiProvider
        ? `UPI (${o.payment.upiProvider})`
        : o.payment?.method || 'UPI',
      order_status: o.orderStatus,
      timestamp: o.createdAt,
    }))
  );

  return res.json({
    success: true,
    tables: [
      { name: 'ordered_products', totalRows: orderedProducts.length, sampleRows: orderedProducts },
      { name: 'orders', totalRows: serverOrders.length, sampleRows: serverOrders },
    ],
    totalOrderedProductsCount: orderedProducts.length,
    totalOrdersCount: serverOrders.length,
  });
});

// Protected: Get full orders list for Admin Dashboard
app.get('/api/admin/orders', requireAdminAuth, (req, res) => {
  return res.json({
    success: true,
    orders: serverOrders,
  });
});

// Protected: Update order status from Admin Dashboard
app.post('/api/admin/orders/:orderId/status', requireAdminAuth, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const orderIndex = serverOrders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  serverOrders[orderIndex].orderStatus = status;
  return res.json({ success: true, order: serverOrders[orderIndex] });
});

/* ====================================================================
   PUBLIC CUSTOMER ENDPOINTS
   ==================================================================== */

// Public: Get current orders (for customer order tracking)
app.get('/api/orders', (req, res) => {
  return res.json({
    success: true,
    orders: serverOrders,
  });
});

// Public: Customer place order. Automatically updates database & admin state!
// Every product ordered/bought is updated as a new row in database!
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;

  if (!newOrder || !newOrder.orderNumber || !newOrder.items) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  // Prepend to server orders list so newest orders appear first
  serverOrders.unshift(newOrder);

  return res.status(201).json({
    success: true,
    message: 'Order created and recorded in database successfully',
    order: newOrder,
    totalOrdersNow: serverOrders.length,
    newRowsAdded: newOrder.items.length,
  });
});

/* ====================================================================
   VITE MIDDLEWARE / STATIC ASSETS
   ==================================================================== */
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('.', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('.', 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Style-Rent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
