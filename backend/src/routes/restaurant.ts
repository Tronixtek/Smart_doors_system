import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  BillingFolio,
  ChargeCategory,
  ChargeStatus,
  FolioStatus,
  MenuCategory,
  MenuItem,
  PaymentStatus,
  Reservation,
  RestaurantOrder,
  RestaurantOrderStatus,
  RestaurantTable,
  RestaurantTableStatus,
  Room,
} from '../models';
import { verifyToken, requireAdminOrManager, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

router.use(verifyToken);

const toObjectId = (value: any) => {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null) {
    return value._id || value.id;
  }
  return value;
};

async function ensureActiveReservationFolio(reservationId: string) {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new Error('Reservation not found');
  }

  let folio = await BillingFolio.findOne({
    reservationId,
    status: { $in: [FolioStatus.OPEN, FolioStatus.SETTLED] },
  });

  if (!folio) {
    folio = await BillingFolio.create({
      reservationId,
      roomId: toObjectId(reservation.roomId),
      guestName: reservation.guestName,
      status: FolioStatus.OPEN,
    });
  }

  return folio;
}

router.get('/stats', requireStaff, async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [tables, activeMenuItems, openOrders, servedToday, postedToRoom] = await Promise.all([
      RestaurantTable.countDocuments(),
      MenuItem.countDocuments({ isActive: true }),
      RestaurantOrder.countDocuments({ status: { $in: [RestaurantOrderStatus.OPEN, RestaurantOrderStatus.IN_PREPARATION, RestaurantOrderStatus.READY, RestaurantOrderStatus.SERVED] } }),
      RestaurantOrder.aggregate([
        { $match: { closedAt: { $gte: today }, status: RestaurantOrderStatus.CLOSED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      RestaurantOrder.countDocuments({ postedToFolio: true }),
    ]);

    res.json({
      data: {
        tables,
        activeMenuItems,
        openOrders,
        servedRevenueToday: servedToday[0]?.total || 0,
        postedToRoom,
      },
    });
  } catch (error) {
    console.error('Get restaurant stats error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant statistics' });
  }
});

router.get('/tables', requireStaff, async (_req: Request, res: Response) => {
  try {
    const tables = await RestaurantTable.find().sort({ area: 1, tableNumber: 1 });
    res.json({ data: tables });
  } catch (error) {
    console.error('Get restaurant tables error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant tables' });
  }
});

router.post(
  '/tables',
  requireAdminOrManager,
  auditLog(AuditAction.RESTAURANT_TABLE_UPDATED, (req) => `Restaurant table created: ${req.body.tableNumber}`),
  async (req: Request, res: Response) => {
    try {
      const table = await RestaurantTable.create({
        tableNumber: String(req.body.tableNumber || '').trim(),
        area: String(req.body.area || 'Main Dining').trim(),
        capacity: Number(req.body.capacity || 1),
        status: Object.values(RestaurantTableStatus).includes(req.body.status)
          ? req.body.status
          : RestaurantTableStatus.AVAILABLE,
      });

      res.status(201).json({ data: table });
    } catch (error: any) {
      console.error('Create restaurant table error:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Table number already exists' });
      }
      res.status(500).json({ error: 'Failed to create restaurant table' });
    }
  }
);

router.patch(
  '/tables/:id',
  requireAdminOrManager,
  auditLog(AuditAction.RESTAURANT_TABLE_UPDATED, (req) => `Restaurant table updated: ${req.params.id}`),
  async (req: Request, res: Response) => {
    try {
      const table = await RestaurantTable.findByIdAndUpdate(
        req.params.id,
        {
          tableNumber: req.body.tableNumber,
          area: req.body.area,
          capacity: req.body.capacity,
          status: req.body.status,
        },
        { new: true, runValidators: true }
      );

      if (!table) {
        return res.status(404).json({ error: 'Restaurant table not found' });
      }

      res.json({ data: table });
    } catch (error) {
      console.error('Update restaurant table error:', error);
      res.status(500).json({ error: 'Failed to update restaurant table' });
    }
  }
);

