import { NativeEventEmitter, NativeModules } from 'react-native';

type TTLockModuleShape = {
  startScan: (callback?: (lock: any) => void) => void;
  stopScan: () => void;
  initLock: (
    params: { lockMac: string; lockVersion: string },
    success: (lockData: string) => void,
    fail: (code: number, desc: string) => void
  ) => void;
  controlLock: (
    controlType: number,
    lockData: string,
    success: (lockTime: number, electricQuantity: number, uniqueId: number) => void,
    fail: (code: number, desc: string) => void
  ) => void;
  getBluetoothState: (callback: (state: number) => void) => void;
  requestBluetoothState?: () => void;
  
  // PIN / Passcode
  createCustomPasscode: (
    passcode: string,
    startDate: number,
    endDate: number,
    lockData: string,
    success: () => void,
    fail: (code: number, desc: string) => void
  ) => void;
  deletePasscode: (
    passcode: string,
    lockData: string,
    success: () => void,
    fail: (code: number, desc: string) => void
  ) => void;

  // IC Card
  addCard: (
    cycleList: any[],
    startDate: number,
    endDate: number,
    lockData: string,
    success: (cardNumber: string) => void,
    fail: (code: number, desc: string) => void
  ) => void;
  deleteCard: (
    cardNumber: string,
    lockData: string,
    success: () => void,
    fail: (code: number, desc: string) => void
  ) => void;

  // Fingerprint
  addFingerprint: (
    cycleList: any[],
    startDate: number,
    endDate: number,
    lockData: string,
    success: (fingerprintNumber: string) => void,
    fail: (code: number, desc: string) => void
  ) => void;
  deleteFingerprint: (
    fingerprintNumber: string,
    lockData: string,
    success: () => void,
    fail: (code: number, desc: string) => void
  ) => void;

  // Logs
  getLockOperationRecord: (
    type: number,
    lockData: string,
    success: (records: string) => void,
    fail: (code: number, desc: string) => void
  ) => void;
};

const TTLOCK_SCAN_EVENT = 'EventScanLock';
export const TTLOCK_EVENTS = {
  SCAN: 'EventScanLock',
  ADD_CARD_PROGRESS: 'EventAddCardProgrress', // Note: misspelled in SDK as "Progrress"
  ADD_FINGERPRINT_PROGRESS: 'EventAddFingerprintProgrress', // Note: misspelled in SDK as "Progrress"
} as const;

let cachedModule: TTLockModuleShape | null | undefined;
let cachedEmitter: NativeEventEmitter | null | undefined;

function loadTTLockModule(): TTLockModuleShape | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  if (!NativeModules.Ttlock) {
    cachedModule = null;
    return cachedModule;
  }

  cachedModule = NativeModules.Ttlock as TTLockModuleShape;
  return cachedModule;
}

function loadEmitter(): NativeEventEmitter | null {
  if (cachedEmitter !== undefined) {
    return cachedEmitter;
  }

  const module = loadTTLockModule();
  if (!module) {
    cachedEmitter = null;
    return cachedEmitter;
  }

  cachedEmitter = new NativeEventEmitter(NativeModules.Ttlock);
  return cachedEmitter;
}

export const TTLockCompat = {
  isAvailable(): boolean {
    return loadTTLockModule() !== null;
  },

  getModule(): TTLockModuleShape | null {
    return loadTTLockModule();
  },

  getEmitter(): NativeEventEmitter | null {
    return loadEmitter();
  },

  subscribeToScan(callback: (lock: any) => void): (() => void) | null {
    const emitter = loadEmitter();
    if (!emitter) {
      return null;
    }

    const subscription = emitter.addListener(TTLOCK_SCAN_EVENT, callback);
    return () => subscription.remove();
  },
};

export const TTLOCK_CONTROL_TYPE = {
  Unlock: 0,
  Lock: 1,
} as const;

export const TTLOCK_ERROR_MESSAGES = {
  unavailable: 'TTLock is not available in this Expo build yet. We can keep the app running and enable lock pairing after the native module is wired in.',
};
