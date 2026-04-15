import { Router, Request, Response } from 'express';
import { Person, PersonStatus, PersonType, Visit, VisitStatus } from '../models';
import { verifyToken, requireStaff, requireAdminOrManager, auditLog } from '../middleware/auth';
import { AuditAction } from '../models/AuditLog';

const router = Router();

router.use(verifyToken);

router.get('/', requireStaff, async (req: Request, res: Response) => {
  try {
    const { personType, status, department, company, q, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (personType) query.personType = personType;
    if (status) query.status = status;
    if (department) query.department = department;
    if (company) query.company = company;
    if (q) {
      query.$or = [
        { firstName: { $regex: q as string, $options: 'i' } },
        { lastName: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
        { employeeId: { $regex: q as string, $options: 'i' } },
      ];
    }

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    const people = await Person.find(query)
      .populate('hostUserId', 'firstName lastName email role')
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Person.countDocuments(query);

    res.json({
      data: people,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get office people error:', error);
    res.status(500).json({ error: 'Failed to fetch office people' });
  }
});

router.get('/:id', requireStaff, async (req: Request, res: Response) => {
  try {
    const person = await Person.findById(req.params.id)
      .populate('hostUserId', 'firstName lastName email role');

    if (!person) {
      return res.status(404).json({ error: 'Office person not found' });
    }

    res.json({ data: person });
  } catch (error) {
    console.error('Get office person error:', error);
    res.status(500).json({ error: 'Failed to fetch office person' });
  }
});

router.post(
  '/',
  requireStaff,
  auditLog(AuditAction.PERSON_CREATED, (req) => `Office person created: ${req.body.firstName} ${req.body.lastName}`),
  async (req: Request, res: Response) => {
    try {
      const { personType, status } = req.body;

      if (personType && !Object.values(PersonType).includes(personType)) {
        return res.status(400).json({ error: 'Invalid person type', validTypes: Object.values(PersonType) });
      }

      if (status && !Object.values(PersonStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid person status', validStatuses: Object.values(PersonStatus) });
      }

      const person = await Person.create(req.body);
      res.status(201).json({ data: person });
    } catch (error: any) {
      console.error('Create office person error:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Employee ID already exists' });
      }
      res.status(500).json({ error: 'Failed to create office person', message: error.message });
    }
  }
);

router.patch(
  '/:id',
  requireStaff,
  auditLog(AuditAction.PERSON_UPDATED, (req) => `Office person ${req.params.id} updated`),
  async (req: Request, res: Response) => {
    try {
      const updates = { ...req.body };

      if (updates.personType && !Object.values(PersonType).includes(updates.personType)) {
        return res.status(400).json({ error: 'Invalid person type', validTypes: Object.values(PersonType) });
      }

      if (updates.status && !Object.values(PersonStatus).includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid person status', validStatuses: Object.values(PersonStatus) });
      }

      const person = await Person.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
        .populate('hostUserId', 'firstName lastName email role');

      if (!person) {
        return res.status(404).json({ error: 'Office person not found' });
      }

      res.json({ data: person });
    } catch (error: any) {
      console.error('Update office person error:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Employee ID already exists' });
      }
      res.status(500).json({ error: 'Failed to update office person', message: error.message });
    }
  }
);

router.delete(
  '/:id',
  requireAdminOrManager,
  auditLog(AuditAction.PERSON_DELETED, (req) => `Office person ${req.params.id} deleted`),
  async (req: Request, res: Response) => {
    try {
      const activeVisits = await Visit.countDocuments({
        personId: req.params.id,
        status: { $in: [VisitStatus.SCHEDULED, VisitStatus.CHECKED_IN] },
      });

      if (activeVisits > 0) {
        return res.status(409).json({ error: 'Cannot delete a person with active or upcoming visits' });
      }

      const person = await Person.findByIdAndDelete(req.params.id);
      if (!person) {
        return res.status(404).json({ error: 'Office person not found' });
      }

      res.json({ message: 'Office person deleted successfully' });
    } catch (error) {
      console.error('Delete office person error:', error);
      res.status(500).json({ error: 'Failed to delete office person' });
    }
  }
);

export default router;
