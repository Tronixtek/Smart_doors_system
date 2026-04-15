// Mock TTLock Service for testing without hardware
import TTLock from '../lib/ttlock-mock';
import { Alert } from 'react-native';

export interface TTLockKeyData {
  keyId: string;
  lockId: string;
  keyCode: string;
  startDate: number;
  endDate: number;
  keyType: string;
}

export interface GenerateKeyParams {
  lockId: string;
  lockName: string;
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomNumber: string;
}

export interface RevokeKeyParams {
  keyId: string;
  lockId: string;
}

class TTLockServiceMock {
  private lockDataMap: Map<string, string> = new Map();

  /**
   * Scan for nearby TTLock devices (mock)
   */
  scanLocks(onLockFound: (lock: any) => void): () => void {
    let stopScanning = false;
    let scanInterval: NodeJS.Timeout;

    const performScan = async () => {
      scanInterval = setInterval(async () => {
        if (stopScanning) {
          clearInterval(scanInterval);
          return;
        }

        try {
          const mockLocks = await TTLock.scanLocks();
          mockLocks.forEach((lock: any) => {
            onLockFound(lock);
          });
        } catch (error) {
          console.error('Mock scan error:', error);
        }
      }, 2000);
    };

    performScan();

    // Return cleanup function
    return () => {
      stopScanning = true;
      if (scanInterval) {
        clearInterval(scanInterval);
      }
    };
  }

  /**
   * Initialize a lock (mock)
   */
  async initLock(lockMac: string, lockVersion: any): Promise<string | null> {
    console.log('Mock: Initializing lock', lockMac);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const lockData = `MOCK_LOCK_DATA_${lockMac}_${Date.now()}`;
    this.lockDataMap.set(lockMac, lockData);
    return lockData;
  }

  /**
   * Store lockData for a specific lock
   */
  setLockData(lockId: string, lockData: string): void {
    this.lockDataMap.set(lockId, lockData);
  }

  /**
   * Get stored lockData for a lock
   */
  getLockData(lockId: string): string | undefined {
    return this.lockDataMap.get(lockId);
  }

  /**
   * Generate a digital key (mock)
   */
  async generateDigitalKey(params: GenerateKeyParams): Promise<TTLockKeyData | null> {
    try {
      const { lockId, guestName, checkInDate, checkOutDate, roomNumber } = params;

      const lockData = this.lockDataMap.get(lockId);
      if (!lockData && !lockId.includes('Room')) {
        // For testing, allow Room IDs without initialization
        this.lockDataMap.set(lockId, `MOCK_${lockId}`);
      }

      const keyData = await TTLock.generateKey({
        lockId,
        lockName: `Room ${roomNumber}`,
        keyName: `${guestName} - Room ${roomNumber}`,
        startDate: checkInDate.getTime(),
        endDate: checkOutDate.getTime(),
        keyType: 'timed',
      });

      console.log('Mock: Digital key generated:', keyData);

      return {
        keyId: keyData.keyId,
        lockId: keyData.lockId,
        keyCode: keyData.keyCode,
        startDate: checkInDate.getTime(),
        endDate: checkOutDate.getTime(),
        keyType: 'timed',
      };
    } catch (error: any) {
      console.error('Mock: Error generating digital key:', error);
      Alert.alert('Key Generation Failed', error.message || 'Unable to generate digital key');
      return null;
    }
  }

  /**
   * Revoke a digital key (mock)
   */
  async revokeDigitalKey(params: RevokeKeyParams & { keyCode?: string }): Promise<boolean> {
    try {
      const { keyId, lockId, keyCode } = params;
      console.log('Mock: Revoking key:', { keyId, lockId, keyCode });

      await TTLock.revokeKey({ keyId: keyId || keyCode || '', lockId });
      return true;
    } catch (error: any) {
      console.error('Mock: Error revoking digital key:', error);
      Alert.alert('Key Revocation Failed', error.message || 'Unable to revoke digital key');
      return false;
    }
  }

  /**
   * Check if a key is valid
   */
  isKeyValid(startDate: number, endDate: number): boolean {
    const now = Date.now();
    return startDate <= now && now <= endDate;
  }

  /**
   * Unlock door (mock)
   */
  async unlockDoor(lockId: string): Promise<boolean> {
    try {
      console.log('Mock: Unlocking door:', lockId);
      await TTLock.unlock({ lockId, keyId: 'mock_key' });
      return true;
    } catch (error: any) {
      console.error('Mock: Error unlocking door:', error);
      Alert.alert('Unlock Failed', error.message || 'Unable to unlock door');
      return false;
    }
  }

  /**
   * Lock door (mock)
   */
  async lockDoor(lockId: string): Promise<boolean> {
    try {
      console.log('Mock: Locking door:', lockId);
      await TTLock.lock({ lockId, keyId: 'mock_key' });
      return true;
    } catch (error: any) {
      console.error('Mock: Error locking door:', error);
      Alert.alert('Lock Failed', error.message || 'Unable to lock door');
      return false;
    }
  }

  /**
   * Get lock state (mock)
   */
  async getLockState(lockId: string): Promise<number | null> {
    console.log('Mock: Getting lock state:', lockId);
    return 0; // 0 = locked, 1 = unlocked
  }

  /**
   * Get battery level (mock)
   */
  async getBatteryLevel(lockId: string): Promise<number | null> {
    console.log('Mock: Getting battery level:', lockId);
    const result = await TTLock.getBattery({ lockId });
    return result.level;
  }

  /**
   * Reset lock (mock)
   */
  async resetLock(lockId: string): Promise<boolean> {
    console.log('Mock: Resetting lock:', lockId);
    return true;
  }
}

export default new TTLockServiceMock();
