import { Router } from 'express';
import { Lock } from '../models/Lock';
import { AccessPoint } from '../models/AccessPoint';
import { LockKey } from '../models/LockKey';
import { AccessLog } from '../models/AccessLog';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserOrganizationIds, syncUserOrganizations } from '../utils/organizations';

const router = Router();
router.use(authenticate);

router.post('/register', async (req: AuthRequest, res) => {
  try {
    const { accessPointId, lockMac, lockName, lockData, lockVersion } = req.body;
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    // Verify access point belongs to organization
    const ap = await AccessPoint.findOne({ _id: accessPointId, organizationId: { $in: organizationIds } });
    if (!ap) return res.status(404).json({ message: 'Access point not found' });

    const lock = await Lock.create({
      organizationId: ap.organizationId,
      accessPointId,
      lockMac,
      lockName,
      lockData,
      lockVersion,
    });

    res.status(201).json(lock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);
    const locks = await Lock.find({ organizationId: { $in: organizationIds } }).populate('accessPointId');
    res.json(locks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Register a new credential (PIN, Card, Fingerprint)
router.post('/:lockId/credentials', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    const { name, keyType, keyIdentifier, startDate, endDate } = req.body;
    
    const lock = await Lock.findById(lockId);
    if (!lock) return res.status(404).json({ message: 'Lock not found' });

    const key = await LockKey.create({
      organizationId: lock.organizationId,
      lockId,
      name,
      keyType,
      keyIdentifier,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    res.status(201).json(key);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Sync logs from the lock
router.post('/:lockId/logs', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    const { logs } = req.body; // Array of log objects from SDK
    
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ message: 'Invalid logs format. Expected an array.' });
    }

    const lock = await Lock.findById(lockId).populate('accessPointId');
    if (!lock) return res.status(404).json({ message: 'Lock not found' });

    // Mapping for TTLock record types to our AccessMethod enum
    // 1: App, 4: Passcode, 7: IC Card, 8: Fingerprint, etc.
    const methodMapping: { [key: number]: string } = {
      1: 'APP',
      4: 'PASSCODE',
      7: 'CARD',
      8: 'FINGERPRINT',
      10: 'KEY',
    };

    const createdLogs = [];
    for (const logData of logs) {
      // TTLock logs usually use 'recordType' as an integer
      const method = methodMapping[logData.recordType] || 'OTHER';
      
      createdLogs.push({
        organizationId: lock.organizationId,
        lockId,
        accessPointId: lock.accessPointId?._id || lock.accessPointId,
        credentialName: logData.username || logData.name || 'Unknown User',
        method: method,
        timestamp: new Date(logData.serverDate || logData.timestamp || Date.now()),
        success: true,
        rawLogData: JSON.stringify(logData),
      });
    }

    if (createdLogs.length > 0) {
      await AccessLog.insertMany(createdLogs);
    }

    res.status(201).json({ count: createdLogs.length });
  } catch (error: any) {
    console.error('Sync logs error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get logs for a lock
router.get('/:lockId/logs', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    const logs = await AccessLog.find({ lockId }).sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all logs for a lock
router.delete('/:lockId/logs', async (req: AuthRequest, res) => {
  try {
    const { lockId } = req.params;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOne({ _id: lockId, organizationId: { $in: organizationIds } });
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    await AccessLog.deleteMany({ lockId });
    res.json({ message: 'Access history cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update a lock
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { lockName, accessPointId } = req.body;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOne({ _id: id, organizationId: { $in: organizationIds } });
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    if (accessPointId) {
      const ap = await AccessPoint.findOne({ _id: accessPointId, organizationId: { $in: organizationIds } });
      if (!ap) return res.status(404).json({ message: 'Target access point not found' });
      lock.accessPointId = accessPointId;
    }

    lock.lockName = lockName || lock.lockName;
    
    await lock.save();
    res.json(lock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete a lock
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await syncUserOrganizations(req.user);
    const organizationIds = await getUserOrganizationIds(req.user);

    const lock = await Lock.findOneAndDelete({ _id: id, organizationId: { $in: organizationIds } });
    if (!lock) return res.status(404).json({ message: 'Lock not found or unauthorized' });

    res.json({ message: 'Lock deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
