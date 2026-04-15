// Using real TTLock SDK native modules
// Requires development build: npx expo prebuild && npx expo run:android
import { Ttlock, LockControlType, LockErrorCode } from '../lib/ttlock-native';
import { Alert } from 'react-native';

// Note: TTLock SDK uses callback-based API, we wrap it in Promises
// Make sure to scan for locks first, then initialize them to get lockData

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

class TTLockService {
  private lockDataMap: Map<string, string> = new Map(); // Store lockData by lockId/lockMac

  /**
   * Scan for nearby TTLock devices
   * Returns array of discovered locks
   */
  scanLocks(onLockFound: (lock: any) => void): () => void {
    Ttlock.startScan((scanLockModal) => {
      console.log('Lock found:', scanLockModal);
      onLockFound(scanLockModal);
    });

    // Return cleanup function
    return () => {
      Ttlock.stopScan();
    };
  }

  /**
   * Initialize a lock (only needed for new locks)
   * Returns lockData which is needed for all subsequent operations
   */
  async initLock(lockMac: string, lockVersion: any): Promise<string | null> {
    return new Promise((resolve) => {
      Ttlock.initLock(
        { lockMac, lockVersion },
        (lockData) => {
          console.log('Lock initialized successfully');
          this.lockDataMap.set(lockMac, lockData);
          resolve(lockData);
        },
        (errorCode, description) => {
          console.error('Lock initialization error:', errorCode, description);
          Alert.alert('Initialization Failed', description || 'Failed to initialize lock');
          resolve(null);
        }
      );
    });
  }

