// Mock TTLock module for development
// This will be replaced with actual react-native-ttlock integration

export interface TTLockKeyParams {
  lockId: string;
  lockName: string;
  keyName: string;
  startDate: number;
  endDate: number;
  keyType: string;
}

export interface TTLockKey {
  keyId: string;
  lockId: string;
  keyCode: string;
  startDate: number;
  endDate: number;
}

class TTLockMock {
  /**
   * Initialize TTLock SDK
   */
  async initialize(): Promise<void> {
    console.log('TTLock SDK initialized (Mock)');
    return Promise.resolve();
  }

  /**
   * Generate a digital key
   */
  async generateKey(params: TTLockKeyParams): Promise<TTLockKey> {
    console.log('Generating key (Mock):', params);
    
    // Simulate key generation
    return Promise.resolve({
      keyId: `key_${Date.now()}`,
      lockId: params.lockId,
      keyCode: `${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }

  /**
   * Revoke a digital key
   */
  async revokeKey(params: { keyId: string; lockId: string }): Promise<void> {
    console.log('Revoking key (Mock):', params);
    return Promise.resolve();
  }

  /**
   * Get keys for a lock
   */
  async getKeys(params: { lockId: string }): Promise<TTLockKey[]> {
    console.log('Getting keys (Mock):', params);
    return Promise.resolve([]);
  }

  /**
   * Get key info
   */
  async getKeyInfo(params: { keyId: string }): Promise<TTLockKey> {
    console.log('Getting key info (Mock):', params);
    return Promise.resolve({
      keyId: params.keyId,
      lockId: 'mock_lock',
      keyCode: 'MOCKCODE',
      startDate: Date.now(),
      endDate: Date.now() + 86400000,
    });
  }

  /**
   * Unlock door
   */
  async unlock(params: { lockId: string; keyId: string }): Promise<void> {
    console.log('Unlocking door (Mock):', params);
    return Promise.resolve();
  }

  /**
   * Lock door
   */
  async lock(params: { lockId: string; keyId: string }): Promise<void> {
    console.log('Locking door (Mock):', params);
    return Promise.resolve();
  }

  /**
   * Scan for locks
   */
  async scanLocks(): Promise<any[]> {
    console.log('Scanning locks (Mock)');
    return Promise.resolve([
      {
        lockName: 'Room 101 Lock',
        lockMac: 'AA:BB:CC:DD:EE:01',
        isInited: true,
        isKeyboardActivated: true,
        electricQuantity: 85,
        lockVersion: { protocolType: 5, protocolVersion: 3 },
        lockSwitchState: 0,
        rssi: -45,
        oneMeterRSSI: -30,
      },
      {
        lockName: 'Room 102 Lock',
        lockMac: 'AA:BB:CC:DD:EE:02',
        isInited: false,
        isKeyboardActivated: false,
        electricQuantity: 92,
        lockVersion: { protocolType: 5, protocolVersion: 3 },
        lockSwitchState: 0,
        rssi: -52,
        oneMeterRSSI: -35,
      },
    ]);
  }

  /**
   * Get battery level
   */
  async getBattery(params: { lockId: string }): Promise<{ level: number }> {
    console.log('Getting battery (Mock):', params);
    return Promise.resolve({ level: 85 });
  }
}

export default new TTLockMock();
