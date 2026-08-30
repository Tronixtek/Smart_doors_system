import { PermissionsAndroid, Platform } from 'react-native';
import { TTLockCompat, TTLOCK_CONTROL_TYPE, TTLOCK_ERROR_MESSAGES } from './ttlockCompat';

/**
 * Service for TTLock SDK integration.
 */

export const TTLockService = {
  /**
   * Request necessary permissions for Bluetooth on Android
   */
  requestPermissions: async () => {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  },

  /**
   * Scan for nearby locks in initialization mode
   */
  scanForLocks: (onLockFound: (lock: any) => void) => {
    console.log('Scanning for TTLock devices...');

    const ttlock = TTLockCompat.getModule();
    if (!ttlock) {
      throw new Error(TTLOCK_ERROR_MESSAGES.unavailable);
    }

    ttlock.startScan((scanLockModal) => {
      console.log('Found lock:', scanLockModal);
      onLockFound(scanLockModal);
    });
  },

  /**
   * Stop scanning
   */
  stopScan: () => {
    TTLockCompat.getModule()?.stopScan();
  },

  /**
   * Initialize a lock and get its data
   */
  initLock: (lockMac: string, lockVersion: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log(`Initializing lock ${lockMac}...`);
      
      const param = {
        lockMac,
        lockVersion
      };

      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.initLock(param, (lockData) => {
        console.log('Lock initialized successfully');
        resolve(lockData);
      }, (errorCode, errorDesc) => {
        console.error(`Lock init failed: ${errorCode} - ${errorDesc}`);
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Unlock a lock via Bluetooth
   */
  unlock: (lockData: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('Unlocking via Bluetooth...');

      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.controlLock(TTLOCK_CONTROL_TYPE.Unlock, lockData, (lockTime, electricQuantity, uniqueId) => {
        console.log('Unlock successful');
        resolve();
      }, (errorCode, errorDesc) => {
        console.error(`Unlock failed: ${errorCode} - ${errorDesc}`);
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Add a custom passcode to the lock
   */
  addPasscode: (lockData: string, passcode: string, startDate: number, endDate: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.createCustomPasscode(passcode, startDate, endDate, lockData, () => {
        resolve();
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Add an IC card to the lock
   */
  addCard: (lockData: string, startDate: number, endDate: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.addCard([], startDate, endDate, lockData, (cardNumber) => {
        resolve(cardNumber);
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Add a fingerprint to the lock
   */
  addFingerprint: (lockData: string, startDate: number, endDate: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.addFingerprint([], startDate, endDate, lockData, (fingerprintNumber) => {
        resolve(fingerprintNumber);
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Delete a passcode
   */
  deletePasscode: (lockData: string, passcode: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.deletePasscode(passcode, lockData, () => {
        resolve();
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Delete an IC card
   */
  deleteCard: (lockData: string, cardNumber: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.deleteCard(cardNumber, lockData, () => {
        resolve();
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Delete a fingerprint
   */
  deleteFingerprint: (lockData: string, fingerprintNumber: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.deleteFingerprint(fingerprintNumber, lockData, () => {
        resolve();
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Remove every fingerprint stored on the lock.
   *
   * The only way to clear prints that were enrolled directly on the hardware,
   * since those have no record in the app to delete individually.
   */
  clearAllFingerprints: (lockData: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.clearAllFingerprints(lockData, () => {
        resolve();
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Remove every IC card stored on the lock.
   */
  clearAllCards: (lockData: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.clearAllCards(lockData, () => {
        resolve();
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Remove every passcode from the lock.
   *
   * Resolves with NEW lockData - the caller must persist it, otherwise the app
   * can no longer operate the lock.
   */
  resetPasscodes: (lockData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      ttlock.resetPasscode(lockData, (newLockData) => {
        resolve(newLockData);
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  },

  /**
   * Get operation logs from the lock
   */
  getLogs: (lockData: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        reject(new Error(TTLOCK_ERROR_MESSAGES.unavailable));
        return;
      }

      // type 1 = All logs
      ttlock.getLockOperationRecord(1, lockData, (recordsJson) => {
        try {
          const records = JSON.parse(recordsJson);
          resolve(records);
        } catch (e) {
          console.error('Failed to parse logs:', e);
          resolve([]);
        }
      }, (errorCode, errorDesc) => {
        reject(new Error(errorDesc));
      });
    });
  }
};