router.get('/menu', requireStaff, async (req: Request, res: Response) => {
  try {
    const activeOnly = String(req.query.activeOnly || '') === 'true';
    const filter = activeOnly ? { isActive: true } : {};
    const menu = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ data: menu });
  } catch (error) {
    console.error('Get restaurant menu error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

router.post(
  '/menu',
  requireAdminOrManager,
  auditLog(AuditAction.RESTAURANT_MENU_UPDATED, (req) => `Restaurant menu item created: ${req.body.name}`),
  async (req: Request, res: Response) => {
    try {
      const item = await MenuItem.create({
        name: String(req.body.name || '').trim(),
        category: Object.values(MenuCategory).includes(req.body.category) ? req.body.category : MenuCategory.OTHER,
        price: Number(req.body.price || 0),
        preparationStation: req.body.preparationStation ? String(req.body.preparationStation).trim() : undefined,
        description: req.body.description ? String(req.body.description).trim() : undefined,
        isActive: req.body.isActive !== false,
      });

      res.status(201).json({ data: item });
    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);

router.patch(
  '/menu/:id',
  requireAdminOrManager,
  auditLog(AuditAction.RESTAURANT_MENU_UPDATED, (req) => `Restaurant menu item updated: ${req.params.id}`),
  async (req: Request, res: Response) => {
    try {
      const item = await MenuItem.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          category: req.body.category,
          price: req.body.price,
          preparationStation: req.body.preparationStation,
          description: req.body.description,
          isActive: req.body.isActive,
        },
        { new: true, runValidators: true }
      );

      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      res.json({ data: item });
    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

router.get('/orders', requireStaff, async (_req: Request, res: Response) => {
  try {
    const orders = await RestaurantOrder.find()
      .populate('tableId', 'tableNumber area capacity status')
      .populate('reservationId', 'confirmationNumber guestName status')
      .populate('roomId', 'roomNumber roomType floor')
      .populate('folioId', 'guestName status totals');

    res.json({ data: orders });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant orders' });
  }
});

router.post(
  '/orders',
  requireStaff,
  auditLog(AuditAction.RESTAURANT_ORDER_CREATED, (req) => `Restaurant order created for ${req.body.guestName || req.body.reservationId || req.body.tableId}`),
  async (req: Request, res: Response) => {
    try {
      const rawItems: Array<{ menuItemId: string; quantity?: number; notes?: string }> = Array.isArray(req.body.items) ? req.body.items : [];
      if (rawItems.length === 0) {
        return res.status(400).json({ error: 'At least one order item is required' });
      }

      const menuItemIds = rawItems.map((item) => item.menuItemId).filter(Boolean);
      const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
      const menuMap = new Map(menuItems.map((item) => [String(item._id), item]));

      const items = rawItems.map((item) => {
        const menuItem = menuMap.get(String(item.menuItemId));
        if (!menuItem) {
          throw new Error(`Menu item not found: ${item.menuItemId}`);
        }

        const quantity = Number(item.quantity || 1);
        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          category: menuItem.category,
          quantity,
          unitPrice: Number(menuItem.price || 0),
          lineTotal: Number(menuItem.price || 0) * quantity,
          notes: item.notes ? String(item.notes).trim() : undefined,
        };
      });

      let guestName = req.body.guestName ? String(req.body.guestName).trim() : '';
      let roomId = req.body.roomId;

      if (req.body.reservationId) {
        const reservation = await Reservation.findById(req.body.reservationId);
        if (!reservation) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
        guestName = guestName || reservation.guestName;
        roomId = roomId || toObjectId(reservation.roomId);
      }

      if (roomId) {
        const room = await Room.findById(roomId);
        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }
      }

      const order = await RestaurantOrder.create({
        tableId: req.body.tableId || undefined,
        reservationId: req.body.reservationId || undefined,
        roomId: roomId || undefined,
        guestName: guestName || undefined,
        status: Object.values(RestaurantOrderStatus).includes(req.body.status) ? req.body.status : RestaurantOrderStatus.OPEN,
        items,
        serviceCharge: Number(req.body.serviceCharge || 0),
        taxAmount: Number(req.body.taxAmount || 0),
        notes: req.body.notes ? String(req.body.notes).trim() : undefined,
      });

      if (req.body.tableId) {
        await RestaurantTable.findByIdAndUpdate(req.body.tableId, { status: RestaurantTableStatus.OCCUPIED });
      }

      const populated = await RestaurantOrder.findById(order._id)
        .populate('tableId', 'tableNumber area capacity status')
        .populate('reservationId', 'confirmationNumber guestName status')
        .populate('roomId', 'roomNumber roomType floor')
        .populate('folioId', 'guestName status totals');

      res.status(201).json({ data: populated });
    } catch (error: any) {
      console.error('Create restaurant order error:', error);
      res.status(500).json({ error: error.message || 'Failed to create restaurant order' });
    }
  }
);

router.patch(
  '/orders/:id/status',
  requireStaff,
  auditLog(AuditAction.RESTAURANT_ORDER_UPDATED, (req) => `Restaurant order ${req.params.id} status changed to ${req.body.status}`),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!Object.values(RestaurantOrderStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const order = await RestaurantOrder.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Restaurant order not found' });
      }

      order.status = status;
      await order.save();

      if ([RestaurantOrderStatus.CLOSED, RestaurantOrderStatus.CANCELLED].includes(status) && order.tableId) {
        await RestaurantTable.findByIdAndUpdate(order.tableId, { status: RestaurantTableStatus.AVAILABLE });
      }

      res.json({ data: order });
    } catch (error) {
      console.error('Update restaurant order status error:', error);
      res.status(500).json({ error: 'Failed to update restaurant order status' });
    }
  }
);

router.post(
  '/orders/:id/post-to-room',
  requireStaff,
  auditLog(AuditAction.RESTAURANT_ORDER_UPDATED, (req) => `Restaurant order ${req.params.id} posted to room folio`),
  async (req: Request, res: Response) => {
    try {
      const order = await RestaurantOrder.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Restaurant order not found' });
      }

      if (order.postedToFolio) {
        return res.status(409).json({ error: 'This order has already been posted to a folio' });
      }

      let folio = req.body.folioId ? await BillingFolio.findById(req.body.folioId) : null;

      if (!folio && order.reservationId) {
        folio = await ensureActiveReservationFolio(String(order.reservationId));
      }

      if (!folio) {
        return res.status(400).json({ error: 'A reservation-linked folio is required to post this order to room' });
      }

      folio.charges.push({
        description: `Restaurant order ${order.orderNumber}`,
        category: ChargeCategory.RESTAURANT,
        source: 'RESTAURANT',
        quantity: 1,
        amount: Number(order.totalAmount || 0),
        total: Number(order.totalAmount || 0),
        notes: order.notes,
        externalRef: order.orderNumber,
        postedAt: new Date(),
        postedBy: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        status: ChargeStatus.POSTED,
      });

      if (folio.status === FolioStatus.CLOSED) {
        folio.status = FolioStatus.OPEN;
      }

      await folio.save();

      order.postedToFolio = true;
      order.postedAt = new Date();
      order.folioId = folio._id as mongoose.Types.ObjectId;
      await order.save();

      const populated = await RestaurantOrder.findById(order._id)
        .populate('tableId', 'tableNumber area capacity status')
        .populate('reservationId', 'confirmationNumber guestName status')
        .populate('roomId', 'roomNumber roomType floor')
        .populate('folioId', 'guestName status totals');

      res.json({ data: populated });
    } catch (error: any) {
      console.error('Post restaurant order to room error:', error);
      res.status(500).json({ error: error.message || 'Failed to post restaurant order to room' });
    }
  }
);

export default router;
