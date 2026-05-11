import { Router, Request, Response } from 'express';
import { Person, Space, User, Visit, VisitPurpose, VisitStatus } from '../models';
import { verifyToken, requireStaff, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

router.use(verifyToken);

const activateOfficeAccess = async (req: Request, res: Response) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ error: 'Office access schedule not found' });
    }

    if (visit.status === VisitStatus.CANCELLED || visit.status === VisitStatus.CHECKED_OUT) {
      return res.status(400).json({ error: `Cannot activate access for a record with status ${visit.status}` });
    }

    visit.status = VisitStatus.CHECKED_IN;
    visit.checkedInAt = new Date();
    await visit.save();

    return res.json({ data: visit });
  } catch (error) {
    console.error('Office access activation error:', error);
    return res.status(500).json({ error: 'Failed to activate office access' });
  }
};

const revokeOfficeAccess = async (req: Request, res: Response) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ error: 'Office access schedule not found' });
    }

    if (visit.status === VisitStatus.CANCELLED) {
      return res.status(400).json({ error: 'Cannot revoke access for a cancelled schedule' });
    }

    visit.status = VisitStatus.CHECKED_OUT;
    visit.checkedOutAt = new Date();
    await visit.save();

    return res.json({ data: visit });
  } catch (error) {
    console.error('Office access revocation error:', error);
    return res.status(500).json({ error: 'Failed to revoke office access' });
  }
};

router.get('/', requireStaff, async (req: Request, res: Response) => {
  try {
    const { status, personId, spaceId, hostUserId, from, to, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (personId) query.personId = personId;
    if (spaceId) query.spaceId = spaceId;
    if (hostUserId) query.hostUserId = hostUserId;
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from as string);
      if (to) query.startAt.$lte = new Date(to as string);
    }

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    const visits = await Visit.find(query)
      .populate('personId', 'firstName lastName personType company email')
      .populate('spaceId', 'name code site floor type status')
      .populate('hostUserId', 'firstName lastName email role')
      .populate('issuedCredentialIds', 'keyType keyIdentifier status startDate endDate')
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Visit.countDocuments(query);

    res.json({
      data: visits,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get office visits error:', error);
    res.status(500).json({ error: 'Failed to fetch office visits' });
  }
});

router.get('/today', requireStaff, async (req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const visits = await Visit.find({
      startAt: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: [VisitStatus.SCHEDULED, VisitStatus.CHECKED_IN] },
    })
      .populate('personId', 'firstName lastName personType company email')
      .populate('spaceId', 'name code site floor type status')
      .populate('hostUserId', 'firstName lastName email role')
      .sort({ startAt: 1 });

    res.json({ data: visits, total: visits.length });
  } catch (error) {
    console.error('Get today office visits error:', error);
    res.status(500).json({ error: 'Failed to fetch today office visits' });
  }
});

router.get('/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('personId', 'firstName lastName personType company email phoneNumber')
      .populate('spaceId', 'name code site floor type status linkedLockId')
      .populate('hostUserId', 'firstName lastName email role')
      .populate('issuedCredentialIds', 'keyType keyIdentifier status startDate endDate metadata');

    if (!visit) {
      return res.status(404).json({ error: 'Office visit not found' });
    }

    res.json({ data: visit });
  } catch (error) {
    console.error('Get office visit error:', error);
    res.status(500).json({ error: 'Failed to fetch office visit' });
  }
});

