import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import officeSpacesAPI from '../../api/officeSpaces';
import { Lock, OfficeSpace } from '../../types/api';

type OfficeLockAssignment = {
  id: string;
  space: OfficeSpace;
  lock: Lock;
};

export default function OfficeLockListScreen({ navigation }: any) {
  const [assignments, setAssignments] = useState<OfficeLockAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setErrorMessage(null);
      const spaces = await officeSpacesAPI.getAll();
      const officeLocks = spaces
        .filter((space) => typeof space.linkedLockId === 'object' && space.linkedLockId)
        .map((space) => ({
          id: `${space.id}-${(space.linkedLockId as Lock).id}`,
          space,
          lock: space.linkedLockId as Lock,
        }));

      setAssignments(officeLocks);
    } catch (error: any) {
      console.error('Failed to load office locks:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to load office locks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAssignments();
    }, [loadAssignments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (errorMessage && assignments.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Unable to load office locks</Text>
        <Text style={styles.emptyText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => {
          setLoading(true);
          loadAssignments();
        }}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <Text style={styles.lockName}>{item.lock.lockName}</Text>
                <Text style={styles.lockMeta}>{item.lock.lockMac}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.lock.status}</Text>
              </View>
            </View>

            <Text style={styles.spaceTitle}>Assigned Space</Text>
            <Text style={styles.spaceText}>
              {item.space.name} ({item.space.code})
            </Text>
            <Text style={styles.spaceText}>
              {item.space.site} - Floor {item.space.floor}
            </Text>
            <Text style={styles.spaceText}>Type: {item.space.type.replace(/_/g, ' ')}</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Office Scope Only</Text>
              <Text style={styles.infoText}>
                This list only shows locks that are linked to office spaces. Hotel room locks are hidden in office mode.
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No office locks linked yet</Text>
            <Text style={styles.emptyText}>
              Link locks to office spaces first, then they will appear here.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('OfficeSpaces')}>
              <Text style={styles.primaryButtonText}>Open Office Spaces</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {errorMessage ? (
        <View style={styles.inlineBanner}>
          <Text style={styles.inlineBannerText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  lockName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  lockMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  spaceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  spaceText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  infoBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ecfeff',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#155e75',
  },
  infoText: {
    marginTop: 4,
    fontSize: 13,
    color: '#155e75',
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  inlineBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
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
});
