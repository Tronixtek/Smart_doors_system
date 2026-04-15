import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoomStore } from '../../store/roomStore';
import { Room } from '../../types/api';

export default function RoomsListScreen({ navigation }: any) {
  const { rooms, fetchRooms, updateRoomStatus, isLoading } = useRoomStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    await fetchRooms();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const filteredRooms = filterStatus
    ? rooms.filter((room) => room.status === filterStatus)
    : rooms;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return '#4CAF50';
      case 'OCCUPIED':
        return '#2196F3';
      case 'CLEANING':
        return '#FF9800';
      case 'MAINTENANCE':
        return '#F44336';
      case 'OUT_OF_SERVICE':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return '✅';
      case 'OCCUPIED':
        return '🔒';
      case 'CLEANING':
        return '🧹';
      case 'MAINTENANCE':
        return '🔧';
      case 'OUT_OF_SERVICE':
        return '🚫';
      default:
        return '❓';
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => navigation.navigate('RoomDetail', { roomId: item.id })}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomNumber}>{getStatusIcon(item.status)} Room {item.roomNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.roomType}>{item.roomType}</Text>
      <View style={styles.roomInfo}>
        <Text style={styles.infoText}>Floor {item.floor}</Text>
        <Text style={styles.infoText}>•</Text>
        <Text style={styles.infoText}>Max {item.maxOccupancy || 2} guests</Text>
      </View>
    </TouchableOpacity>
  );

  const statusFilters = [
    { label: 'All', value: null },
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Occupied', value: 'OCCUPIED' },
    { label: 'Cleaning', value: 'CLEANING' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
  ];

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === item.value && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => String(item.value)}
        />
      </View>

      {/* Rooms List */}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rooms found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  roomCard: {
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
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomNumber: {
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
    fontWeight: 'bold',
  },
  roomType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roomInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
