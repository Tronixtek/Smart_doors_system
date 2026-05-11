import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  BillingFolio,
  ChargeCategory,
  ChargeStatus,
  FolioStatus,
  PaymentMethod,
  PaymentStatus,
  Reservation,
} from '../models';
import { verifyToken, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

router.use(verifyToken);
router.use(requireStaff);

const toObjectId = (value: any) => {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null) {
    return value._id || value.id;
  }
  return value;
};

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalFolios, openFolios, settledFolios, closedFolios, outstanding, charges, payments] = await Promise.all([
      BillingFolio.countDocuments(),
      BillingFolio.countDocuments({ status: FolioStatus.OPEN }),
      BillingFolio.countDocuments({ status: FolioStatus.SETTLED }),
      BillingFolio.countDocuments({ status: FolioStatus.CLOSED }),
      BillingFolio.aggregate([
        { $match: { status: { $in: [FolioStatus.OPEN, FolioStatus.SETTLED] } } },
        { $group: { _id: null, balance: { $sum: '$totals.balanceDue' } } },
      ]),
      BillingFolio.aggregate([
        { $unwind: '$charges' },
        { $match: { 'charges.status': ChargeStatus.POSTED } },
        { $group: { _id: null, total: { $sum: '$charges.total' } } },
      ]),
      BillingFolio.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.status': PaymentStatus.RECORDED } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } },
      ]),
    ]);

    res.json({
      data: {
        totalFolios,
        openFolios,
        settledFolios,
        closedFolios,
        outstandingBalance: outstanding[0]?.balance || 0,
        postedCharges: charges[0]?.total || 0,
        recordedPayments: payments[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({ error: 'Failed to fetch billing statistics' });
  }
});

router.get('/folios/reservation/:reservationId', async (req: Request, res: Response) => {
  try {
    const folios = await BillingFolio.find({ reservationId: req.params.reservationId })
      .populate('reservationId', 'confirmationNumber guestName status checkInDate checkOutDate')
      .populate('roomId', 'roomNumber roomType floor')
      .sort({ openedAt: -1 });

    res.json({ data: folios });
  } catch (error) {
    console.error('Get folios by reservation error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation folios' });
  }
});

router.get('/folios', async (req: Request, res: Response) => {
  try {
    const { status, reservationId, roomId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (reservationId) filter.reservationId = reservationId;
    if (roomId) filter.roomId = roomId;

    const folios = await BillingFolio.find(filter)
      .populate('reservationId', 'confirmationNumber guestName status checkInDate checkOutDate')
      .populate('roomId', 'roomNumber roomType floor')
      .sort({ openedAt: -1 });

    res.json({ data: folios });
  } catch (error) {
    console.error('Get folios error:', error);
    res.status(500).json({ error: 'Failed to fetch folios' });
  }
});

router.get('/folios/:id', async (req: Request, res: Response) => {
  try {
    const folio = await BillingFolio.findById(req.params.id)
      .populate('reservationId', 'confirmationNumber guestName status checkInDate checkOutDate')
      .populate('roomId', 'roomNumber roomType floor')
      .populate('charges.postedBy', 'firstName lastName email')
      .populate('payments.recordedBy', 'firstName lastName email');

    if (!folio) {
      return res.status(404).json({ error: 'Folio not found' });
    }

    res.json({ data: folio });
  } catch (error) {
    console.error('Get folio error:', error);
    res.status(500).json({ error: 'Failed to fetch folio' });
  }
});

router.post(
  '/folios',
  auditLog(AuditAction.FOLIO_CREATED, (req) => `Billing folio created for ${req.body.guestName || req.body.reservationId}`),
  async (req: Request, res: Response) => {
    try {
      const { reservationId, roomId, guestName, status } = req.body;

      let resolvedGuestName = String(guestName || '').trim();
      let resolvedRoomId = roomId;

      if (reservationId) {
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
          return res.status(404).json({ error: 'Reservation not found' });
        }

        const existing = await BillingFolio.findOne({
          reservationId,
          status: { $in: [FolioStatus.OPEN, FolioStatus.SETTLED] },
        });

        if (existing) {
          return res.status(409).json({ error: 'An active folio already exists for this reservation' });
        }

        resolvedGuestName = resolvedGuestName || reservation.guestName;
        resolvedRoomId = resolvedRoomId || toObjectId(reservation.roomId);
      }

      if (!resolvedGuestName) {
        return res.status(400).json({ error: 'Guest name is required to open a folio' });
      }

      const folio = await BillingFolio.create({
        reservationId: reservationId || undefined,
        roomId: resolvedRoomId || undefined,
        guestName: resolvedGuestName,
        status: Object.values(FolioStatus).includes(status) ? status : FolioStatus.OPEN,
      });

      const populated = await BillingFolio.findById(folio._id)
        .populate('reservationId', 'confirmationNumber guestName status checkInDate checkOutDate')
        .populate('roomId', 'roomNumber roomType floor');

      res.status(201).json({ data: populated });
    } catch (error) {
      console.error('Create folio error:', error);
      res.status(500).json({ error: 'Failed to create billing folio' });
    }
  }
);

