import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { useReservationStore } from '../../store/reservationStore';
import { useRoomStore } from '../../store/roomStore';
import { checkOutAPI } from '../../api/checkin';
import { locksAPI } from '../../api/locks';
import { lockKeysAPI } from '../../api/lockKeys';
import { Ttlock } from 'react-native-ttlock';
import { format } from 'date-fns';
import { Reservation } from '../../types/api';

export default function CheckOutScreen({ navigation, route }: any) {
  const reservationId = route?.params?.reservationId;
  
  const { selectedReservation, selectReservation, todayCheckOuts, fetchTodayCheckOuts, isLoading } = useReservationStore();
  const { fetchRooms } = useRoomStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [chargesDescription, setChargesDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [roomCondition, setRoomCondition] = useState('clean');
  const [revokeKey, setRevokeKey] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (reservationId) {
      loadReservationData();
    } else {
      // No reservation ID provided, fetch today's check-outs
      fetchTodayCheckOuts();
    }
  }, [reservationId]);

  const loadReservationData = async () => {
    await selectReservation(reservationId);
  };

  const handleSelectReservation = (reservation: Reservation) => {
    selectReservation(reservation.id);
  };

  const handleCheckOut = async () => {
    if (!selectedReservation) {
      Alert.alert('Error', 'No reservation selected');
      return;
    }

    const additional = parseFloat(additionalCharges) || 0;
    const finalTotal = selectedReservation.totalAmount + additional;
    const balance = finalTotal - (selectedReservation.paidAmount || 0);

    const message = balance > 0
      ? `Outstanding balance: $${balance.toFixed(2)}\n\nPayment method: ${paymentMethod.toUpperCase()}`
      : `Fully paid. Refund: $${Math.abs(balance).toFixed(2)}`;

    Alert.alert(
      'Confirm Check-Out',
      `Guest: ${selectedReservation.guestName}\nRoom: ${selectedReservation.roomNumber}\n\n${message}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: performCheckOut },
      ]
    );
  };

  const performCheckOut = async () => {
    if (!selectedReservation) return;

    setIsProcessing(true);
    try {
      const additional = parseFloat(additionalCharges) || 0;
      const finalTotal = selectedReservation.totalAmount + additional;

      const checkOutData = {
        reservationId: selectedReservation.id,
        actualCheckOutTime: new Date().toISOString(),
        finalCharges: finalTotal,
        paymentMethod,
        roomCondition,
        revokeKey,
        notes: notes.trim() || (chargesDescription.trim() ? `Additional charges: ${chargesDescription}` : undefined),
      };

      const result = await checkOutAPI.checkOutWithKeyRevoke(checkOutData);

      // If key revocation was requested, delete passcodes/cards from the physical lock
      if (revokeKey && selectedReservation.roomId) {
        try {
          // Get all keys for this reservation
          const keys = await lockKeysAPI.getByReservationId(selectedReservation.id);
          
          if (keys.length > 0) {
            // Get lock data for the room
            const roomId = typeof selectedReservation.roomId === 'object' 
              ? (selectedReservation.roomId as any).id 
              : selectedReservation.roomId;
            const lock = await locksAPI.getByRoomId(roomId);
            
            if (lock && lock.lockData) {
              // Delete each passcode/card from the physical lock
              for (const key of keys) {
                if (key.keyType === 'PASSCODE' && key.metadata?.passcode) {
                  try {
                    await new Promise<void>((resolve, reject) => {
                      Ttlock.deletePasscode(
                        key.metadata!.passcode!,
                        lock.lockData,
                        () => {
                          // Success - passcode deleted from lock
                          resolve();
                        },
                        (errorCode, errorMsg) => {
                          // Failed to delete from lock
                          console.warn(`Failed to delete passcode from lock: ${errorMsg}`);
                          // Don't reject - continue with other keys
                          resolve();
                        }
                      );
                    });
                  } catch (lockError) {
                    console.error('Error deleting passcode from lock:', lockError);
                  }
                } else if (key.keyType === 'CARD' && key.metadata?.cardNumber) {
                  try {
                    await new Promise<void>((resolve) => {
                      Ttlock.deleteCard(
                        key.metadata!.cardNumber!,
                        lock.lockData,
                        () => {
                          // Success - card deleted from lock
                          resolve();
                        },
                        (errorCode, errorMsg) => {
                          // Failed to delete card from lock
                          console.warn(`Failed to delete card from lock: ${errorMsg}`);
                          // Don't reject - continue with other keys
                          resolve();
                        }
                      );
                    });
                  } catch (cardError) {
                    console.error('Error deleting card from lock:', cardError);
                  }
                }
              }
            }
          }
        } catch (lockError: any) {
          console.error('Lock deletion error:', lockError);
          // Don't fail checkout if lock deletion fails
        }
      }

      // Refresh room data to reflect updated status
      await fetchRooms();

      const message = result.data.balance > 0
        ? `Outstanding Balance: $${result.data.balance.toFixed(2)}`
        : result.data.balance < 0
        ? `Refund Due: $${Math.abs(result.data.balance).toFixed(2)}`
        : 'Fully Paid';

      Alert.alert(
        'Check-Out Successful! ✅',
        `${selectedReservation.guestName} checked out from Room ${selectedReservation.roomNumber}\n\n${message}${revokeKey ? '\n\n🔒 Passcodes/cards deleted from lock' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Check-Out Failed',
        error.response?.data?.error || 'Unable to complete check-out'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!reservationId && !selectedReservation) {
    // Show reservation selection list
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Reservation to Check Out</Text>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading reservations...</Text>
          </View>
        ) : todayCheckOuts.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No reservations ready for check-out</Text>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={todayCheckOuts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.reservationCard}
                onPress={() => handleSelectReservation(item)}
              >
                <View style={styles.reservationHeader}>
                  <Text style={styles.reservationGuestName}>{item.guestName}</Text>
                  <Text style={styles.roomNumber}>Room {item.roomNumber || 'N/A'}</Text>
                </View>
                <Text style={styles.reservationDetail}>
                  📧 {item.guestEmail}
                </Text>
                <Text style={styles.reservationDetail}>
                  📞 {item.guestPhone}
                </Text>
                <Text style={styles.reservationDetail}>
                  📅 Check-out: {format(new Date(item.checkOutDate), 'MMM dd, yyyy')}
                </Text>
                <View style={styles.reservationFooter}>
                  <Text style={styles.roomType}>🏠 {item.roomType}</Text>
                  <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    );
  }

  if (!selectedReservation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading reservation...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Guest Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Information</Text>
        <View style={styles.card}>
          <Text style={styles.guestName}>
            {selectedReservation.guestName}
          </Text>
          <Text style={styles.infoText}>Room: {selectedReservation.roomNumber}</Text>
          {selectedReservation.confirmationNumber && (
            <Text style={styles.infoText}>
              🔖 Confirmation: {selectedReservation.confirmationNumber}
            </Text>
          )}
        </View>
      </View>

      {/* Stay Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stay Details</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Check-In Date:</Text>
            <Text style={styles.value}>
              {format(new Date(selectedReservation.checkInDate), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-Out Date:</Text>
            <Text style={styles.value}>
              {format(new Date(selectedReservation.checkOutDate), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Room Charges:</Text>
            <Text style={styles.value}>${selectedReservation.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Paid (Deposit):</Text>
            <Text style={[styles.value, { color: '#4CAF50' }]}>
              ${(selectedReservation.paidAmount || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Additional Charges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Charges</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Amount ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={additionalCharges}
            onChangeText={setAdditionalCharges}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>
            Description (e.g., minibar, room service)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Optional description"
            value={chargesDescription}
            onChangeText={setChargesDescription}
          />
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Room Charges:</Text>
            <Text style={styles.value}>${selectedReservation.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Additional Charges:</Text>
            <Text style={styles.value}>${(parseFloat(additionalCharges) || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 2, borderBottomColor: '#333' }]}>
            <Text style={[styles.label, { fontWeight: 'bold', fontSize: 16 }]}>
              Total Charges:
            </Text>
            <Text style={[styles.value, { fontWeight: 'bold', fontSize: 18, color: '#2196F3' }]}>
              ${(selectedReservation.totalAmount + (parseFloat(additionalCharges) || 0)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: '#4CAF50' }]}>Paid:</Text>
            <Text style={[styles.value, { color: '#4CAF50' }]}>
              -${(selectedReservation.paidAmount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { fontWeight: 'bold', fontSize: 16 }]}>
              {(selectedReservation.totalAmount + (parseFloat(additionalCharges) || 0) - (selectedReservation.paidAmount || 0)) > 0
                ? 'Balance Due:'
                : 'Refund:'}
            </Text>
            <Text
              style={[
                styles.value,
                {
                  fontWeight: 'bold',
                  fontSize: 20,
                  color:
                    (selectedReservation.totalAmount + (parseFloat(additionalCharges) || 0) - (selectedReservation.paidAmount || 0)) > 0
                      ? '#FF5722'
                      : '#4CAF50',
                },
              ]}
            >
              $
              {Math.abs(
                selectedReservation.totalAmount +
                  (parseFloat(additionalCharges) || 0) -
                  (selectedReservation.paidAmount || 0)
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.card}>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'cash' && styles.paymentOptionTextActive,
                ]}
              >
                💵 Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'card' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'card' && styles.paymentOptionTextActive,
                ]}
              >
                💳 Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'other' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('other')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'other' && styles.paymentOptionTextActive,
                ]}
              >
                🏦 Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Room Condition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Condition</Text>
        <View style={styles.card}>
          <View style={styles.conditionOptions}>
            <TouchableOpacity
              style={[
                styles.conditionOption,
                roomCondition === 'clean' && styles.conditionOptionGood,
              ]}
              onPress={() => setRoomCondition('clean')}
            >
              <Text style={styles.conditionOptionText}>✅ Clean</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.conditionOption,
                roomCondition === 'damage' && styles.conditionOptionDamage,
              ]}
              onPress={() => setRoomCondition('damage')}
            >
              <Text style={styles.conditionOptionText}>⚠️ Damage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Check-Out Options</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setRevokeKey(!revokeKey)}
          >
            <Text style={styles.optionLabel}>Revoke Passcode/Card (TTLock)</Text>
            <View style={[styles.checkbox, revokeKey && styles.checkboxChecked]}>
              {revokeKey && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any notes about check-out..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Check-Out Button */}
      <TouchableOpacity
        style={[styles.checkOutButton, isProcessing && styles.buttonDisabled]}
        onPress={handleCheckOut}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.checkOutButtonText}>Complete Check-Out</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guestName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  paymentOptionActive: {
    borderColor: '#0066CC',
    backgroundColor: '#E3F2FD',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#666',
  },
  paymentOptionTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  conditionOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  conditionOptionGood: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  conditionOptionDamage: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  conditionOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkOutButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  checkOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContent: {
    padding: 16,
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationGuestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  reservationDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reservationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  roomType: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  goBackButton: {
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
