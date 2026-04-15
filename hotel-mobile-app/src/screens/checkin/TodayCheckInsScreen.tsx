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
import { useReservationStore } from '../../store/reservationStore';
import { Reservation } from '../../types/api';
import { format } from 'date-fns';

export default function TodayCheckInsScreen({ navigation }: any) {
  const { todayCheckIns, fetchTodayCheckIns, isLoading } = useReservationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCheckIns();
  }, []);

  const loadCheckIns = async () => {
    await fetchTodayCheckIns();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCheckIns();
    setRefreshing(false);
  };

  const renderReservation = ({ item }: { item: Reservation }) => {
    const isCheckedIn = item.status === 'CHECKED_IN';

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.guestName}>
            {item.guestName}
          </Text>
          {isCheckedIn && (
            <View style={styles.checkedInBadge}>
              <Text style={styles.checkedInText}>✓ Checked In</Text>
            </View>
          )}
        </View>
        
        {item.roomType && <Text style={styles.infoText}>Room Type: {item.roomType}</Text>}
        <Text style={styles.infoText}>Guests: {item.numberOfGuests}</Text>
        <Text style={styles.infoText}>
          Check-Out: {format(new Date(item.checkOutDate), 'MMM dd, yyyy')}
        </Text>
        {item.confirmationNumber && (
          <Text style={styles.confirmationText}>
            Confirmation: {item.confirmationNumber}
          </Text>
        )}

        {!isCheckedIn && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => navigation.navigate('CheckIn', { reservationId: item.id })}
          >
            <Text style={styles.checkInButtonText}>Check-In Now</Text>
          </TouchableOpacity>
        )}
        {isCheckedIn && item.roomNumber && (
          <View style={styles.roomAssigned}>
            <Text style={styles.roomAssignedText}>
              ✓ Room {item.roomNumber} assigned
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Today's Check-Ins</Text>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={todayCheckIns}
          renderItem={renderReservation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No check-ins scheduled for today</Text>
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
  headerContainer: {
    backgroundColor: '#0066CC',
    padding: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
  header: {
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
  checkedInBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkedInText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confirmationText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomAssigned: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  roomAssignedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
