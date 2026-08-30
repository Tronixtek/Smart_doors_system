import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SelectField from '../components/SelectField';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { Theme } from '../theme';
import { TTLockCompat, TTLOCK_ERROR_MESSAGES } from '../services/ttlockCompat';
import { TTLockService } from '../services/ttlockService';

type ScanLockModal = {
  lockMac: string;
  lockName?: string;
  lockVersion: string;
};

export default function RegisterLockScreen({ navigation }: any) {
  const [accessPoints, setAccessPoints] = useState<any[]>([]);
  const [selectedAP, setSelectedAP] = useState('');
  
  const [scanning, setScanning] = useState(false);
  const [scannedLocks, setScannedLocks] = useState<ScanLockModal[]>([]);
  const [selectedLock, setSelectedLock] = useState<ScanLockModal | null>(null);
  
  const [lockName, setLockName] = useState('');
  const [pairing, setPairing] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannedLocksRef = useRef<ScanLockModal[]>([]);
  const scanSubscriptionCleanupRef = useRef<null | (() => void)>(null);

  const selectedAccessPoint = accessPoints.find((ap) => ap._id === selectedAP) || null;

  useFocusEffect(
    React.useCallback(() => {
      fetchAccessPoints();

      return () => {
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanSubscriptionCleanupRef.current?.();
        scanSubscriptionCleanupRef.current = null;
        TTLockCompat.getModule()?.stopScan();
      };
    }, [])
  );

  const fetchAccessPoints = async () => {
    try {
      const response = await apiClient.get('/access-points');
      setAccessPoints(response.data);
      if (response.data.length > 0) setSelectedAP(response.data[0]._id);
    } catch (error) {
      console.error('Failed to fetch access points', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
      console.log('Requesting permissions for API Level:', apiLevel);
      
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        Alert.alert('Module Error', TTLOCK_ERROR_MESSAGES.unavailable);
        return false;
      }

      const btState = await new Promise<number>((resolve) => {
        ttlock.getBluetoothState((state: number) => resolve(state));
      });
      console.log('Bluetooth state:', btState);
      
      if (btState === 5) {
        ttlock.requestBluetoothState?.();
        Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for locks.');
        return false;
      }

      if (apiLevel >= 31) {
        console.log('Requesting Android 12+ Bluetooth permissions...');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const scanGranted = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
        const connectGranted = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
        const locationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        console.log('Permission results:', { scanGranted, connectGranted, locationGranted });

        if (!scanGranted || !connectGranted || !locationGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth Scan, Connect, and Location permissions are required to find locks. Please grant them in Settings.'
          );
          return false;
        }
        return true;
      } else {
        console.log('Requesting legacy location permission...');
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  };

  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const ttlock = TTLockCompat.getModule();
    if (!ttlock) {
      Alert.alert('Module Error', TTLOCK_ERROR_MESSAGES.unavailable);
      return;
    }

    setScanning(true);
    setScannedLocks([]);
    scannedLocksRef.current = [];
    setSelectedLock(null);
    scanSubscriptionCleanupRef.current?.();
    scanSubscriptionCleanupRef.current = null;
    TTLockCompat.getModule()?.stopScan();

    scanSubscriptionCleanupRef.current = TTLockCompat.subscribeToScan((lock: ScanLockModal) => {
      console.log('TTLock scan callback:', lock);
      setScannedLocks((prev) => {
        if (prev.find((l) => l.lockMac === lock.lockMac)) return prev;
        const next = [...prev, lock];
        scannedLocksRef.current = next;
        return next;
      });
    });
    ttlock.startScan();

    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      stopScan();
      if (scannedLocksRef.current.length === 0) {
        Alert.alert(
          'No Locks Found',
          'No nearby TTLock devices were discovered. Confirm Bluetooth is on, Location is enabled on the phone, the lock is awake and in pairing mode, and the phone is close to the lock.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'OK' },
          ]
        );
      }
    }, 15000);
  };

  const stopScan = () => {
    scanSubscriptionCleanupRef.current?.();
    scanSubscriptionCleanupRef.current = null;
    TTLockCompat.getModule()?.stopScan();
    setScanning(false);
  };

  const handleSelectLock = (lock: ScanLockModal) => {
    stopScan();
    setSelectedLock(lock);
    setLockName(lock.lockName || `Lock ${lock.lockMac.slice(-4)}`);
  };

  const handlePairing = async () => {
    if (!selectedLock || !selectedAP) return;

    setPairing(true);
    try {
      let lockData = '';
      const ttlock = TTLockCompat.getModule();
      if (!ttlock) {
        throw new Error(TTLOCK_ERROR_MESSAGES.unavailable);
      }

      await new Promise<void>((resolve, reject) => {
        ttlock.initLock(
          { 
            lockMac: selectedLock.lockMac, 
            lockVersion: selectedLock.lockVersion,
          },
          (data: string) => { lockData = data; resolve(); },
          (_code: number, desc: string) => reject(new Error(desc))
        );
      });

      // Set the lock's clock the moment it is paired. A freshly initialised
      // lock has an unset clock, and everything time-validated is measured
      // against it: credential validity windows and every log timestamp.
      await TTLockService.syncLockTimeQuietly(lockData);

      await apiClient.post('/locks/register', {
        accessPointId: selectedAP,
        lockName,
        lockMac: selectedLock.lockMac,
        lockData,
        lockVersion: selectedLock.lockVersion,
      });

      Alert.alert('Success', 'Lock paired and registered successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Pairing Failed', error.message || 'Something went wrong');
    } finally {
      setPairing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Pair New Lock</Text>
        <Text style={styles.subtitle}>Follow the steps below to secure your space.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Step 1: Assign to Space</Text>
        <SelectField
          title="Assign to access point"
          placeholder="Select an access point"
          emptyText="No access points available yet. Create an organization and an access point first."
          value={selectedAP}
          onChange={setSelectedAP}
          options={accessPoints.map((ap: any) => ({
            label: `${ap.organizationId?.name || 'Org'} • ${ap.name}`,
            value: ap._id,
          }))}
        />
        {accessPoints.length === 0 && (
          <Text style={styles.hint}>No access points available yet. Create an organization and an access point first.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Step 2: Find Lock via Bluetooth</Text>
        <Text style={styles.hint}>Make sure your lock is in pairing mode (usually by touching the keypad or pressing a reset button).</Text>
        
        <TouchableOpacity 
          style={[styles.scanButton, scanning && styles.scanButtonActive]} 
          onPress={scanning ? stopScan : startScan}
        >
          <Ionicons name={scanning ? "stop-circle" : "bluetooth"} size={24} color={Theme.colors.white} />
          <Text style={styles.scanButtonText}>{scanning ? "Stop Scanning" : "Search for Nearby Locks"}</Text>
        </TouchableOpacity>

        {scanning && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loaderText}>Searching for devices...</Text>
          </View>
        )}

        {scannedLocks.length > 0 && !selectedLock && (
          <View style={styles.lockList}>
            {scannedLocks.map((lock) => (
              <TouchableOpacity 
                key={lock.lockMac} 
                style={styles.lockCard} 
                onPress={() => handleSelectLock(lock)}
              >
                <View style={styles.lockIconBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockCardName}>{lock.lockName || 'Unknown Lock'}</Text>
                  <Text style={styles.lockCardMac}>{lock.lockMac}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={Theme.colors.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedLock && (
        <View style={styles.pairingForm}>
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Theme.colors.white} />
            <Text style={styles.selectedBadgeText}>Device Selected: {selectedLock.lockMac}</Text>
          </View>
          
          <Text style={styles.inputLabel}>Final Lock Name</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              value={lockName} 
              onChangeText={setLockName} 
              placeholder="e.g. Front Door" 
              placeholderTextColor={Theme.colors.textLight}
              cursorColor="#000000"
              selectionColor={Theme.colors.primary}
            />
          </View>

          <TouchableOpacity 
            style={[styles.pairButton, pairing && styles.buttonDisabled]} 
            onPress={handlePairing}
            disabled={pairing}
          >
            {pairing ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.pairButtonText}>Complete Pairing</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  header: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: Theme.colors.text },
  subtitle: { fontSize: 16, color: Theme.colors.textLight, marginTop: 4 },
  section: { marginBottom: Theme.spacing.xl },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Theme.colors.text, marginBottom: Theme.spacing.md },
  hint: { fontSize: 14, color: Theme.colors.textLight, marginBottom: Theme.spacing.md, fontStyle: 'italic' },
  selectedAccessPointChip: {flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: Theme.spacing.sm,
  },
  selectedAccessPointText: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row', 
    backgroundColor: Theme.colors.primary, 
    height: 55, 
    borderRadius: Theme.borderRadius.lg, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonActive: { backgroundColor: Theme.colors.error },
  scanButtonText: { color: Theme.colors.white, fontSize: 16, fontWeight: '700', marginLeft: Theme.spacing.sm },
  loaderContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Theme.spacing.md },
  loaderText: { marginLeft: Theme.spacing.sm, color: Theme.colors.textLight },
  lockList: { marginTop: Theme.spacing.md },
  lockCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Theme.colors.white, 
    padding: Theme.spacing.md, 
    borderRadius: Theme.borderRadius.md, 
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  lockIconBox: { width: 40, height: 40, backgroundColor: Theme.colors.background, borderRadius: Theme.borderRadius.sm, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.md },
  lockCardName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  lockCardMac: { fontSize: 12, color: Theme.colors.textLight },
  pairingForm: { marginTop: 10, padding: Theme.spacing.lg, backgroundColor: Theme.colors.white, borderRadius: Theme.borderRadius.lg, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.secondary, padding: Theme.spacing.sm, borderRadius: Theme.borderRadius.md, marginBottom: Theme.spacing.lg },
  selectedBadgeText: { color: Theme.colors.white, fontWeight: '700', marginLeft: Theme.spacing.xs, fontSize: 14 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: Theme.spacing.xs },
  inputContainer: { backgroundColor: '#FFFFFF', borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: Theme.spacing.lg },
  input: { height: 50, color: '#000000' },
  pairButton: { backgroundColor: Theme.colors.primary, height: 55, borderRadius: Theme.borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { backgroundColor: Theme.colors.textLight },
  pairButtonText: { color: Theme.colors.white, fontSize: 18, fontWeight: '700' },
});
