import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { locksAPI } from '../../api/locks';
import { Lock } from '../../types/api';
import { Ttlock, LockErrorCode } from 'react-native-ttlock';
import AppIcon from '../../components/AppIcon';

export default function LockDetailScreen({ route, navigation }: any) {
  const { lockId } = route.params;
  const [lock, setLock] = useState<Lock | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    fetchLockDetails();
  }, []);

  const fetchLockDetails = async () => {
    try {
      setLoading(true);
      const data = await locksAPI.getById(lockId);
      setLock(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load lock details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!lock) return;

    setUnlocking(true);
    try {
      await new Promise<void>((resolve, reject) => {
        Ttlock.controlLock(
          0, // 0 = Unlock, 1 = Lock
          lock.lockData,
          () => {
            Alert.alert('Success', '✅ Lock unlocked successfully');
            resolve();
          },
          (errorCode: LockErrorCode, errorMsg: string) => {
            reject(new Error(`Failed to unlock: ${errorMsg}`));
          }
        );
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unlock the lock');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = async () => {
    if (!lock) return;

    setUnlocking(true);
    try {
      await new Promise<void>((resolve, reject) => {
        Ttlock.controlLock(
          1, // 1 = Lock
          lock.lockData,
          () => {
            Alert.alert('Success', '🔒 Lock locked successfully');
            resolve();
          },
          (errorCode: LockErrorCode, errorMsg: string) => {
            reject(new Error(`Failed to lock: ${errorMsg}`));
          }
        );
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to lock the door');
    } finally {
      setUnlocking(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lock',
      'Are you sure you want to delete this lock? This will also delete all associated keys.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await locksAPI.delete(lockId);
              Alert.alert('Success', 'Lock deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete lock');
            }
          },
        },
      ]
    );
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return '#4CAF50';
    if (level > 20) return '#FFA726';
    return '#EF5350';
  };

  const getBatteryIcon = (level: number) => {
    if (level > 75) return 'battery-full';
    if (level > 50) return 'battery-half';
    if (level > 25) return 'battery-charging';
    return 'battery-dead';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!lock) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lock not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Lock Info Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <AppIcon name="lock-closed" size={40} color="#0066CC" />
          <View style={styles.headerText}>
            <Text style={styles.lockName}>{lock.lockName}</Text>
            <Text style={styles.roomNumber}>
              Room {typeof lock.roomId === 'object' ? lock.roomId.roomNumber : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <AppIcon name="bluetooth" size={20} color="#666" />
          <Text style={styles.infoLabel}>MAC Address:</Text>
          <Text style={styles.infoValue}>{lock.lockMac}</Text>
        </View>

        <View style={styles.infoRow}>
          <AppIcon
            name={getBatteryIcon(lock.batteryLevel || 0)}
            size={20}
            color={getBatteryColor(lock.batteryLevel || 0)}
          />
          <Text style={styles.infoLabel}>Battery:</Text>
          <Text style={[styles.infoValue, { color: getBatteryColor(lock.batteryLevel || 0) }]}>
            {lock.batteryLevel || 0}%
          </Text>
        </View>

        <View style={styles.infoRow}>
          <AppIcon name="shield-checkmark" size={20} color="#666" />
          <Text style={styles.infoLabel}>Status:</Text>
          <Text
            style={[
              styles.statusBadge,
              lock.status === 'ACTIVE'
                ? styles.statusActive
                : lock.status === 'MAINTENANCE'
                ? styles.statusMaintenance
                : styles.statusInactive,
            ]}
          >
            {lock.status}
          </Text>
        </View>

        {lock.lastConnected && (
          <View style={styles.infoRow}>
            <AppIcon name="time" size={20} color="#666" />
            <Text style={styles.infoLabel}>Last Connected:</Text>
            <Text style={styles.infoValue}>
              {new Date(lock.lastConnected).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Features Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          <View style={styles.featureBadge}>
            <AppIcon
              name="keypad"
              size={20}
              color={lock.features?.supportsPasscode ? '#4CAF50' : '#999'}
            />
            <Text style={styles.featureText}>Passcode</Text>
          </View>
          <View style={styles.featureBadge}>
            <AppIcon
              name="card"
              size={20}
              color={lock.features?.supportsCard ? '#4CAF50' : '#999'}
            />
            <Text style={styles.featureText}>Card</Text>
          </View>
          <View style={styles.featureBadge}>
            <AppIcon
              name="finger-print"
              size={20}
              color={lock.features?.supportsFingerprint ? '#4CAF50' : '#999'}
            />
            <Text style={styles.featureText}>Fingerprint</Text>
          </View>
          <View style={styles.featureBadge}>
            <AppIcon
              name="wifi"
              size={20}
              color={lock.features?.supportsRemoteUnlock ? '#4CAF50' : '#999'}
            />
            <Text style={styles.featureText}>Remote</Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lock Controls</Text>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.unlockButton]}
          onPress={handleUnlock}
          disabled={unlocking || lock.status !== 'ACTIVE'}
        >
          {unlocking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <AppIcon name="lock-open" size={24} color="#fff" />
              <Text style={styles.controlButtonText}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.lockButton]}
          onPress={handleLock}
          disabled={unlocking || lock.status !== 'ACTIVE'}
        >
          {unlocking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <AppIcon name="lock-closed" size={24} color="#fff" />
              <Text style={styles.controlButtonText}>Lock</Text>
            </>
          )}
        </TouchableOpacity>

        {lock.batteryLevel && lock.batteryLevel < 20 && (
          <View style={styles.warningBox}>
            <AppIcon name="warning" size={20} color="#FF9800" />
            <Text style={styles.warningText}>Low battery - Replace soon!</Text>
          </View>
        )}
      </View>

      {/* Danger Zone */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.cardTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <AppIcon name="trash" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Lock</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  lockName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roomNumber: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
    color: '#EF5350',
  },
  statusMaintenance: {
    backgroundColor: '#FFF3E0',
    color: '#FF9800',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  unlockButton: {
    backgroundColor: '#4CAF50',
  },
  lockButton: {
    backgroundColor: '#2196F3',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerCard: {
    borderColor: '#EF5350',
    borderWidth: 1,
    marginBottom: 32,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF5350',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
