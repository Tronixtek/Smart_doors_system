import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { TTLockService } from '../services/ttlockService';
import { TTLOCK_EVENTS, TTLockCompat } from '../services/ttlockCompat';
import apiClient from '../api/client';

export default function LockDetailsScreen({ route, navigation }: any) {
  const { lock } = route.params;
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'PIN' | 'CARD' | 'FINGERPRINT' | 'EDIT' | null>(null);
  const [pin, setPin] = useState('');
  const [credentialName, setCredentialName] = useState('');
  const [progressText, setProgressText] = useState('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [editLockName, setEditLockName] = useState(lock.lockName);

  useEffect(() => {
    fetchLogs();
    const emitter = TTLockCompat.getEmitter();
    if (!emitter) return;
    
    const cardSub = emitter.addListener(TTLOCK_EVENTS.ADD_CARD_PROGRESS, () => {
      setProgressText('Please place your IC card on the lock...');
    });

    const fingerSub = emitter.addListener(TTLOCK_EVENTS.ADD_FINGERPRINT_PROGRESS, (data: any) => {
      // data might be [currentCount, totalCount] or similar depending on SDK
      if (Array.isArray(data)) {
        setProgressText(`Processing fingerprint: ${data[0]}/${data[1]}`);
      } else {
        setProgressText('Please place your finger on the sensor...');
      }
    });

    return () => {
      cardSub.remove();
      fingerSub.remove();
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await apiClient.get(`/locks/${lock._id}/logs`);
      setRecentLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const handleSyncLogs = async () => {
    setSyncing(true);
    try {
      const logs = await TTLockService.getLogs(lock.lockData);
      if (logs.length > 0) {
        await apiClient.post(`/locks/${lock._id}/logs`, { logs });
        Alert.alert('Sync Complete', `Successfully synced ${logs.length} access records.`);
        fetchLogs();
      } else {
        Alert.alert('No New Logs', 'The lock has no new access records to sync.');
      }
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'Could not fetch logs from hardware');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAppLogs = async () => {
    Alert.alert(
      'Clear Access History',
      'This will delete all access records from the Mako Access database. Note: Records stored on the physical lock hardware cannot be deleted for security auditing, but they will be removed from your dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear History', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.delete(`/locks/${lock._id}/logs`);
              setRecentLogs([]);
              Alert.alert('Success', 'Access history cleared from app.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to clear history');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateLock = async () => {
    if (!editLockName.trim()) return;
    setLoading(true);
    try {
      await apiClient.put(`/locks/${lock._id}`, { lockName: editLockName });
      Alert.alert('Success', 'Lock updated successfully');
      setModalVisible(false);
      navigation.goBack(); // Refresh dashboard
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update lock');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLock = async () => {
    Alert.alert(
      'Delete Lock',
      'Are you sure you want to remove this lock? This will not reset the hardware, only remove it from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.delete(`/locks/${lock._id}`);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete lock');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddPIN = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
      return;
    }
    if (!credentialName) {
      Alert.alert('Name Required', 'Please enter the name of the person using this PIN.');
      return;
    }

    setLoading(true);
    try {
      const startDate = Date.now();
      const endDate = startDate + 365 * 24 * 60 * 60 * 1000; // 1 year
      await TTLockService.addPasscode(lock.lockData, pin, startDate, endDate);
      
      // Save to backend
      await apiClient.post(`/locks/${lock._id}/credentials`, {
        name: credentialName,
        keyType: 'PASSCODE',
        keyIdentifier: pin, // In a real app we might not want to store the PIN itself, but for local hardware logs we need it
        startDate,
        endDate,
      });

      Alert.alert('Success', `PIN for ${credentialName} added successfully!`);
      setModalVisible(false);
      setPin('');
      setCredentialName('');
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Could not add PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!credentialName) {
      Alert.alert('Name Required', 'Please enter the name of the person using this card.');
      return;
    }

    setLoading(true);
    setProgressText('Preparing lock for IC card...');
    
    try {
      const startDate = Date.now();
      const endDate = startDate + 365 * 24 * 60 * 60 * 1000;
      const cardNumber = await TTLockService.addCard(lock.lockData, startDate, endDate);
      
      // Save to backend
      await apiClient.post(`/locks/${lock._id}/credentials`, {
        name: credentialName,
        keyType: 'CARD',
        keyIdentifier: cardNumber,
        startDate,
        endDate,
      });

      Alert.alert('Success', `IC Card for ${credentialName} added successfully!`);
      setModalVisible(false);
      setCredentialName('');
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Could not add IC card');
      setModalVisible(false);
    }
  };

  const handleAddFingerprint = async () => {
    if (!credentialName) {
      Alert.alert('Name Required', 'Please enter the name of the person using this fingerprint.');
      return;
    }

    setLoading(true);
    setProgressText('Preparing fingerprint sensor...');
    
    try {
      const startDate = Date.now();
      const endDate = startDate + 365 * 24 * 60 * 60 * 1000;
      const fingerNumber = await TTLockService.addFingerprint(lock.lockData, startDate, endDate);
      
      // Save to backend
      await apiClient.post(`/locks/${lock._id}/credentials`, {
        name: credentialName,
        keyType: 'FINGERPRINT',
        keyIdentifier: fingerNumber,
        startDate,
        endDate,
      });

      Alert.alert('Success', `Fingerprint for ${credentialName} added successfully!`);
      setModalVisible(false);
      setCredentialName('');
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Could not add fingerprint');
      setModalVisible(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { setModalType('EDIT'); setModalVisible(true); }}>
            <Ionicons name="create-outline" size={24} color={Theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteLock} style={{ marginLeft: 15 }}>
            <Ionicons name="trash-outline" size={24} color={Theme.colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.lockIconBox}>
          <Ionicons name="lock-closed" size={40} color={Theme.colors.primary} />
        </View>
        <Text style={styles.lockName}>{lock.lockName}</Text>
        <Text style={styles.lockMac}>{lock.lockMac}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hardware Features</Text>
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => { setModalType('PIN'); setModalVisible(true); setCredentialName(''); }}>
            <View style={[styles.featureIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="apps-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.featureLabel}>Add PIN</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => { setModalType('CARD'); setModalVisible(true); setCredentialName(''); setProgressText('Enter name then tap Start'); }}>
            <View style={[styles.featureIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="card-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.featureLabel}>Add IC Card</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => { setModalType('FINGERPRINT'); setModalVisible(true); setCredentialName(''); setProgressText('Enter name then tap Start'); }}>
            <View style={[styles.featureIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="finger-print-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.featureLabel}>Add Fingerprint</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        <Text style={styles.sectionHint}>
          View who has access, remove a PIN, card or fingerprint, or wipe credentials added
          directly on the lock.
        </Text>
        <TouchableOpacity
          style={styles.manageRow}
          onPress={() => navigation.navigate('ManageCredentials', { lock })}
        >
          <View style={styles.manageIcon}>
            <Ionicons name="key-outline" size={18} color={Theme.colors.primary} />
          </View>
          <Text style={styles.manageRowText}>Manage credentials</Text>
          <Ionicons name="chevron-forward" size={18} color={Theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Access History</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={[styles.syncButton, { marginRight: 8 }]} 
              onPress={handleClearAppLogs}
            >
              <Ionicons name="trash-outline" size={16} color={Theme.colors.error} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]} 
              onPress={handleSyncLogs}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={16} color={Theme.colors.primary} />
                  <Text style={styles.syncButtonText}>Sync</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {recentLogs.length > 0 ? (
          recentLogs.map((log) => (
            <View key={log._id} style={styles.logCard}>
              <View style={styles.logIconBox}>
                <Ionicons 
                  name={
                    log.method === 'FINGERPRINT' ? 'finger-print' :
                    log.method === 'CARD' ? 'card' :
                    log.method === 'PASSCODE' ? 'apps' : 'key'
                  } 
                  size={18} 
                  color={Theme.colors.textLight} 
                />
              </View>
              <View style={styles.logInfo}>
                <Text style={styles.logCredentialName}>{log.credentialName}</Text>
                <Text style={styles.logMeta}>
                  {log.method} • {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
              {log.success && (
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.secondary} />
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyLogs}>
            <Text style={styles.emptyLogsText}>No access records yet. Sync with the lock to see recent activity.</Text>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'PIN' ? 'Create New PIN' : 
               modalType === 'CARD' ? 'Register IC Card' : 
               modalType === 'EDIT' ? 'Edit Lock Name' :
               'Register Fingerprint'}
            </Text>

            {modalType === 'EDIT' ? (
              <View style={styles.pinContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Lock Name"
                  placeholderTextColor={Theme.colors.textLight}
                  value={editLockName}
                  onChangeText={setEditLockName}
                  cursorColor="#000000"
                  selectionColor={Theme.colors.primary}
                />
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleUpdateLock}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Who is this for?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                placeholderTextColor={Theme.colors.textLight}
                value={credentialName}
                onChangeText={setCredentialName}
                cursorColor="#000000"
                selectionColor={Theme.colors.primary}
              />
            </View>

            {modalType === 'PIN' ? (
              <View style={styles.pinContainer}>
                <Text style={styles.inputLabel}>Set PIN (4-9 digits)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter PIN"
                  placeholderTextColor={Theme.colors.textLight}
                  keyboardType="numeric"
                  value={pin}
                  onChangeText={setPin}
                  maxLength={9}
                  cursorColor="#000000"
                  selectionColor={Theme.colors.primary}
                />
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleAddPIN}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save PIN</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.progressText}>{progressText}</Text>
                {modalType === 'CARD' && (
                  <Text style={styles.progressHint}>Place card on lock after entering name.</Text>
                )}
                {modalType === 'FINGERPRINT' && (
                  <Text style={styles.progressHint}>Follow the touches on the lock sensor.</Text>
                )}
                
                <TouchableOpacity
                  style={[styles.primaryButton, { width: '100%', marginTop: 20 }]}
                  onPress={modalType === 'CARD' ? handleAddCard : handleAddFingerprint}
                  disabled={loading || !credentialName}
                >
                  <Text style={styles.buttonText}>Start Enrollment</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Theme.colors.border, position: 'relative' },
  headerActions: { position: 'absolute', top: 20, right: 20, flexDirection: 'row' },
  lockIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  lockName: { fontSize: 24, fontWeight: '800', color: Theme.colors.text },
  lockMac: { fontSize: 14, color: Theme.colors.textLight, marginTop: 4 },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  syncButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Theme.borderRadius.md },
  syncButtonDisabled: { opacity: 0.5 },
  syncButtonText: { fontSize: 12, fontWeight: '600', color: Theme.colors.primary, marginLeft: 6 },
  featureGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  featureCard: { width: '31%', backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  featureIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.text },
  
  sectionHint: { fontSize: 12, color: Theme.colors.textLight, lineHeight: 18, marginTop: 4, marginBottom: 14 },

  manageRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, height: 60, borderRadius: Theme.borderRadius.lg },
  manageIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  manageRowText: { flex: 1, fontSize: 15, fontWeight: '700', color: Theme.colors.text },

  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 },
  logIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logInfo: { flex: 1 },
  logCredentialName: { fontSize: 14, fontWeight: '700', color: Theme.colors.text },
  logMeta: { fontSize: 11, color: Theme.colors.textLight, marginTop: 2 },
  emptyLogs: { padding: 30, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 15 },
  emptyLogsText: { fontSize: 13, color: Theme.colors.textLight, textAlign: 'center', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, color: Theme.colors.text },
  inputGroup: { width: '100%', marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Theme.colors.textLight, marginBottom: 8, marginLeft: 4 },
  pinContainer: { width: '100%' },
  input: { 
    height: 50, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    fontSize: 16, 
    marginBottom: 15, 
    color: '#000000',
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  primaryButton: { height: 55, backgroundColor: Theme.colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressContainer: { alignItems: 'center', padding: 20, width: '100%' },
  progressText: { marginTop: 20, fontSize: 16, textAlign: 'center', color: Theme.colors.text, fontWeight: '600' },
  progressHint: { marginTop: 8, fontSize: 12, textAlign: 'center', color: Theme.colors.textLight },
  secondaryButton: { marginTop: 15, padding: 10 },
  secondaryButtonText: { color: Theme.colors.textLight, fontWeight: '600' },
});
