import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useReservationStore } from '../../store/reservationStore';
import { Reservation } from '../../types/api';
import { format } from 'date-fns';

export default function ReservationsListScreen({ navigation }: any) {
  const {
    reservations,
    fetchReservations,
    searchReservations,
    isLoading,
  } = useReservationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchReservations(searchQuery);
    } else {
      await fetchReservations();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'checked_in':
        return '#2196F3';
      case 'checked_out':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderReservation = ({ item }: { item: Reservation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReservationDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.guestName}>
          {item.guestName}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {item.confirmationNumber && <Text style={styles.confirmationNumber}>#{item.confirmationNumber}</Text>}
        {item.roomType && <Text style={styles.roomType}>Room Type: {item.roomType}</Text>}
        {item.roomNumber && <Text style={styles.roomNumber}>Room: {item.roomNumber}</Text>}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Check-In</Text>
          <Text style={styles.dateValue}>
            {format(new Date(item.checkInDate), 'MMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Check-Out</Text>
          <Text style={styles.dateValue}>
            {format(new Date(item.checkOutDate), 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by confirmation # or guest name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Reservations List */}
      <FlatList
        data={reservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reservations found</Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReservation')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  searchButtonText: {
    fontSize: 20,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  confirmationNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomType: {
    fontSize: 14,
    color: '#666',
  },
  roomNumber: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
