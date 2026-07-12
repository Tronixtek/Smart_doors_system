import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Theme } from '../theme';

import { TTLockService } from '../services/ttlockService';

export default function DashboardScreen({ navigation }: any) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [accessPoints, setAccessPoints] = useState<any[]>([]);
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const { user, logout } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const [orgResponse, accessPointResponse, lockResponse] = await Promise.all([
        apiClient.get('/organizations'),
        apiClient.get('/access-points'),
        apiClient.get('/locks'),
      ]);

      setOrganizations(orgResponse.data);
      setAccessPoints(accessPointResponse.data);
      setLocks(lockResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleUnlock = async (lock: any) => {
    if (unlockingId) return;
    
    setUnlockingId(lock._id);
    try {
      const hasPermission = await TTLockService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Bluetooth permissions are required to unlock.');
        return;
      }

      await TTLockService.unlock(lock.lockData);
      Alert.alert('Success', `${lock.lockName} unlocked!`);
    } catch (error: any) {
      Alert.alert('Unlock Failed', error.message || 'Bluetooth connection failed');
    } finally {
      setUnlockingId(null);
    }
  };

  const renderLockItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.lockCard}
      onPress={() => navigation.navigate('LockDetails', { lock: item })}
    >
      <View style={styles.lockIconContainer}>
        <Ionicons 
          name={item.batteryLevel < 20 ? "battery-dead" : "lock-closed"} 
          size={24} 
          color={item.batteryLevel < 20 ? Theme.colors.error : Theme.colors.primary} 
        />
      </View>
      <View style={styles.lockInfo}>
        <Text style={styles.lockName}>{item.lockName}</Text>
        <Text style={styles.lockPoint}>{item.accessPointId?.name || 'Unassigned'}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.unlockButton, unlockingId === item._id && styles.unlockButtonDisabled]}
        onPress={() => handleUnlock(item)}
        disabled={unlockingId === item._id}
      >
        {unlockingId === item._id ? (
          <ActivityIndicator size="small" color={Theme.colors.white} />
        ) : (
          <Ionicons name="key-outline" size={20} color={Theme.colors.white} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAccessPointItem = ({ item }: any) => {
    const lockCount = locks.filter((lock: any) => lock.accessPointId?._id === item._id).length;
    const organizationName = item.organizationId?.name || 'Unknown organization';

    return (
      <View style={styles.accessPointCard}>
        <View style={styles.accessPointIcon}>
          <Ionicons name="business-outline" size={20} color={Theme.colors.primary} />
        </View>
        <View style={styles.accessPointInfo}>
          <Text style={styles.accessPointName}>{item.name}</Text>
          <Text style={styles.accessPointMeta}>
            {organizationName} - {item.type}{item.description ? ` - ${item.description}` : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.manageIcon}
          onPress={() => navigation.navigate('CreateAccessPoint', { accessPoint: item })}
        >
          <Ionicons name="settings-outline" size={18} color={Theme.colors.textLight} />
        </TouchableOpacity>
        <View style={styles.accessPointBadge}>
          <Text style={styles.accessPointBadgeText}>{lockCount}</Text>
        </View>
      </View>
    );
  };

  const renderOrganizationItem = ({ item }: any) => {
    const accessPointCount = accessPoints.filter((accessPoint) => accessPoint.organizationId?._id === item._id).length;

    return (
      <View style={styles.accessPointCard}>
        <View style={styles.accessPointIcon}>
          <Ionicons name="layers-outline" size={20} color={Theme.colors.primary} />
        </View>
        <View style={styles.accessPointInfo}>
          <Text style={styles.accessPointName}>{item.name}</Text>
          <Text style={styles.accessPointMeta}>{item.type} - {accessPointCount} access point{accessPointCount !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity 
          style={styles.manageIcon}
          onPress={() => navigation.navigate('CreateOrganization', { organization: item })}
        >
          <Ionicons name="settings-outline" size={18} color={Theme.colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.firstName || user?.email || 'there'}!</Text>
          <Text style={styles.statusText}>{organizations.length} organization{organizations.length !== 1 ? 's' : ''} - {accessPoints.length} access point{accessPoints.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: Theme.colors.primary }]}
          onPress={() => navigation.navigate('CreateOrganization')}
        >
          <Ionicons name="layers" size={32} color={Theme.colors.white} />
          <Text style={styles.actionText}>Add Organization</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: Theme.colors.secondary }]}
          onPress={() => navigation.navigate('CreateAccessPoint')}
        >
          <Ionicons name="business" size={32} color={Theme.colors.white} />
          <Text style={styles.actionText}>Add Access Point</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.secondaryActionRow}>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={() => navigation.navigate('RegisterLock')}>
          <Ionicons name="key-outline" size={18} color={Theme.colors.primary} />
          <Text style={styles.secondaryActionText}>Add Lock</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={locks}
            keyExtractor={(item: any) => item._id}
            renderItem={renderLockItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
            }
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryEyebrow}>Workspace Summary</Text>
                  <Text style={styles.summaryTitle}>{organizations.length} organization{organizations.length !== 1 ? 's' : ''}</Text>
                  <Text style={styles.summaryMeta}>{accessPoints.length} access point{accessPoints.length !== 1 ? 's' : ''} - {locks.length} lock{locks.length !== 1 ? 's' : ''}</Text>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Organizations</Text>
                </View>

                {organizations.length > 0 ? (
                  organizations.map((item) => (
                    <View key={item._id}>{renderOrganizationItem({ item })}</View>
                  ))
                ) : (
                  <View style={styles.inlineEmptyState}>
                    <Text style={styles.inlineEmptyTitle}>No organizations yet</Text>
                    <Text style={styles.inlineEmptyText}>
                      Create your first organization to start structuring access.
                    </Text>
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Access Points</Text>
                </View>

                {accessPoints.length > 0 ? (
                  accessPoints.map((item) => (
                    <View key={item._id}>{renderAccessPointItem({ item })}</View>
                  ))
                ) : (
                  <View style={styles.inlineEmptyState}>
                    <Text style={styles.inlineEmptyTitle}>No access points yet</Text>
                    <Text style={styles.inlineEmptyText}>
                      Create an access point inside an organization, then pair a lock to it.
                    </Text>
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Locks</Text>
                </View>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="key-outline" size={80} color={Theme.colors.border} />
                <Text style={styles.emptyText}>No locks registered yet.</Text>
                <Text style={styles.emptySubtext}>Add an access point, then pair your first lock.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  welcomeText: { fontSize: 24, fontWeight: '800', color: Theme.colors.text },
  statusText: { fontSize: 14, color: Theme.colors.textLight },
  logoutButton: { 
    padding: Theme.spacing.sm, 
    backgroundColor: Theme.colors.white, 
    borderRadius: Theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionGrid: { 
    flexDirection: 'row', 
    paddingHorizontal: Theme.spacing.lg, 
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
  },
  actionCard: { 
    width: '48%', 
    padding: Theme.spacing.md, 
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: { color: Theme.colors.white, fontWeight: '700', marginTop: Theme.spacing.xs, fontSize: 16 },
  secondaryActionRow: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  secondaryActionText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    marginLeft: Theme.spacing.sm,
  },
  listSection: { flex: 1, backgroundColor: Theme.colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.xl },
  summaryCard: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  summaryEyebrow: { fontSize: 12, fontWeight: '700', color: Theme.colors.textLight, textTransform: 'uppercase' },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: Theme.colors.text, marginTop: 4 },
  summaryMeta: { fontSize: 13, color: Theme.colors.textLight, marginTop: 6 },
  sectionHeader: { marginBottom: Theme.spacing.sm, marginTop: Theme.spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.text, marginBottom: Theme.spacing.md },
  listContent: { paddingBottom: 40 },
  accessPointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  accessPointIcon: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  accessPointInfo: { flex: 1 },
  accessPointName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  accessPointMeta: { fontSize: 12, color: Theme.colors.textLight, marginTop: 2 },
  manageIcon: { padding: 8, marginRight: 4 },
  accessPointBadge: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  accessPointBadgeText: { fontSize: 11, fontWeight: '700', color: Theme.colors.textLight },
  lockCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Theme.colors.background, 
    padding: Theme.spacing.md, 
    borderRadius: Theme.borderRadius.lg, 
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  lockIconContainer: { 
    width: 50, 
    height: 50, 
    backgroundColor: Theme.colors.white, 
    borderRadius: Theme.borderRadius.md, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  lockInfo: { flex: 1 },
  lockName: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  lockPoint: { fontSize: 13, color: Theme.colors.textLight, marginTop: 2 },
  unlockButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  unlockButtonDisabled: {
    backgroundColor: Theme.colors.textLight,
    elevation: 0,
  },
  lockStatus: { alignItems: 'flex-end', marginRight: Theme.spacing.md },
  batteryBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  batteryText: { fontSize: 11, fontWeight: '600', color: Theme.colors.textLight },
  inlineEmptyState: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  inlineEmptyTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  inlineEmptyText: { fontSize: 13, color: Theme.colors.textLight, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginTop: Theme.spacing.md },
  emptySubtext: { fontSize: 14, color: Theme.colors.textLight, textAlign: 'center', marginTop: Theme.spacing.xs, paddingHorizontal: 40 },
});
