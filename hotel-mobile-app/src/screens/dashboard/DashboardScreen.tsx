import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useReservationStore } from '../../store/reservationStore';
import { useRoomStore } from '../../store/roomStore';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const {
    todayCheckIns,
    todayCheckOuts,
    fetchTodayCheckIns,
    fetchTodayCheckOuts,
    isLoading: reservationsLoading,
  } = useReservationStore();
  const { rooms, fetchRooms, isLoading: roomsLoading } = useRoomStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([
      fetchTodayCheckIns(),
      fetchTodayCheckOuts(),
      fetchRooms(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getRoomStats = () => {
    const stats = {
      total: rooms.length,
      available: rooms.filter((r) => r.status === 'AVAILABLE').length,
      occupied: rooms.filter((r) => r.status === 'OCCUPIED').length,
      cleaning: rooms.filter((r) => r.status === 'CLEANING').length,
      maintenance: rooms.filter((r) => r.status === 'MAINTENANCE').length,
    };
    return stats;
  };

  const roomStats = getRoomStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.role}>{user?.role.replace('_', ' ').toUpperCase()}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statNumber}>{todayCheckIns.length}</Text>
            <Text style={styles.statLabel}>Check-Ins</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.statNumber}>{todayCheckOuts.length}</Text>
            <Text style={styles.statLabel}>Check-Outs</Text>
          </View>
        </View>
      </View>

      {/* Room Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Status</Text>
        <View style={styles.roomStatusGrid}>
          <View style={styles.roomStatusCard}>
            <Text style={styles.roomStatusNumber}>{roomStats.available}</Text>
            <Text style={styles.roomStatusLabel}>Available</Text>
            <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
          </View>
          <View style={styles.roomStatusCard}>
            <Text style={styles.roomStatusNumber}>{roomStats.occupied}</Text>
            <Text style={styles.roomStatusLabel}>Occupied</Text>
            <View style={[styles.statusIndicator, { backgroundColor: '#2196F3' }]} />
          </View>
          <View style={styles.roomStatusCard}>
            <Text style={styles.roomStatusNumber}>{roomStats.cleaning}</Text>
            <Text style={styles.roomStatusLabel}>Cleaning</Text>
            <View style={[styles.statusIndicator, { backgroundColor: '#FF9800' }]} />
          </View>
          <View style={styles.roomStatusCard}>
            <Text style={styles.roomStatusNumber}>{roomStats.maintenance}</Text>
            <Text style={styles.roomStatusLabel}>Maintenance</Text>
            <View style={[styles.statusIndicator, { backgroundColor: '#F44336' }]} />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CheckIn')}
        >
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionText}>Check-In Guest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CheckOut')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Check-Out Guest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Reservations')}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>View Reservations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Rooms')}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={styles.actionText}>Manage Rooms</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066CC',
    padding: 24,
    paddingTop: 48,
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  role: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  roomStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomStatusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '47%',
    alignItems: 'center',
  },
  roomStatusNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  roomStatusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
