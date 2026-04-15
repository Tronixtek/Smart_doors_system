import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import ttlockService from '../../services';
import { Colors as colors, Typography as typography, Spacing as spacing } from '../../theme';

interface ScannedLock {
  lockName: string;
  lockMac: string;
  isInited: boolean;
  electricQuantity: number;
  lockVersion: string;
  rssi: number;
}

export default function LockManagementScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedLocks, setScannedLocks] = useState<ScannedLock[]>([]);
  const [initializingLock, setInitializingLock] = useState<string | null>(null);

  const parseLockVersion = (lockVersion: unknown) => {
    if (typeof lockVersion !== 'string') {
      return lockVersion;
    }
    try {
      return JSON.parse(lockVersion);
    } catch {
      return lockVersion;
    }
  };

  const startScan = () => {
    setIsScanning(true);
    setScannedLocks([]);

    const stopScan = ttlockService.scanLocks((lock) => {
      setScannedLocks((prev) => {
        // Check if lock already exists
        const exists = prev.find((l) => l.lockMac === lock.lockMac);
        if (exists) {
          // Update existing lock
          return prev.map((l) =>
            l.lockMac === lock.lockMac ? { ...l, ...lock } : l
          );
        } else {
          // Add new lock
          return [...prev, lock];
        }
      });
    });

    // Auto-stop after 30 seconds
    setTimeout(() => {
      stopScan();
      setIsScanning(false);
    }, 30000);
  };

  const handleInitLock = async (lock: ScannedLock) => {
    if (lock.isInited) {
      Alert.alert(
        'Lock Already Initialized',
        'This lock has already been initialized. You can use it directly.'
      );
      return;
    }

    setInitializingLock(lock.lockMac);

    try {
      const lockVersion = parseLockVersion(lock.lockVersion);
      const lockData = await ttlockService.initLock(lock.lockMac, lockVersion);

      if (lockData) {
        Alert.alert(
          'Success',
          `Lock "${lock.lockName}" initialized successfully!\n\nLockData: ${lockData.substring(0, 20)}...`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Update the lock in the list
                setScannedLocks((prev) =>
                  prev.map((l) =>
                    l.lockMac === lock.lockMac ? { ...l, isInited: true } : l
                  )
                );
              },
            },
          ]
        );

        // TODO: Save lockData to backend/database associated with room
        console.log('Lock initialized, save this lockData to database:', {
          lockMac: lock.lockMac,
          lockName: lock.lockName,
          lockData,
        });
      }
    } catch (error: any) {
      Alert.alert('Initialization Failed', error.message || 'Unknown error');
    } finally {
      setInitializingLock(null);
    }
  };

  const handleTestUnlock = async (lock: ScannedLock) => {
    if (!lock.isInited) {
      Alert.alert('Lock Not Initialized', 'Please initialize the lock first.');
      return;
    }

    const success = await ttlockService.unlockDoor(lock.lockMac);
    if (success) {
      Alert.alert('Success', `Lock "${lock.lockName}" unlocked!`);
    }
  };

  const handleTestLock = async (lock: ScannedLock) => {
    if (!lock.isInited) {
      Alert.alert('Lock Not Initialized', 'Please initialize the lock first.');
      return;
    }

    const success = await ttlockService.lockDoor(lock.lockMac);
    if (success) {
      Alert.alert('Success', `Lock "${lock.lockName}" locked!`);
    }
  };

  const handleCreatePasscode = async (lock: ScannedLock) => {
    if (!lock.isInited) {
      Alert.alert('Lock Not Initialized', 'Please initialize the lock first.');
      return;
    }

    // Create a test passcode valid for 24 hours
    const checkInDate = new Date();
    const checkOutDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const keyData = await ttlockService.generateDigitalKey({
      lockId: lock.lockMac,
      lockName: lock.lockName,
      guestName: 'Test Guest',
      checkInDate,
      checkOutDate,
      roomNumber: '101',
    });

    if (keyData) {
      Alert.alert(
        'Passcode Created',
        `Digital Key Code: ${keyData.keyCode}\n\nValid for 24 hours.\nGuest can use this 6-digit code to unlock the door.`,
        [{ text: 'Copy Code', onPress: () => console.log(keyData.keyCode) }, { text: 'OK' }]
      );
    }
  };

  const renderLock = ({ item }: { item: ScannedLock }) => (
    <View style={styles.lockCard}>
      <View style={styles.lockHeader}>
        <View style={styles.lockInfo}>
          <Text style={styles.lockName}>{item.lockName || 'Unnamed Lock'}</Text>
          <Text style={styles.lockMac}>MAC: {item.lockMac}</Text>
          <Text style={styles.lockDetail}>
            Battery: {item.electricQuantity}% | Signal: {item.rssi} dBm
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.isInited ? styles.statusInitialized : styles.statusNotInitialized,
          ]}
        >
          <Text style={styles.statusText}>
            {item.isInited ? '✓ Initialized' : '⚠ Not Initialized'}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {!item.isInited ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.initButton]}
            onPress={() => handleInitLock(item)}
            disabled={initializingLock === item.lockMac}
          >
            {initializingLock === item.lockMac ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Initialize Lock</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.unlockButton]}
              onPress={() => handleTestUnlock(item)}
            >
              <Text style={styles.buttonText}>🔓 Unlock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.lockButton]}
              onPress={() => handleTestLock(item)}
            >
              <Text style={styles.buttonText}>🔒 Lock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.passcodeButton]}
              onPress={() => handleCreatePasscode(item)}
            >
              <Text style={styles.buttonText}>🔑 Create Key</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TTLock Management</Text>
        <Text style={styles.subtitle}>
          Scan for nearby TTLock devices and initialize them
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.scanButton, isScanning && styles.scanButtonActive]}
        onPress={startScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.scanButtonText}>  Scanning...</Text>
          </>
        ) : (
          <Text style={styles.scanButtonText}>🔍 Start Scanning</Text>
        )}
      </TouchableOpacity>

      {scannedLocks.length > 0 && (
        <Text style={styles.resultsText}>Found {scannedLocks.length} lock(s)</Text>
      )}

      <FlatList
        data={scannedLocks}
        renderItem={renderLock}
        keyExtractor={(item) => item.lockMac}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isScanning
                ? 'Searching for TTLock devices...'
                : 'No locks found. Make sure Bluetooth is enabled and locks are powered on.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  scanButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonActive: {
    backgroundColor: colors.secondary,
  },
  scanButtonText: {
    color: colors.white,
    ...typography.small,
    fontWeight: '600',
  },
  resultsText: {
    ...typography.body,
    color: colors.textLight,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
  },
  lockCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  lockInfo: {
    flex: 1,
  },
  lockName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lockMac: {
    ...typography.tiny,
    color: colors.textLight,
    marginBottom: 4,
  },
  lockDetail: {
    ...typography.tiny,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    height: 28,
    justifyContent: 'center',
  },
  statusInitialized: {
    backgroundColor: colors.success,
  },
  statusNotInitialized: {
    backgroundColor: colors.warning,
  },
  statusText: {
    ...typography.tiny,
    color: colors.white,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  initButton: {
    backgroundColor: colors.primary,
  },
  unlockButton: {
    backgroundColor: colors.success,
  },
  lockButton: {
    backgroundColor: colors.error,
  },
  passcodeButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: colors.white,
    ...typography.small,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
});
