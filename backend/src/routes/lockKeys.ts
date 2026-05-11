import { Router, Request, Response } from 'express';
import { LockKey, LockKeyType, LockKeyStatus } from '../models/LockKey';
import { Lock } from '../models/Lock';
import { Reservation } from '../models/Reservation';
import { Space } from '../models/Space';
import { Visit, VisitStatus } from '../models/Visit';
import { verifyToken, auditLog } from '../middleware/auth';
import { UserRole } from '../models/User';
import { AuditAction } from '../models/AuditLog';

const router = Router();

router.use(verifyToken);

const populateLockKey = (query: any) =>
  query
    .populate('lockId', 'lockName lockMac lockData')
    .populate('roomId', 'roomNumber roomType floor')
    .populate('reservationId', 'confirmationNumber guestName checkInDate checkOutDate')
    .populate('spaceId', 'name code site floor type status')
    .populate('visitId', 'title status startAt endAt')
    .populate('createdBy', 'firstName lastName email')
    .populate('revokedBy', 'firstName lastName email');

router.post(
  '/',
  auditLog(AuditAction.KEY_GENERATED, (req) =>
    `Key ${req.body.keyType} generated for ${req.body.visitId ? `office access ${req.body.visitId}` : `reservation ${req.body.reservationId}`}`
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        lockId,
        roomId,
        reservationId,
        spaceId,
        visitId,
        guestName,
        keyType,
        keyIdentifier,
        startDate,
        endDate,
        status,
        metadata,
      } = req.body;

      const hasHotelContext = Boolean(roomId && reservationId);
      const hasOfficeContext = Boolean(spaceId && visitId);

      if (!lockId || !guestName || !keyType || !keyIdentifier || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields for lock key creation' });
      }

      if (!hasHotelContext && !hasOfficeContext) {
        return res.status(400).json({
          error: 'Provide either hotel context (roomId + reservationId) or office context (spaceId + visitId)',
        });
      }

      if (hasHotelContext && hasOfficeContext) {
        return res.status(400).json({
          error: 'Lock keys cannot be created for hotel and office contexts at the same time',
        });
      }

      if (!Object.values(LockKeyType).includes(keyType)) {
        return res.status(400).json({ error: 'Invalid key type' });
      }

      if (status && !Object.values(LockKeyStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid key status' });
      }

      const lock = await Lock.findById(lockId);
      if (!lock) {
        return res.status(404).json({ error: 'Lock not found' });
      }

      if (hasHotelContext) {
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
      }

      if (hasOfficeContext) {
        const [space, visit] = await Promise.all([Space.findById(spaceId), Visit.findById(visitId)]);

        if (!space) {
          return res.status(404).json({ error: 'Office space not found' });
        }

        if (!visit) {
          return res.status(404).json({ error: 'Office access schedule not found' });
        }

        if (String(visit.spaceId) !== String(spaceId)) {
          return res.status(400).json({ error: 'Visit does not belong to the selected office space' });
        }

        if (visit.status === VisitStatus.CANCELLED || visit.status === VisitStatus.CHECKED_OUT) {
          return res.status(400).json({ error: `Cannot issue a credential for a visit with status ${visit.status}` });
        }

        if (space.linkedLockId && String(space.linkedLockId) !== String(lockId)) {
          return res.status(400).json({ error: 'Selected lock does not match the lock linked to this office space' });
        }
      }

      const lockKey = await LockKey.create({
        lockId,
        roomId,
        reservationId,
        spaceId,
        visitId,
        guestName,
        keyType,
        keyIdentifier,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || LockKeyStatus.ACTIVE,
        createdBy: req.user!.userId,
        metadata,
      });

      if (hasOfficeContext) {
        await Visit.findByIdAndUpdate(visitId, { $addToSet: { issuedCredentialIds: lockKey._id } });
      }

      const populatedKey = await populateLockKey(LockKey.findById(lockKey._id));
      res.status(201).json({ data: populatedKey });
    } catch (error: any) {
      console.error('Create lock key error:', error);
      res.status(500).json({ error: 'Failed to create lock key', message: error.message });
    }
  }
);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, lockId, roomId, reservationId, spaceId, visitId, keyType } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (lockId) filter.lockId = lockId;
    if (roomId) filter.roomId = roomId;
    if (reservationId) filter.reservationId = reservationId;
    if (spaceId) filter.spaceId = spaceId;
    if (visitId) filter.visitId = visitId;
    if (keyType) filter.keyType = keyType;

    const lockKeys = await LockKey.find(filter)
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber guestName')
      .populate('spaceId', 'name code site floor')
      .populate('visitId', 'title status startAt endAt')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ data: lockKeys });
  } catch (error: any) {
    console.error('Get lock keys error:', error);
    res.status(500).json({ error: 'Failed to fetch lock keys', message: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lockKey = await populateLockKey(LockKey.findById(req.params.id));

    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    res.json({ data: lockKey });
  } catch (error: any) {
    console.error('Get lock key error:', error);
    res.status(500).json({ error: 'Failed to fetch lock key', message: error.message });
  }
});

