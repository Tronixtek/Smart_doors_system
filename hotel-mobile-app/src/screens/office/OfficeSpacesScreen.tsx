import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import officeSpacesAPI from '../../api/officeSpaces';
import { OfficeSpace } from '../../types/api';

export default function OfficeSpacesScreen() {
  const [spaces, setSpaces] = useState<OfficeSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const loadSpaces = useCallback(async () => {
    try {
      const data = await officeSpacesAPI.getAll(query.trim() ? { q: query.trim() } : undefined);
      setSpaces(data);
    } catch (error) {
      console.error('Failed to load office spaces:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSpaces();
    }, [loadSpaces])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSpaces();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search spaces by name or code"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          onSubmitEditing={loadSpaces}
        />
      </View>

      <FlatList
        data={spaces}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const lock = typeof item.linkedLockId === 'object' ? item.linkedLockId : null;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.spaceName}>{item.name}</Text>
                  <Text style={styles.spaceCode}>
                    {item.code} • {item.site} • Floor {item.floor}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.metaText}>Type: {item.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.metaText}>Capacity: {item.capacity}</Text>
              {item.department ? <Text style={styles.metaText}>Department: {item.department}</Text> : null}
              {lock ? <Text style={styles.metaText}>Linked Lock: {lock.lockName}</Text> : null}

              <View style={styles.featureRow}>
                <Text style={styles.featureText}>{item.features?.supportsVisitors ? 'Visitors allowed' : 'Visitors restricted'}</Text>
                <Text style={styles.featureText}>{item.features?.requiresBooking ? 'Booking required' : 'Open access model'}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No office spaces yet</Text>
            <Text style={styles.emptyText}>Create spaces from the backend first, then they will appear here.</Text>
          </View>
        }
      />
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
  },
  searchWrap: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  spaceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  spaceCode: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  metaText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#0f766e',
    marginRight: 12,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