  /**
   * Store lockData for a specific lock (from backend/database)
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
   * Create a custom passcode (digital key) for guest
   * TTLock uses passcodes (4-9 digits) as temporary keys
   */
  async generateDigitalKey(params: GenerateKeyParams): Promise<TTLockKeyData | null> {
    try {
      const { lockId, guestName, checkInDate, checkOutDate, roomNumber } = params;
      
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        Alert.alert('Error', 'Lock not initialized. Please scan and initialize lock first.');
        return null;
      }

      // Generate a random 6-digit passcode
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();
      const startDate = checkInDate.getTime();
      const endDate = checkOutDate.getTime();

      return new Promise((resolve) => {
        Ttlock.createCustomPasscode(
          passcode,
          startDate,
          endDate,
          lockData,
          () => {
            console.log('Passcode created successfully:', passcode);
            const keyData: TTLockKeyData = {
              keyId: `key_${Date.now()}`,
              lockId,
              keyCode: passcode,
              startDate,
              endDate,
              keyType: 'timed',
            };
            resolve(keyData);
          },
          (errorCode, description) => {
            console.error('Error creating passcode:', errorCode, description);
            Alert.alert('Key Generation Failed', description || 'Unable to create passcode');
            resolve(null);
          }
        );
      });
    } catch (error: any) {
      console.error('Error generating digital key:', error);
      Alert.alert('Key Generation Failed', error.message || 'Unable to generate digital key');
      return null;
    }
  }

  /**
   * Delete a passcode (revoke digital key)
   */
  async revokeDigitalKey(params: RevokeKeyParams & { keyCode: string }): Promise<boolean> {
    try {
      const { lockId, keyCode } = params;
      
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        Alert.alert('Error', 'Lock data not found');
        return false;
      }

      return new Promise((resolve) => {
        Ttlock.deletePasscode(
          keyCode,
          lockData,
          () => {
            console.log('Passcode deleted successfully:', keyCode);
            resolve(true);
          },
          (errorCode, description) => {
            console.error('Error deleting passcode:', errorCode, description);
            Alert.alert('Key Revocation Failed', description || 'Unable to delete passcode');
            resolve(false);
          }
        );
      });
    } catch (error: any) {
      console.error('Error revoking digital key:', error);
      Alert.alert('Key Revocation Failed', error.message || 'Unable to revoke digital key');
      return false;
    }
  }

  /**
   * Check if a key is valid based on time
   */
  isKeyValid(startDate: number, endDate: number): boolean {
    const now = Date.now();
    return startDate <= now && now <= endDate;
  }

  /**
   * Unlock door (requires Bluetooth connection to lock)
   */
  async unlockDoor(lockId: string): Promise<boolean> {
    try {
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        Alert.alert('Error', 'Lock data not found');
        return false;
      }

      return new Promise((resolve) => {
        Ttlock.controlLock(
          LockControlType.unlock,
          lockData,
          (lockTime, electricQuantity, uniqueId) => {
            console.log('Door unlocked successfully', { lockTime, electricQuantity, uniqueId });
            resolve(true);
          },
          (errorCode, description) => {
            console.error('Error unlocking door:', errorCode, description);
            Alert.alert('Unlock Failed', description || 'Unable to unlock door');
            resolve(false);
          }
        );
      });
    } catch (error: any) {
      console.error('Error unlocking door:', error);
      Alert.alert('Unlock Failed', error.message || 'Unable to unlock door');
      return false;
    }
  }

  /**
   * Lock door (requires Bluetooth connection to lock)
   */
  async lockDoor(lockId: string): Promise<boolean> {
    try {
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        Alert.alert('Error', 'Lock data not found');
        return false;
      }

      return new Promise((resolve) => {
        Ttlock.controlLock(
          LockControlType.lock,
          lockData,
          (lockTime, electricQuantity, uniqueId) => {
            console.log('Door locked successfully', { lockTime, electricQuantity, uniqueId });
            resolve(true);
          },
          (errorCode, description) => {
            console.error('Error locking door:', errorCode, description);
            Alert.alert('Lock Failed', description || 'Unable to lock door');
            resolve(false);
          }
        );
      });
    } catch (error: any) {
      console.error('Error locking door:', error);
      Alert.alert('Lock Failed', error.message || 'Unable to lock door');
      return false;
    }
  }

  /**
   * Get current lock state (locked/unlocked)
   */
  async getLockState(lockId: string): Promise<number | null> {
    try {
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        return null;
      }

      return new Promise((resolve) => {
        Ttlock.getLockSwitchState(
          lockData,
          (state) => {
            console.log('Lock state:', state);
            resolve(state);
          },
          (errorCode, description) => {
            console.error('Error getting lock state:', errorCode, description);
            resolve(null);
          }
        );
      });
    } catch (error) {
      console.error('Error getting lock state:', error);
      return null;
    }
  }

  /**
   * Get battery level from scan data or lock operations
   * Battery level is returned in scan results and lock control callbacks
   */
  async getBatteryLevel(lockId: string): Promise<number | null> {
    try {
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        return null;
      }

      // Battery is returned in controlLock callback or scan results
      // For now, we'll need to trigger a lock operation to get battery
      return new Promise((resolve) => {
        Ttlock.getLockSwitchState(
          lockData,
          () => {
            // Battery info would be in scan data
            console.log('Battery info available in scan data');
            resolve(null); // Return null, battery is in scan callback
          },
          () => {
            resolve(null);
          }
        );
      });
    } catch (error) {
      console.error('Error getting battery level:', error);
      return null;
    }
  }

  /**
   * Reset lock (deletes all ekeys except admin)
   */
  async resetLock(lockId: string): Promise<boolean> {
    try {
      const lockData = this.lockDataMap.get(lockId);
      if (!lockData) {
        Alert.alert('Error', 'Lock data not found');
        return false;
      }

      return new Promise((resolve) => {
        Ttlock.resetEkey(
          lockData,
          () => {
            console.log('Lock reset successfully');
            resolve(true);
          },
          (errorCode, description) => {
            console.error('Error resetting lock:', errorCode, description);
            Alert.alert('Reset Failed', description || 'Unable to reset lock');
            resolve(false);
          }
        );
      });
    } catch (error: any) {
      console.error('Error resetting lock:', error);
      Alert.alert('Reset Failed', error.message || 'Unable to reset lock');
      return false;
    }
  }
}

// Export singleton instance
export default new TTLockService();
