import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme';
import { TTLockService } from '../services/ttlockService';
import apiClient from '../api/client';
import { getApiErrorMessage } from '../api/errors';

const CREDENTIAL_LABELS: Record<string, string> = {
  PASSCODE: 'PIN',
  CARD: 'IC Card',
  FINGERPRINT: 'Fingerprint',
  EKEY: 'eKey',
};

const CREDENTIAL_ICONS: Record<string, any> = {
  PASSCODE: 'apps-outline',
  CARD: 'card-outline',
  FINGERPRINT: 'finger-print-outline',
  EKEY: 'key-outline',
};

const CLEARABLE_TYPES = ['FINGERPRINT', 'CARD', 'PASSCODE'] as const;

/** PINs must never be readable from a list; other identifiers are safe to show. */
const displayIdentifier = (credential: any) => {
  if (!credential.keyIdentifier) return '';
  if (credential.keyType === 'PASSCODE') {
    return `•••${String(credential.keyIdentifier).slice(-2)}`;
  }
  return credential.keyIdentifier;
};

export default function ManageCredentialsScreen({ route, navigation }: any) {
  const { lock } = route.params;

  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingType, setClearingType] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const response = await apiClient.get(`/locks/${lock._id}/credentials`);
      setCredentials(response.data);
      setLoadError(null);
    } catch (error: any) {
      // Surfaced in the UI rather than only logged - a release build has no
      // console, so a silent failure here is undiagnosable on a real device.
      setLoadError(
        getApiErrorMessage(error, 'Could not load credentials')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lock._id]);

  // Refetch on every focus, not just on mount, so the list is never stale
  // after enrolling or removing a credential elsewhere.
  useFocusEffect(
    useCallback(() => {
      fetchCredentials();
    }, [fetchCredentials])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCredentials();
  };

  const removeFromHardware = async (credential: any) => {
    if (credential.keyType === 'PASSCODE') {
      return TTLockService.deletePasscode(lock.lockData, credential.keyIdentifier);
    }
    if (credential.keyType === 'CARD') {
      return TTLockService.deleteCard(lock.lockData, credential.keyIdentifier);
    }
    if (credential.keyType === 'FINGERPRINT') {
      return TTLockService.deleteFingerprint(lock.lockData, credential.keyIdentifier);
    }
  };

  /**
   * Delete from the lock first, then from our records. If the Bluetooth delete
   * fails we keep the record, otherwise the app would forget about a
   * credential that still opens the door.
   */
  const handleDelete = (credential: any) => {
    const label = CREDENTIAL_LABELS[credential.keyType] || 'credential';

    Alert.alert(
      'Remove Credential',
      `Remove ${credential.name}'s ${label} from ${lock.lockName}?\n\nYou must be near the lock - it is deleted from the hardware too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(credential._id);
            try {
              const hasPermission = await TTLockService.requestPermissions();
              if (!hasPermission) {
                Alert.alert('Permission Denied', 'Bluetooth permission is required.');
                return;
              }

              await removeFromHardware(credential);
              await apiClient.delete(`/locks/${lock._id}/credentials/${credential._id}`);

              Alert.alert('Removed', `${credential.name}'s ${label} no longer opens this lock.`);
              fetchCredentials();
            } catch (error: any) {
              Alert.alert(
                'Removal Failed',
                getApiErrorMessage(error, 'Could not remove it from the lock. Move closer and try again.')
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /**
   * Wipe every credential of one type from the hardware. The only way to
   * remove credentials enrolled directly on the lock, which have no record
   * here and so cannot be deleted individually.
   */
  const handleClearAll = (keyType: (typeof CLEARABLE_TYPES)[number]) => {
    const label = CREDENTIAL_LABELS[keyType].toLowerCase();

    Alert.alert(
      `Clear every ${label}`,
      `This deletes all ${label}s from ${lock.lockName}, including any added directly on the lock itself.\n\nEveryone using a ${label} loses access until re-enrolled. You must be near the lock.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setClearingType(keyType);
            try {
              const hasPermission = await TTLockService.requestPermissions();
              if (!hasPermission) {
                Alert.alert('Permission Denied', 'Bluetooth permission is required.');
                return;
              }

              if (keyType === 'FINGERPRINT') {
                await TTLockService.clearAllFingerprints(lock.lockData);
              } else if (keyType === 'CARD') {
                await TTLockService.clearAllCards(lock.lockData);
              } else {
                // Resetting passcodes issues new lockData; persist it or the
                // app permanently loses the ability to reach this lock.
                const newLockData = await TTLockService.resetPasscodes(lock.lockData);
                await apiClient.put(`/locks/${lock._id}`, { lockData: newLockData });
                lock.lockData = newLockData;
              }

              await apiClient.delete(`/locks/${lock._id}/credentials`, { params: { keyType } });
              Alert.alert('Cleared', `Every ${label} has been removed from the lock.`);
              fetchCredentials();
            } catch (error: any) {
              Alert.alert(
                'Clear Failed',
                getApiErrorMessage(error, `Could not clear ${label}s. Move closer to the lock and try again.`)
              );
            } finally {
              setClearingType(null);
            }
          },
        },
      ]
    );
  };

  const busy = deletingId !== null || clearingType !== null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{lock.lockName}</Text>
        <Text style={styles.headerSubtitle}>
          Removing a credential deletes it from the lock hardware as well, so stay within
          Bluetooth range.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enrolled credentials</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Theme.colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={Theme.colors.error} />
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCredentials}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : credentials.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Nothing enrolled through the app yet. Add a PIN, card or fingerprint from the lock
              screen first.
            </Text>
          </View>
        ) : (
          credentials.map((credential) => (
            <View key={credential._id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name={CREDENTIAL_ICONS[credential.keyType] || 'key-outline'}
                  size={18}
                  color={Theme.colors.primary}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{credential.name}</Text>
                <Text style={styles.cardMeta}>
                  {CREDENTIAL_LABELS[credential.keyType] || credential.keyType}
                  {displayIdentifier(credential) ? ` · ${displayIdentifier(credential)}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(credential)}
                disabled={busy}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {deletingId === credential._id ? (
                  <ActivityIndicator size="small" color={Theme.colors.error} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clear everything on the lock</Text>
        <Text style={styles.sectionHint}>
          Wipes credentials the app never recorded - the ones added directly on the lock keypad or
          sensor. Use this to get rid of unassigned entries.
        </Text>

        {CLEARABLE_TYPES.map((keyType) => (
          <TouchableOpacity
            key={keyType}
            style={styles.clearRow}
            onPress={() => handleClearAll(keyType)}
            disabled={busy}
          >
            <Ionicons name={CREDENTIAL_ICONS[keyType]} size={18} color={Theme.colors.error} />
            <Text style={styles.clearRowText}>
              Clear every {CREDENTIAL_LABELS[keyType].toLowerCase()}
            </Text>
            {clearingType === keyType ? (
              <ActivityIndicator size="small" color={Theme.colors.error} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Theme.colors.error} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.footnote}>
          Clearing PINs also re-keys the lock, so the app updates its stored lock data
          automatically. Past access history is kept - it records events that really happened.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.text },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.textLight,
    marginTop: 6,
  },

  section: { padding: Theme.spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  sectionHint: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textLight,
    marginTop: 4,
    marginBottom: Theme.spacing.md,
  },
  centered: { paddingVertical: Theme.spacing.xl, alignItems: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: 12,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  cardMeta: { fontSize: 12, color: Theme.colors.textLight, marginTop: 2 },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyBox: {
    padding: Theme.spacing.lg,
    backgroundColor: '#F3F4F6',
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },

  errorBox: {
    padding: Theme.spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.error,
    textAlign: 'center',
    marginTop: 6,
  },
  retryButton: {
    marginTop: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.error,
  },
  retryButtonText: { color: Theme.colors.white, fontWeight: '700', fontSize: 13 },

  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    height: 52,
    marginBottom: Theme.spacing.sm,
  },
  clearRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.error,
    marginLeft: Theme.spacing.sm,
  },
  footnote: {
    fontSize: 11,
    lineHeight: 17,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.sm,
  },
});
