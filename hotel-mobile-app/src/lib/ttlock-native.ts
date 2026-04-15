// TTLock Native Module Wrapper
// This file provides TypeScript definitions and wraps the native TTLock module

import { NativeModules, NativeEventEmitter } from 'react-native';

const ttLockModule = NativeModules.Ttlock;

if (!ttLockModule) {
  console.error('⚠️ TTLock native module not found!');
  console.error('This app requires a development build to use real TTLock hardware.');
  console.error('Run: npx expo prebuild && npx expo run:android');
}

const ttLockEventEmitter = ttLockModule ? new NativeEventEmitter(ttLockModule) : null;

// Enums from TTLock SDK
export enum LockControlType {
  unlock = 0,
  lock = 1,
}

export enum LockErrorCode {
  bluetoothPowerOff = -1,
  connectTimeout = -2,
  wrongCRC = -3,
  // Add more as needed
}

export enum LockState {
  Locked = 0,
  Unlock = 1,
  Unknown = 2,
  CarOnLock = 3,
}

// TTLock Scan Result Interface
export interface ScanLockModal {
  lockName: string;
  lockMac: string;
  isInited: boolean;
  isKeyboardActivated: boolean;
  electricQuantity: number;
  lockVersion: any;
  lockSwitchState: number;
  rssi: number;
  oneMeterRSSI: number;
}

// Subscription map for event listeners
const subscriptionMap = new Map();

// TTLock Event Names
const TTLockEvent = {
  ScanLock: 'EventScanLock',
};

export class Ttlock {
  private static defaultCallback = function () {};

  /**
   * Start scanning for nearby TTLock devices
   */
  static startScan(callback: (scanLockModal: ScanLockModal) => void) {
    if (!ttLockModule) {
      console.error('TTLock module not available');
      return;
    }

    let subscription = subscriptionMap.get(TTLockEvent.ScanLock);
    if (subscription !== undefined) {
      subscription.remove();
    }
    
    subscription = ttLockEventEmitter!.addListener(TTLockEvent.ScanLock, callback);
    subscriptionMap.set(TTLockEvent.ScanLock, subscription);
    ttLockModule.startScan();
  }

  /**
   * Stop scanning for locks
   */
  static stopScan() {
    if (!ttLockModule) return;
    
    ttLockModule.stopScan();
    let subscription = subscriptionMap.get(TTLockEvent.ScanLock);
    if (subscription !== undefined) {
      subscription.remove();
    }
    subscriptionMap.delete(TTLockEvent.ScanLock);
  }

  /**
   * Initialize a new lock (first-time setup)
   */
  static initLock(
    params: { lockMac: string; lockVersion: any },
    success: (lockData: string) => void,
    fail: (errorCode: LockErrorCode, description: string) => void
  ) {
    if (!ttLockModule) {
      fail(LockErrorCode.connectTimeout, 'TTLock module not available');
      return;
    }

    success = success || this.defaultCallback;
    fail = fail || this.defaultCallback;
    ttLockModule.initLock(params, success, fail);
  }

  /**
   * Create a custom passcode for the lock
   */
  static createCustomPasscode(
    passcode: string,
    startDate: number,
    endDate: number,
    lockData: string,
    success: () => void,
    fail: (errorCode: LockErrorCode, description: string) => void
  ) {
    if (!ttLockModule) {
      fail(LockErrorCode.connectTimeout, 'TTLock module not available');
      return;
    }

    success = success || this.defaultCallback;
    fail = fail || this.defaultCallback;
    ttLockModule.createCustomPasscode(passcode, startDate, endDate, lockData, success, fail);
  }

  /**
   * Delete a passcode from the lock
   */
  static deletePasscode(
    passcode: string,
    lockData: string,
    success: () => void,
    fail: (errorCode: LockErrorCode, description: string) => void
  ) {
    if (!ttLockModule) {
      fail(LockErrorCode.connectTimeout, 'TTLock module not available');
      return;
    }

    success = success || this.defaultCallback;
    fail = fail || this.defaultCallback;
    ttLockModule.deletePasscode(passcode, lockData, success, fail);
  }

  /**
   * Control the lock (unlock/lock)
   */
  static controlLock(
    control: LockControlType,
    lockData: string,
    success: (lockTime: number, electricQuantity: number, uniqueId: number) => void,
    fail: (errorCode: LockErrorCode, description: string) => void
  ) {
    if (!ttLockModule) {
      fail(LockErrorCode.connectTimeout, 'TTLock module not available');
      return;
    }

    success = success || this.defaultCallback;
    fail = fail || this.defaultCallback;
    ttLockModule.controlLock(control, lockData, (dataArray: number[]) => {
      success(dataArray[0], dataArray[1], dataArray[2]);
    }, fail);
  }

  /**
   * Get lock switch state (locked/unlocked)
   */
  static getLockSwitchState(
    lockData: string,
    success: (state: LockState) => void,
    fail: (errorCode: LockErrorCode, description: string) => void
  ) {
    if (!ttLockModule) {
      fail(LockErrorCode.connectTimeout, 'TTLock module not available');
      return;
    }

    success = success || this.defaultCallback;
    fail = fail || this.defaultCallback;
    ttLockModule.getLockSwitchState(lockData, (state: number) => {
      const lockState = [
        LockState.Locked,
        LockState.Unlock,
        LockState.Unknown,
        LockState.CarOnLock,
      ][state];
      success(lockState);
    }, fail);
  }

  /**
   * Reset ekey (delete all keys except admin)
   */
  static resetEkey(
    lockData: string,
    success: (lockData: string) => void,
    fail: (errorCode: LockErrorCode, description: string) => void
  ) {
    if (!ttLockModule) {
      fail(LockErrorCode.connectTimeout, 'TTLock module not available');
      return;
    }

    success = success || this.defaultCallback;
    fail = fail || this.defaultCallback;
    ttLockModule.resetEkey(lockData, success, fail);
  }
}

export { LockControlType as default };
