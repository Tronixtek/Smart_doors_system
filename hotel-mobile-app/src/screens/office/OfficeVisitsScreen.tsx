import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import officeVisitsAPI from '../../api/officeVisits';
import { OfficeVisit } from '../../types/api';

export default function OfficeVisitsScreen({ navigation }: any) {
  const [visits, setVisits] = useState<OfficeVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVisits = useCallback(async () => {
    try {
      const data = await officeVisitsAPI.getAll();
      setVisits(data);
    } catch (error) {
      console.error('Failed to load office visits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadVisits();
    }, [loadVisits])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadVisits();
  };

  const updateVisit = async (action: 'checkIn' | 'checkOut' | 'cancel', id: string) => {
    try {
      if (action === 'checkIn') {
        await officeVisitsAPI.checkIn(id);
      } else if (action === 'checkOut') {
        await officeVisitsAPI.checkOut(id);
      } else {
        await officeVisitsAPI.cancel(id);
      }
      await loadVisits();
    } catch (error: any) {
      Alert.alert('Visit Update Failed', error.response?.data?.error || 'Unable to update visit');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const person = typeof item.personId === 'object' ? item.personId : null;
          const space = typeof item.spaceId === 'object' ? item.spaceId : null;

          return (
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.headerInfo}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {person ? `${person.firstName} ${person.lastName}` : 'Unknown person'}
                  </Text>
                  <Text style={styles.meta}>
                    {space ? `${space.name} (${space.code})` : 'Unknown space'}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.detail}>
                {format(new Date(item.startAt), 'MMM dd, yyyy HH:mm')} to {format(new Date(item.endAt), 'MMM dd, yyyy HH:mm')}
              </Text>
              <Text style={styles.detail}>Purpose: {item.purpose.replace(/_/g, ' ')}</Text>
              <Text style={styles.detail}>
                Credential: {item.credentialRequested ? item.credentialType || 'Requested' : 'Not requested'}
              </Text>

              <View style={styles.actions}>
                {item.status === 'SCHEDULED' ? (
                  <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => updateVisit('checkIn', item.id)}>
                    <Text style={styles.buttonText}>Check In</Text>
                  </TouchableOpacity>
                ) : null}
                {item.status === 'CHECKED_IN' ? (
                  <TouchableOpacity style={[styles.button, styles.success]} onPress={() => updateVisit('checkOut', item.id)}>
                    <Text style={styles.buttonText}>Check Out</Text>
                  </TouchableOpacity>
                ) : null}
                {item.status === 'SCHEDULED' || item.status === 'CHECKED_IN' ? (
                  <TouchableOpacity style={[styles.button, styles.warning]} onPress={() => updateVisit('cancel', item.id)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No office visits yet</Text>
            <Text style={styles.emptyText}>Create visits here to start issuing office access.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateOfficeVisit')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  badge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6d28d9',
  },
  detail: {
    marginTop: 8,
    fontSize: 13,
    color: '#334155',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    marginTop: 8,
  },
  primary: {
    backgroundColor: '#2563eb',
  },
  success: {
    backgroundColor: '#059669',
  },
  warning: {
    backgroundColor: '#b45309',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
  },
});
