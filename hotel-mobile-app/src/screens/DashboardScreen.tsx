import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDashboardStore } from '../store/dashboardStore';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 cards per row with padding

export default function DashboardScreen({ navigation }: any) {
  const { stats, isLoading, error, fetchDashboard, refreshDashboard } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = async () => {
    await refreshDashboard();
  };

  if (isLoading && !stats) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </Text>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.cardsRow}>
          <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.statValue}>{stats.rooms.occupancyRate}%</Text>
            <Text style={styles.statLabel}>Occupancy Rate</Text>
            <Text style={styles.statSubtext}>
              {stats.rooms.occupied}/{stats.rooms.total} rooms
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statValue}>{stats.reservations.todayCheckIns}</Text>
            <Text style={styles.statLabel}>Check-Ins Today</Text>
            <Text style={styles.statSubtext}>arrivals expected</Text>
          </View>
        </View>
        <View style={styles.cardsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.statValue}>{stats.reservations.todayCheckOuts}</Text>
            <Text style={styles.statLabel}>Check-Outs Today</Text>
            <Text style={styles.statSubtext}>departures expected</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
            <Text style={styles.statValue}>${stats.revenue.today.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
            <Text style={styles.statSubtext}>from check-outs</Text>
          </View>
        </View>
      </View>

      {/* Room Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Status</Text>
        <View style={styles.roomStatusCard}>
          <View style={styles.roomStatusRow}>
            <View style={styles.roomStatusItem}>
              <View style={[styles.roomStatusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.roomStatusLabel}>Available</Text>
              <Text style={styles.roomStatusValue}>{stats.rooms.available}</Text>
            </View>
            <View style={styles.roomStatusItem}>
              <View style={[styles.roomStatusDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.roomStatusLabel}>Occupied</Text>
              <Text style={styles.roomStatusValue}>{stats.rooms.occupied}</Text>
            </View>
          </View>
          <View style={styles.roomStatusRow}>
            <View style={styles.roomStatusItem}>
              <View style={[styles.roomStatusDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.roomStatusLabel}>Maintenance</Text>
              <Text style={styles.roomStatusValue}>{stats.rooms.maintenance}</Text>
            </View>
            <View style={styles.roomStatusItem} />
          </View>
        </View>
      </View>

      {/* Revenue Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Revenue</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>${stats.revenue.monthly.toFixed(2)}</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Paid</Text>
            <Text style={[styles.revenueValue, { color: '#4CAF50' }]}>
              ${stats.revenue.monthlyPaid.toFixed(2)}
            </Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Pending</Text>
            <Text style={[styles.revenueValue, { color: '#FF9800' }]}>
              ${stats.revenue.monthlyPending.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Reservations Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reservations</Text>
        <View style={styles.reservationsCard}>
          <View style={styles.reservationRow}>
            <Text style={styles.reservationLabel}>Active Reservations</Text>
            <Text style={styles.reservationValue}>{stats.reservations.active}</Text>
          </View>
          <View style={styles.reservationRow}>
            <Text style={styles.reservationLabel}>Upcoming Arrivals (7 days)</Text>
            <Text style={styles.reservationValue}>{stats.reservations.upcomingArrivals}</Text>
          </View>
        </View>
      </View>

      {/* Recent Reservations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reservations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reservations')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {stats.recentReservations.map((reservation) => (
          <TouchableOpacity
            key={reservation.id}
            style={styles.recentReservationCard}
            onPress={() => navigation.navigate('ReservationDetail', { id: reservation.id })}
          >
            <View style={styles.recentReservationHeader}>
              <Text style={styles.recentGuestName}>{reservation.guestName}</Text>
              {reservation.confirmationNumber && (
                <Text style={styles.recentConfirmation}>#{reservation.confirmationNumber}</Text>
              )}
            </View>
            <View style={styles.recentReservationBody}>
              <Text style={styles.recentDates}>
                {format(new Date(reservation.checkInDate), 'MMM dd')} - {format(new Date(reservation.checkOutDate), 'MMM dd')}
              </Text>
              {reservation.roomId && (
                <Text style={styles.recentRoom}>
                  {reservation.roomId.roomType} • Room {reservation.roomId.roomNumber}
                </Text>
              )}
              <Text style={styles.recentAmount}>${reservation.totalAmount.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => navigation.navigate('CreateReservation')}
          >
            <Text style={styles.actionButtonIcon}>📝</Text>
            <Text style={styles.actionButtonText}>New Reservation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Text style={styles.actionButtonIcon}>✅</Text>
            <Text style={styles.actionButtonText}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => navigation.navigate('CheckOut')}
          >
            <Text style={styles.actionButtonIcon}>🚪</Text>
            <Text style={styles.actionButtonText}>Check Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => navigation.navigate('Rooms')}
          >
            <Text style={styles.actionButtonIcon}>🏠</Text>
            <Text style={styles.actionButtonText}>Rooms</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: cardWidth,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  roomStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roomStatusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roomStatusItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  roomStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  roomStatusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  roomStatusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reservationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reservationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reservationLabel: {
    fontSize: 14,
    color: '#666',
  },
  reservationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recentReservationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentReservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentGuestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recentConfirmation: {
    fontSize: 12,
    color: '#666',
  },
  recentReservationBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentDates: {
    fontSize: 12,
    color: '#666',
  },
  recentRoom: {
    fontSize: 12,
    color: '#666',
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
