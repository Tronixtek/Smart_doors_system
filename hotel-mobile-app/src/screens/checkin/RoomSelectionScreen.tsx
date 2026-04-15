import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRoomStore } from '../../store/roomStore';
import { Room } from '../../types/api';

export default function RoomSelectionScreen({ navigation, route }: any) {
  const { roomType, onSelectRoom } = route.params || {};
  const { rooms, fetchRooms, isLoading } = useRoomStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const availableRooms = rooms.filter(
    (room) =>
      room.status === 'AVAILABLE' &&
      (!roomType || room.roomType.toLowerCase().includes(roomType.toLowerCase()))
  );

  const filteredRooms = availableRooms.filter((room) => {
    const matchesSearch = room.roomNumber.includes(searchQuery);
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor;
    return matchesSearch && matchesFloor;
  });

  const floors = Array.from(new Set(availableRooms.map((room) => room.floor))).sort();

  const handleSelectRoom = (room: Room) => {
    onSelectRoom(room);
    navigation.goBack();
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => handleSelectRoom(item)}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
        <Text style={styles.roomFloor}>Floor {item.floor}</Text>
      </View>
      <Text style={styles.roomType}>{item.roomType}</Text>
      <View style={styles.roomFeatures}>
        <Text style={styles.featureText}>
          👥 Max {item.maxOccupancy || 2} guests
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search room number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Floor Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Floor:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFloor === null && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFloor(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFloor === null && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {floors.map((floor) => (
            <TouchableOpacity
              key={floor}
              style={[
                styles.filterButton,
                selectedFloor === floor && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFloor(floor)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFloor === floor && styles.filterButtonTextActive,
                ]}
              >
                {floor}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Rooms List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No available rooms found</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    color: '#333',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  roomFloor: {
    fontSize: 14,
    color: '#999',
  },
  roomType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roomFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
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
