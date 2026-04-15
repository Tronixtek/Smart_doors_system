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
import officePeopleAPI from '../../api/officePeople';
import { OfficePerson } from '../../types/api';

export default function OfficePeopleScreen({ navigation }: any) {
  const [people, setPeople] = useState<OfficePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadPeople = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await officePeopleAPI.getAll(query.trim() ? { q: query.trim() } : undefined);
      setPeople(data);
    } catch (error: any) {
      console.error('Failed to load office people:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to load office people.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPeople();
    }, [loadPeople])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPeople();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (errorMessage && people.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Unable to load office people</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setLoading(true);
          loadPeople();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search people by name, email, or employee ID"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          onSubmitEditing={loadPeople}
        />
      </View>

      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const host = typeof item.hostUserId === 'object' ? item.hostUserId : null;
          return (
            <View style={styles.card}>
              <View style={styles.initialsBubble}>
                <Text style={styles.initialsText}>
                  {item.firstName.charAt(0)}
                  {item.lastName.charAt(0)}
                </Text>
              </View>
              <View style={styles.infoWrap}>
                <Text style={styles.name}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.meta}>{item.personType}</Text>
                {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
                {item.company ? <Text style={styles.meta}>Company: {item.company}</Text> : null}
                {item.department ? <Text style={styles.meta}>Department: {item.department}</Text> : null}
                {host ? <Text style={styles.meta}>Host: {host.firstName} {host.lastName}</Text> : null}
              </View>
              <View style={styles.statusWrap}>
                <Text style={styles.status}>{item.status}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No office people found</Text>
            <Text style={styles.emptyText}>Employees, visitors, and contractors will appear here once added.</Text>
          </View>
        }
      />

      {errorMessage ? (
        <View style={styles.inlineBanner}>
          <Text style={styles.inlineBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateOfficePerson')}>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  initialsBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoWrap: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  statusWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#2563eb',
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