router.post(
  '/folios/:id/charges',
  auditLog(AuditAction.FOLIO_UPDATED, (req) => `Charge posted to folio ${req.params.id}`),
  async (req: Request, res: Response) => {
    try {
      const folio = await BillingFolio.findById(req.params.id);
      if (!folio) {
        return res.status(404).json({ error: 'Folio not found' });
      }

      const quantity = Number(req.body.quantity || 1);
      const amount = Number(req.body.amount || 0);

      if (!req.body.description || amount <= 0 || quantity <= 0) {
        return res.status(400).json({ error: 'A valid description, amount, and quantity are required' });
      }

      folio.charges.push({
        description: String(req.body.description).trim(),
        category: Object.values(ChargeCategory).includes(req.body.category) ? req.body.category : ChargeCategory.OTHER,
        source: String(req.body.source || 'MANUAL').trim(),
        quantity,
        amount,
        total: quantity * amount,
        notes: req.body.notes ? String(req.body.notes).trim() : undefined,
        externalRef: req.body.externalRef ? String(req.body.externalRef).trim() : undefined,
        postedAt: new Date(),
        postedBy: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        status: ChargeStatus.POSTED,
      });

      if (folio.status === FolioStatus.CLOSED) {
        folio.status = FolioStatus.OPEN;
      }

      await folio.save();

      res.json({ data: folio });
    } catch (error) {
      console.error('Post folio charge error:', error);
      res.status(500).json({ error: 'Failed to post folio charge' });
    }
  }
);

router.post(
  '/folios/:id/payments',
  auditLog(AuditAction.PAYMENT_RECORDED, (req) => `Payment recorded against folio ${req.params.id}`),
  async (req: Request, res: Response) => {
    try {
      const folio = await BillingFolio.findById(req.params.id);
      if (!folio) {
        return res.status(404).json({ error: 'Folio not found' });
      }

      const amount = Number(req.body.amount || 0);
      if (amount <= 0) {
        return res.status(400).json({ error: 'A valid payment amount is required' });
      }

      folio.payments.push({
        amount,
        method: Object.values(PaymentMethod).includes(req.body.method) ? req.body.method : PaymentMethod.CASH,
        reference: req.body.reference ? String(req.body.reference).trim() : undefined,
        notes: req.body.notes ? String(req.body.notes).trim() : undefined,
        recordedAt: new Date(),
        recordedBy: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        status: PaymentStatus.RECORDED,
      });

      await folio.save();

      folio.status = folio.totals.balanceDue <= 0 ? FolioStatus.SETTLED : FolioStatus.OPEN;
      await folio.save();

      res.json({ data: folio });
    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({ error: 'Failed to record folio payment' });
    }
  }
);

router.patch(
  '/folios/:id/status',
  auditLog(AuditAction.FOLIO_UPDATED, (req) => `Folio ${req.params.id} status changed to ${req.body.status}`),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!Object.values(FolioStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid folio status' });
      }

      const folio = await BillingFolio.findById(req.params.id);
      if (!folio) {
        return res.status(404).json({ error: 'Folio not found' });
      }

      if (status === FolioStatus.CLOSED && folio.totals.balanceDue > 0) {
        return res.status(400).json({ error: 'Cannot close a folio with an outstanding balance' });
      }

      folio.status = status;
      await folio.save();

      res.json({ data: folio });
    } catch (error) {
      console.error('Update folio status error:', error);
      res.status(500).json({ error: 'Failed to update folio status' });
    }
  }
);

export default router;