router.post(
  '/',
  requireStaff,
  auditLog(AuditAction.VISIT_CREATED, (req) => `Office visit created for person ${req.body.personId}`),
  async (req: Request, res: Response) => {
    try {
      const { personId, spaceId, hostUserId, startAt, endAt, purpose, credentialRequested, credentialType } = req.body;

      if (!personId || !spaceId || !startAt || !endAt || !req.body.title) {
        return res.status(400).json({ error: 'personId, spaceId, title, startAt, and endAt are required' });
      }

      if (purpose && !Object.values(VisitPurpose).includes(purpose)) {
        return res.status(400).json({ error: 'Invalid visit purpose', validPurposes: Object.values(VisitPurpose) });
      }

      const visitStartAt = new Date(startAt);
      const visitEndAt = new Date(endAt);
      if (visitEndAt <= visitStartAt) {
        return res.status(400).json({ error: 'endAt must be later than startAt' });
      }

      const [person, space, hostUser] = await Promise.all([
        Person.findById(personId),
        Space.findById(spaceId),
        hostUserId ? User.findById(hostUserId) : Promise.resolve(null),
      ]);

      if (!person) {
        return res.status(404).json({ error: 'Office person not found' });
      }

      if (!space) {
        return res.status(404).json({ error: 'Office space not found' });
      }

      if (hostUserId && !hostUser) {
        return res.status(404).json({ error: 'Host user not found' });
      }

      const visit = await Visit.create({
        ...req.body,
        credentialRequested: Boolean(credentialRequested),
        credentialType: credentialRequested ? credentialType : undefined,
      });

      const populatedVisit = await Visit.findById(visit._id)
        .populate('personId', 'firstName lastName personType company email')
        .populate('spaceId', 'name code site floor type status')
        .populate('hostUserId', 'firstName lastName email role');

      res.status(201).json({ data: populatedVisit });
    } catch (error: any) {
      console.error('Create office visit error:', error);
      res.status(500).json({ error: 'Failed to create office visit', message: error.message });
    }
  }
);

router.patch(
  '/:id',
  requireStaff,
  auditLog(AuditAction.VISIT_UPDATED, (req) => `Office visit ${req.params.id} updated`),
  async (req: Request, res: Response) => {
    try {
      const updates = { ...req.body };

      if (updates.purpose && !Object.values(VisitPurpose).includes(updates.purpose)) {
        return res.status(400).json({ error: 'Invalid visit purpose', validPurposes: Object.values(VisitPurpose) });
      }

      if (updates.status && !Object.values(VisitStatus).includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid visit status', validStatuses: Object.values(VisitStatus) });
      }

      if (updates.startAt || updates.endAt) {
        const existingVisit = await Visit.findById(req.params.id);
        if (!existingVisit) {
          return res.status(404).json({ error: 'Office visit not found' });
        }

        const startAt = new Date(updates.startAt || existingVisit.startAt);
        const endAt = new Date(updates.endAt || existingVisit.endAt);
        if (endAt <= startAt) {
          return res.status(400).json({ error: 'endAt must be later than startAt' });
        }
      }

      const visit = await Visit.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
        .populate('personId', 'firstName lastName personType company email')
        .populate('spaceId', 'name code site floor type status')
        .populate('hostUserId', 'firstName lastName email role');

      if (!visit) {
        return res.status(404).json({ error: 'Office visit not found' });
      }

      res.json({ data: visit });
    } catch (error: any) {
      console.error('Update office visit error:', error);
      res.status(500).json({ error: 'Failed to update office visit', message: error.message });
    }
  }
);

router.patch(
  '/:id/check-in',
  requireStaff,
  auditLog(AuditAction.VISIT_CHECK_IN, (req) => `Office visit ${req.params.id} checked in`),
  activateOfficeAccess
);

router.patch(
  '/:id/check-out',
  requireStaff,
  auditLog(AuditAction.VISIT_CHECK_OUT, (req) => `Office visit ${req.params.id} checked out`),
  revokeOfficeAccess
);

router.patch(
  '/:id/activate-access',
  requireStaff,
  auditLog(AuditAction.VISIT_CHECK_IN, (req) => `Office access ${req.params.id} activated`),
  activateOfficeAccess
);

router.patch(
  '/:id/revoke-access',
  requireStaff,
  auditLog(AuditAction.VISIT_CHECK_OUT, (req) => `Office access ${req.params.id} revoked`),
  revokeOfficeAccess
);

router.patch(
  '/:id/cancel',
  requireStaff,
  auditLog(AuditAction.VISIT_CANCELLED, (req) => `Office visit ${req.params.id} cancelled`),
  async (req: Request, res: Response) => {
    try {
      const visit = await Visit.findById(req.params.id);

      if (!visit) {
        return res.status(404).json({ error: 'Office visit not found' });
      }

      if (visit.status === VisitStatus.CHECKED_OUT) {
        return res.status(400).json({ error: 'Cannot cancel a checked-out visit' });
      }

      visit.status = VisitStatus.CANCELLED;
      await visit.save();

      res.json({ data: visit });
    } catch (error) {
      console.error('Cancel office visit error:', error);
      res.status(500).json({ error: 'Failed to cancel office visit' });
    }
  }
);

export default router;