router.get('/reservation/:reservationId', async (req: Request, res: Response) => {
  try {
    const lockKeys = await LockKey.find({ reservationId: req.params.reservationId })
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ data: lockKeys });
  } catch (error: any) {
    console.error('Get reservation lock keys error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation lock keys', message: error.message });
  }
});

router.get('/active/list', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const activeLockKeys = await LockKey.find({
      status: LockKeyStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('lockId', 'lockName lockMac')
      .populate('roomId', 'roomNumber roomType')
      .populate('reservationId', 'confirmationNumber guestName')
      .populate('spaceId', 'name code site floor')
      .populate('visitId', 'title status startAt endAt')
      .sort({ endDate: 1 });

    res.json({ data: activeLockKeys });
  } catch (error: any) {
    console.error('Get active lock keys error:', error);
    res.status(500).json({ error: 'Failed to fetch active lock keys', message: error.message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const lockKey = await LockKey.findById(req.params.id);
    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    if (status) {
      if (!Object.values(LockKeyStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      lockKey.status = status;
    }

    await lockKey.save();

    const updatedKey = await populateLockKey(LockKey.findById(lockKey._id));
    res.json({ data: updatedKey });
  } catch (error: any) {
    console.error('Update lock key error:', error);
    res.status(500).json({ error: 'Failed to update lock key', message: error.message });
  }
});

router.patch('/:id/revoke', auditLog(AuditAction.KEY_REVOKED, (req) => `Key ${req.params.id} revoked`), async (req: Request, res: Response) => {
  try {
    const lockKey = await LockKey.findById(req.params.id);

    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    if (lockKey.status === LockKeyStatus.REVOKED) {
      return res.status(400).json({ error: 'Lock key already revoked' });
    }

    lockKey.status = LockKeyStatus.REVOKED;
    lockKey.revokedAt = new Date();
    lockKey.revokedBy = req.user!.userId as any;

    await lockKey.save();

    const updatedKey = await populateLockKey(LockKey.findById(lockKey._id));
    res.json({ data: updatedKey });
  } catch (error: any) {
    console.error('Revoke lock key error:', error);
    res.status(500).json({ error: 'Failed to revoke lock key', message: error.message });
  }
});

router.patch('/:id/extend', auditLog(AuditAction.ROOM_UPDATED, (req) => `Key ${req.params.id} validity extended`), async (req: Request, res: Response) => {
  try {
    const { newEndDate } = req.body;

    if (!newEndDate) {
      return res.status(400).json({ error: 'New end date is required' });
    }

    const lockKey = await LockKey.findById(req.params.id);

    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    if (lockKey.status !== LockKeyStatus.ACTIVE) {
      return res.status(400).json({ error: 'Can only extend active lock keys' });
    }

    const newEnd = new Date(newEndDate);
    if (newEnd <= lockKey.endDate) {
      return res.status(400).json({ error: 'New end date must be after current end date' });
    }

    lockKey.endDate = newEnd;
    await lockKey.save();

    const updatedKey = await populateLockKey(LockKey.findById(lockKey._id));
    res.json({ data: updatedKey });
  } catch (error: any) {
    console.error('Extend lock key error:', error);
    res.status(500).json({ error: 'Failed to extend lock key', message: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const lockKey = await LockKey.findById(req.params.id);
    if (!lockKey) {
      return res.status(404).json({ error: 'Lock key not found' });
    }

    if (lockKey.visitId) {
      await Visit.findByIdAndUpdate(lockKey.visitId, { $pull: { issuedCredentialIds: lockKey._id } });
    }

    await lockKey.deleteOne();

    res.json({ message: 'Lock key deleted successfully' });
  } catch (error: any) {
    console.error('Delete lock key error:', error);
    res.status(500).json({ error: 'Failed to delete lock key', message: error.message });
  }
});

router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const totalKeys = await LockKey.countDocuments();
    const activeKeys = await LockKey.countDocuments({
      status: LockKeyStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    const expiredKeys = await LockKey.countDocuments({
      $or: [{ status: LockKeyStatus.EXPIRED }, { status: LockKeyStatus.ACTIVE, endDate: { $lt: now } }],
    });
    const revokedKeys = await LockKey.countDocuments({ status: LockKeyStatus.REVOKED });

    const keysByType = await LockKey.aggregate([{ $group: { _id: '$keyType', count: { $sum: 1 } } }]);

    res.json({
      data: {
        totalKeys,
        activeKeys,
        expiredKeys,
        revokedKeys,
        keysByType,
      },
    });
  } catch (error: any) {
    console.error('Get lock key stats error:', error);
    res.status(500).json({ error: 'Failed to fetch lock key statistics', message: error.message });
  }
});

export default router;
