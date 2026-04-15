import config from '../config';
import TTLockServiceMock from './ttlockService.mock';
import TTLockServiceReal from './ttlockService';

// Export the appropriate service based on configuration
const ttlockService = config.useMockTTLock 
  ? TTLockServiceMock 
  : TTLockServiceReal;

if (config.useMockTTLock) {
  console.log('🔧 Using Mock TTLock implementation');
} else {
  console.log('🔐 Using Real TTLock SDK');
}

export default ttlockService;
