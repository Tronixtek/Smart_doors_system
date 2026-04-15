import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Ttlock, ScanLockModal, LockErrorCode } from 'react-native-ttlock';
import { locksAPI } from '../../api/locks';
import { roomsAPI } from '../../api/rooms';
import { Room } from '../../types/api';
import AppIcon from '../../components/AppIcon';

export default function AddLockScreen({ navigation }: any) {
  const [scanning, setScanning] = useState(false);
  const [scannedLocks, setScannedLocks] = useState<ScanLockModal[]>([]);
  const [selectedLock, setSelectedLock] = useState<ScanLockModal | null>(null);
  const [lockName, setLockName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [adminPwd, setAdminPwd] = useState('123456');
  const [pairing, setPairing] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRooms();
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      Ttlock.stopScan();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await roomsAPI.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 31) {
        // Android 12+
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
      } else if (androidVersion >= 23) {
        // Android 6-11: BLUETOOTH and BLUETOOTH_ADMIN are granted from manifest
        // Only need to request location permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true; // Android < 6 doesn't need runtime permissions
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const startScan = async () => {
    // Request permissions before scanning
    const hasPermissions = await requestBluetoothPermissions();
    
    if (!hasPermissions) {
      Alert.alert(
        'Permissions Required',
        'Bluetooth and Location permissions are required to scan for locks. Please grant permissions in app settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    setScanning(true);
    setScannedLocks([]);

    Ttlock.startScan((lockModel: ScanLockModal) => {
      setScannedLocks((prev) => {
        // Avoid duplicates
        const exists = prev.find((l) => l.lockMac === lockModel.lockMac);
        if (exists) return prev;
        return [...prev, lockModel];
      });
    });

    // Auto-stop after 30 seconds
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      stopScan();
    }, 30000);
  };

  const stopScan = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    Ttlock.stopScan();
    setScanning(false);
  };

  const serializeLockVersion = (lockVersion: unknown): string => {
    if (typeof lockVersion === 'string') {
      return lockVersion;
    }
    try {
      return JSON.stringify(lockVersion ?? {});
    } catch {
      return String(lockVersion ?? '');
    }
  };

  const selectLock = (lock: ScanLockModal) => {
    stopScan();
    setSelectedLock(lock);
    setLockName(lock.lockName || `Lock ${lock.lockMac.substring(0, 8)}`);
  };

  const initLock = async () => {
    if (!selectedLock || !selectedRoom) {
      Alert.alert('Error', 'Please select a lock and a room');
      return;
    }

    setPairing(true);

    try {
      let initializedLockData = '';

      // Initialize the lock (this pairs the lock and retrieves lockData)
      await new Promise<void>((resolve, reject) => {
        const initObject = {
          lockMac: selectedLock.lockMac,
          adminPwd,
          unlockKey: '',
          lockName: lockName || selectedLock.lockName,
        };

        Ttlock.initLock(
          initObject,
          (lockData: string) => {
            initializedLockData = lockData;
            console.log('Lock initialized');
            resolve();
          },
          (errorCode: LockErrorCode, errorDesc: string) => {
            console.error('Lock initialization failed:', errorCode, errorDesc);
            reject(new Error(`Init failed: ${errorDesc}`));
          }
        );
      });

      // Register lock in backend
      const registeredLock = await locksAPI.register({
        lockMac: selectedLock.lockMac,
        lockName: lockName || selectedLock.lockName,
        lockData: initializedLockData,
        lockVersion: serializeLockVersion(selectedLock.lockVersion),
        roomId: selectedRoom.id,
        batteryLevel: selectedLock.electricQuantity,
        features: {
          supportsPasscode: true,
          supportsCard: true,
          supportsFingerprint: true,
          supportsRemoteUnlock: false,
        },
      });

      Alert.alert('Success', 'Lock paired successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to pair lock:', error);
      const status = error?.response?.status;
      const backendError = error?.response?.data?.error || error?.response?.data?.message;

      if (status === 403) {
        Alert.alert('Access Denied', 'Only Admin or Manager can register locks.');
      } else if (status === 409) {
        Alert.alert('Conflict', backendError || 'Lock is already registered or room already has a lock.');
      } else {
        Alert.alert('Error', backendError || error.message || 'Failed to pair lock');
      }
    } finally {
      setPairing(false);
    }
  };

  const renderScanResults = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {scanning ? 'Scanning...' : 'Scanned Locks'}
      </Text>

      {scanning && (
        <View style={styles.scanningIndicator}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.scanningText}>Searching for locks nearby...</Text>
          <TouchableOpacity style={styles.stopButton} onPress={stopScan}>
            <Text style={styles.stopButtonText}>Stop Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {!scanning && scannedLocks.length === 0 && (
        <View style={styles.emptyState}>
          <AppIcon name="bluetooth" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No locks found</Text>
          <Text style={styles.emptySubtext}>Make sure Bluetooth is enabled and the lock is nearby</Text>
        </View>
      )}

      <FlatList
        data={scannedLocks}
        keyExtractor={(item) => item.lockMac}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.lockItem,
              selectedLock?.lockMac === item.lockMac && styles.lockItemSelected,
            ]}
            onPress={() => selectLock(item)}
          >
            <View style={styles.lockItemHeader}>
              <AppIcon
                name="lock-closed"
                size={24}
                color={item.isInited ? '#10b981' : '#6b7280'}
              />
              <View style={styles.lockItemInfo}>
                <Text style={styles.lockItemName}>{item.lockName || 'Unnamed Lock'}</Text>
                <Text style={styles.lockItemMac}>{item.lockMac}</Text>
              </View>
              <View style={styles.lockItemRight}>
                <Text style={styles.lockItemBattery}>{item.electricQuantity}%</Text>
                {item.isInited && (
                  <Text style={styles.lockItemStatus}>Initialized</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderConfiguration = () => {
    if (!selectedLock) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lock Name</Text>
          <TextInput
            style={styles.input}
            value={lockName}
            onChangeText={setLockName}
            placeholder="Enter lock name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Admin Password</Text>
          <TextInput
            style={styles.input}
            value={adminPwd}
            onChangeText={setAdminPwd}
            placeholder="Default: 123456"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Assign to Room</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomChip,
                  selectedRoom?.id === room.id && styles.roomChipSelected,
                ]}
                onPress={() => setSelectedRoom(room)}
              >
                <Text
                  style={[
                    styles.roomChipText,
                    selectedRoom?.id === room.id && styles.roomChipTextSelected,
                  ]}
                >
                  {room.roomNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.pairButton, pairing && styles.pairButtonDisabled]}
          onPress={initLock}
          disabled={pairing || !selectedRoom}
        >
          {pairing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <AppIcon name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.pairButtonText}>Pair Lock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AppIcon name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Smart Lock</Text>
          <View style={{ width: 24 }} />
        </View>

        {!selectedLock && (
          <TouchableOpacity
            style={[styles.scanButton, scanning && styles.scanButtonActive]}
            onPress={scanning ? stopScan : startScan}
          >
            <AppIcon
              name={scanning ? 'stop-circle' : 'scan'}
              size={24}
              color="#fff"
            />
            <Text style={styles.scanButtonText}>
              {scanning ? 'Stop Scanning' : 'Start Scanning'}
            </Text>
          </TouchableOpacity>
        )}

        {renderScanResults()}
        {renderConfiguration()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  scanButtonActive: {
    backgroundColor: '#ef4444',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  scanningIndicator: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scanningText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  stopButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#d1d5db',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  lockItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  lockItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  lockItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockItemInfo: {
    flex: 1,
  },
  lockItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  lockItemMac: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  lockItemRight: {
    alignItems: 'flex-end',
  },
  lockItemBattery: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  lockItemStatus: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  roomChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  roomChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roomChipTextSelected: {
    color: '#3b82f6',
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  pairButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  pairButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
