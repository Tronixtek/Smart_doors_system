import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useReservationStore } from '../../store/reservationStore';
import { Reservation } from '../../types/api';
import { format } from 'date-fns';

export default function ReservationDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { getReservationById, cancelReservation } = useReservationStore();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadReservation();
  }, [id]);

  const loadReservation = async () => {
    setIsLoading(true);
    try {
      const data = await getReservationById(id);
      setReservation(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reservation');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditReservation', { reservationId: id });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: performCancel,
        },
      ]
    );
  };

  const performCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelReservation(id);
      Alert.alert(
        'Success',
        'Reservation cancelled successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to cancel reservation'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#4CAF50';
      case 'CHECKED_IN':
        return '#2196F3';
      case 'CHECKED_OUT':
        return '#9E9E9E';
      case 'CANCELLED':
        return '#F44336';
      case 'PENDING':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading reservation...</Text>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Reservation not found</Text>
      </View>
    );
  }

  const canEdit = reservation.status !== 'CHECKED_OUT' && reservation.status !== 'CANCELLED';
  const canCancel = reservation.status !== 'CHECKED_OUT' && reservation.status !== 'CANCELLED';

  return (
    <ScrollView style={styles.container}>
      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) }]}>
          <Text style={styles.statusText}>{reservation.status}</Text>
        </View>
      </View>

      {/* Guest Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{reservation.guestName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{reservation.guestEmail}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{reservation.guestPhone}</Text>
        </View>
        {reservation.guestIdNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Number:</Text>
            <Text style={styles.infoValue}>{reservation.guestIdNumber}</Text>
          </View>
        )}
      </View>

      {/* Reservation Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reservation Details</Text>
        {reservation.confirmationNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Confirmation #:</Text>
            <Text style={styles.infoValue}>{reservation.confirmationNumber}</Text>
          </View>
        )}
        {reservation.roomType && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room Type:</Text>
            <Text style={styles.infoValue}>{reservation.roomType}</Text>
          </View>
        )}
        {reservation.roomNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room Number:</Text>
            <Text style={styles.infoValue}>{reservation.roomNumber}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Guests:</Text>
          <Text style={styles.infoValue}>{reservation.numberOfGuests}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-In:</Text>
          <Text style={styles.infoValue}>
            {format(new Date(reservation.checkInDate), 'EEEE, MMMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-Out:</Text>
          <Text style={styles.infoValue}>
            {format(new Date(reservation.checkOutDate), 'EEEE, MMMM dd, yyyy')}
          </Text>
        </View>
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Amount:</Text>
          <Text style={styles.amountValue}>${reservation.totalAmount.toFixed(2)}</Text>
        </View>
        {reservation.paidAmount !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paid Amount:</Text>
            <Text style={styles.amountValue}>${reservation.paidAmount.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* Special Requests */}
      {reservation.specialRequests && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests</Text>
          <Text style={styles.specialRequestsText}>{reservation.specialRequests}</Text>
        </View>
      )}

      {/* Notes */}
      {reservation.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{reservation.notes}</Text>
        </View>
      )}

      {/* Actions */}
      {(canEdit || canCancel) && (
        <View style={styles.actionsContainer}>
          {canEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              disabled={isCancelling}
            >
              <Text style={styles.editButtonText}>✏️ Edit Reservation</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cancelButtonText}>🚫 Cancel Reservation</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Timestamps */}
      <View style={styles.timestampsContainer}>
        <Text style={styles.timestampText}>
          Created: {format(new Date(reservation.createdAt), 'MMM dd, yyyy HH:mm')}
        </Text>
        {reservation.updatedAt && (
          <Text style={styles.timestampText}>
            Updated: {format(new Date(reservation.updatedAt), 'MMM dd, yyyy HH:mm')}
          </Text>
        )}
      </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '700',
    flex: 2,
    textAlign: 'right',
  },
  specialRequestsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#999',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timestampsContainer: {
    padding: 16,
    backgroundColor: '#fafafa',
    marginTop: 12,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
