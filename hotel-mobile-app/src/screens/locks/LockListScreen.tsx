import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { locksAPI } from '../../api/locks';
import { Lock } from '../../types/api';
import AppIcon from '../../components/AppIcon';

export default function LockListScreen({ navigation }: any) {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'LOW_BATTERY' | 'MAINTENANCE'>('ALL');

  const fetchLocks = async () => {
    try {
      setErrorMessage(null);
      const params: any = {};
      if (filter === 'ACTIVE') params.status = 'ACTIVE';
      if (filter === 'LOW_BATTERY') params.lowBattery = true;
      if (filter === 'MAINTENANCE') params.status = 'MAINTENANCE';

      const data = await locksAPI.getAll(params);
      setLocks(data);
    } catch (error: any) {
      console.error('Failed to fetch locks:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to fetch locks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLocks();
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocks();
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return 'battery-dead';
    if (level > 75) return 'battery-full';
    if (level > 50) return 'battery-half';
    if (level > 25) return 'battery-charging';
    return 'battery-dead';
  };

  const getBatteryColor = (level?: number) => {
    if (!level || level < 20) return '#ef4444';
    if (level < 50) return '#f59e0b';
    return '#10b981';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'INACTIVE':
        return '#6b7280';
      case 'MAINTENANCE':
        return '#f59e0b';
      case 'LOW_BATTERY':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderFilterButton = (label: string, value: typeof filter) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLockItem = ({ item }: { item: Lock }) => {
    const room = typeof item.roomId === 'object' ? item.roomId : null;
    const roomNumber = room?.roomNumber || 'N/A';

    return (
      <TouchableOpacity
        style={styles.lockCard}
        onPress={() => navigation.navigate('LockDetail', { lockId: item.id })}
      >
        <View style={styles.lockHeader}>
          <View style={styles.lockInfo}>
            <Text style={styles.lockName}>{item.lockName}</Text>
            <Text style={styles.lockSubtitle}>Room {roomNumber} • {item.lockMac}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.lockDetails}>
          <View style={styles.detailRow}>
            <AppIcon
              name={getBatteryIcon(item.batteryLevel)}
              size={20}
              color={getBatteryColor(item.batteryLevel)}
            />
            <Text style={styles.detailText}>
              {item.batteryLevel ? `${item.batteryLevel}%` : 'Unknown'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <AppIcon name="wifi" size={20} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.lastConnected
                ? new Date(item.lastConnected).toLocaleDateString()
                : 'Never'}
            </Text>
          </View>
        </View>

        {item.features && (
          <View style={styles.featuresRow}>
            {item.features.supportsPasscode && (
              <View style={styles.featureBadge}>
                <AppIcon name="keypad" size={14} color="#3b82f6" />
                <Text style={styles.featureText}>Code</Text>
              </View>
            )}
            {item.features.supportsCard && (
              <View style={styles.featureBadge}>
                <AppIcon name="card" size={14} color="#3b82f6" />
                <Text style={styles.featureText}>Card</Text>
              </View>
            )}
            {item.features.supportsFingerprint && (
              <View style={styles.featureBadge}>
                <AppIcon name="finger-print" size={14} color="#3b82f6" />
                <Text style={styles.featureText}>Print</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (errorMessage && locks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Unable to load locks</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setLoading(true);
          fetchLocks();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {renderFilterButton('All', 'ALL')}
        {renderFilterButton('Active', 'ACTIVE')}
        {renderFilterButton('Low Battery', 'LOW_BATTERY')}
        {renderFilterButton('Maintenance', 'MAINTENANCE')}
      </View>

      <FlatList
        data={locks}
        renderItem={renderLockItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon name="lock-closed-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No locks found</Text>
            <Text style={styles.emptySubtext}>Add a lock to get started</Text>
          </View>
        }
      />

      {errorMessage ? (
        <View style={styles.inlineBanner}>
          <Text style={styles.inlineBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddLock')}
      >
        <AppIcon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  lockCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lockInfo: {
    flex: 1,
  },
  lockName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  lockSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  lockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  inlineBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  inlineBannerText: {
    fontSize: 13,
    color: '#9a3412',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
