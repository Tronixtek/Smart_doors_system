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
import { checkInAPI } from '../../api/checkin';
import { locksAPI } from '../../api/locks';
import { lockKeysAPI } from '../../api/lockKeys';
import { Reservation, Room } from '../../types/api';
import { Ttlock } from 'react-native-ttlock';
import { format } from 'date-fns';

export default function CheckInScreen({ navigation, route }: any) {
  const reservationId = route?.params?.reservationId;
  
  const { selectedReservation, selectReservation, todayCheckIns, fetchTodayCheckIns, isLoading } = useReservationStore();
  const { availableRooms, fetchAvailableRooms, fetchRooms } = useRoomStore();
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: ID Verify, 3: Room, 4: Deposit, 5: Review
  
  // Check-in data
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [generatePasscode, setGeneratePasscode] = useState(true);
  const [encodeCard, setEncodeCard] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (reservationId) {
      loadReservationData();
    } else {
      // No reservation ID provided, fetch today's check-ins
      fetchTodayCheckIns();
    }
  }, [reservationId]);

  const loadReservationData = async () => {
    await selectReservation(reservationId);
  };

  const handleSelectReservation = (reservation: Reservation) => {
    selectReservation(reservation.id);
  };

  const handleRoomSelection = (room: Room) => {
    setSelectedRoom(room);
    setCurrentStep(4); // Move to deposit step
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Guest info confirmed
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // ID verification
      if (!idVerified) {
        Alert.alert('Required', 'Please verify guest ID before continuing');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Room selection
      if (!selectedRoom) {
        Alert.alert('Required', 'Please select a room');
        return        }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Deposit
      setCurrentStep(5);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedReservation) {
      Alert.alert('Error', 'No reservation selected');
      return;
    }

    if (!selectedRoom) {
      Alert.alert('Error', 'Please select a room');
      return;
    }

    if (!idVerified) {
      Alert.alert('Error', 'Guest ID must be verified');
      return;
    }

    setIsProcessing(true);
    try {
      const checkInData = {
        reservationId: selectedReservation.id,
        roomId: selectedRoom.id,
        actualCheckInTime: new Date().toISOString(),
        guestIdVerified: idVerified,
        depositAmount: parseFloat(depositAmount) || 0,
        generateKey: generatePasscode,
        notes: notes.trim() || undefined,
      };

      const result = await checkInAPI.checkInWithKey(checkInData);
      const shouldProgramPasscode =
        generatePasscode && !!result.data?.keyCode && !!result.data?.lockKeyId;
      const shouldProgramCard = encodeCard;

      if (shouldProgramPasscode || shouldProgramCard) {
        try {
          const lock = await locksAPI.getByRoomId(selectedRoom.id);

          if (lock && lock.lockData) {
            const startDate = new Date().getTime();
            const endDate = new Date(selectedReservation.checkOutDate).getTime();
            const programmedItems: string[] = [];

            if (shouldProgramPasscode) {
              await new Promise<void>((resolve, reject) => {
                Ttlock.createCustomPasscode(
                  result.data.keyCode,
                  startDate,
                  endDate,
                  lock.lockData,
                  () => resolve(),
                  (errorCode, errorMsg) => reject(new Error(`TTLock Error ${errorCode}: ${errorMsg}`))
                );
              });

              await lockKeysAPI.activate(result.data.lockKeyId);
              programmedItems.push(`Passcode: ${result.data.keyCode}`);
            }

            if (shouldProgramCard) {
              Alert.alert(
                'Encode Card',
                'Hold the guest IC card on the lock reader now. Keep the app open until encoding finishes.'
              );

              const cardNumber = await new Promise<string>((resolve, reject) => {
                Ttlock.addCard(
                  null,
                  startDate,
                  endDate,
                  lock.lockData,
                  () => {
                    // Card encoding progress callback
                  },
                  (generatedCardNumber) => resolve(generatedCardNumber),
                  (errorCode, errorMsg) => reject(new Error(`TTLock Error ${errorCode}: ${errorMsg}`))
                );
              });

              const lockId = (lock as any).id || (lock as any)._id;
              if (!lockId) {
                throw new Error('Unable to save card key: lock id is missing');
              }

              await lockKeysAPI.create({
                lockId,
                roomId: selectedRoom.id,
                reservationId: selectedReservation.id,
                guestName: selectedReservation.guestName,
                keyType: 'CARD',
                keyIdentifier: cardNumber,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                metadata: {
                  cardNumber,
                  deliveryMethod: 'IN_PERSON',
                  deliveredAt: new Date().toISOString(),
                },
              });

              programmedItems.push(`Card: ${cardNumber}`);
            }

            Alert.alert(
              'Check-In Successful!',
              `${selectedReservation.guestName} checked into Room ${selectedRoom.roomNumber}\n\n${programmedItems.join('\n')}\n\nKeys programmed into lock\nValid until ${format(new Date(selectedReservation.checkOutDate), 'MMM dd, yyyy')}`,
              [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
            );
          } else {
            const pendingItems: string[] = [];
            if (shouldProgramPasscode && result.data?.keyCode) {
              pendingItems.push(`Passcode: ${result.data.keyCode}`);
            }
            if (shouldProgramCard) {
              pendingItems.push('Card: requested but not encoded');
            }

            Alert.alert(
              'Check-In Successful (Warning)',
              `${selectedReservation.guestName} checked into Room ${selectedRoom.roomNumber}\n\n${pendingItems.join('\n')}\n\nNo TTLock found for this room. Requested keys were not programmed into hardware.`,
              [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
            );
          }
        } catch (lockError: any) {
          console.error('Lock programming error:', lockError);

          const pendingItems: string[] = [];
          if (shouldProgramPasscode && result.data?.keyCode) {
            pendingItems.push(`Passcode: ${result.data.keyCode}`);
          }
          if (shouldProgramCard) {
            pendingItems.push('Card: encoding failed');
          }

          Alert.alert(
            'Check-In Successful (Warning)',
            `${selectedReservation.guestName} checked into Room ${selectedRoom.roomNumber}\n\n${pendingItems.join('\n')}\n\nFailed to program lock: ${lockError.message}\n\nPlease program the lock manually.`,
            [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
          );
        }
      } else {
        Alert.alert(
          'Check-In Successful!',
          `${selectedReservation.guestName} checked into Room ${selectedRoom.roomNumber}`,
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
        );
      }
      
      // Refresh room data to reflect updated status
      await fetchRooms();
      
    } catch (error: any) {
      Alert.alert(
        'Check-In Failed',
        error.response?.data?.error || 'Unable to complete check-in'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!reservationId && !selectedReservation) {
    // Show reservation selection list
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Reservation to Check In</Text>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading reservations...</Text>
          </View>
        ) : todayCheckIns.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No reservations ready for check-in</Text>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={todayCheckIns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.reservationCard}
                onPress={() => handleSelectReservation(item)}
              >
                <View style={styles.reservationHeader}>
                  <Text style={styles.reservationGuestName}>{item.guestName}</Text>
                  <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
                </View>
                <Text style={styles.reservationDetail}>
                  📧 {item.guestEmail}
                </Text>
                <Text style={styles.reservationDetail}>
                  📞 {item.guestPhone}
                </Text>
                <Text style={styles.reservationDetail}>
                  📅 {format(new Date(item.checkInDate), 'MMM dd, yyyy')} → {format(new Date(item.checkOutDate), 'MMM dd, yyyy')}
                </Text>
                <View style={styles.reservationFooter}>
                  <Text style={styles.roomType}>🏠 {item.roomType}</Text>
                  <Text style={styles.guests}>👥 {item.numberOfGuests} guests</Text>
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

  // Step indicator
  const steps = ['Guest Info', 'ID Verify', 'Room', 'Deposit', 'Review'];

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                currentStep > index + 1 && styles.progressDotCompleted,
                currentStep === index + 1 && styles.progressDotActive,
              ]}
            >
              <Text style={styles.progressDotText}>{index + 1}</Text>
            </View>
            <Text style={[styles.progressLabel, currentStep === index + 1 && styles.progressLabelActive]}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Step 1: Guest Information */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.stepTitle}>Verify Guest Information</Text>
            <View style={styles.card}>
              <Text style={styles.guestName}>{selectedReservation.guestName}</Text>
              <Text style={styles.infoText}>📧 {selectedReservation.guestEmail}</Text>
              <Text style={styles.infoText}>📱 {selectedReservation.guestPhone}</Text>
              {selectedReservation.guestIdNumber && (
                <Text style={styles.infoText}>🆔 {selectedReservation.guestIdNumber}</Text>
              )}
              {selectedReservation.confirmationNumber && (
                <Text style={styles.infoText}>
                  🔖 Confirmation: {selectedReservation.confirmationNumber}
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Check-In:</Text>
                <Text style={styles.value}>
                  {format(new Date(selectedReservation.checkInDate), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Check-Out:</Text>
                <Text style={styles.value}>
                  {format(new Date(selectedReservation.checkOutDate), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Room Type:</Text>
                <Text style={styles.value}>{selectedReservation.roomType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Guests:</Text>
                <Text style={styles.value}>{selectedReservation.numberOfGuests}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Amount:</Text>
                <Text style={[styles.value, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  ${selectedReservation.totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: ID Verification */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.stepTitle}>Verify Guest ID</Text>
            <View style={styles.card}>
              <Text style={styles.sectionText}>
                Please verify the guest's identification document matches the reservation details.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ID Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter ID number"
                  value={idNumber}
                  onChangeText={setIdNumber}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => {
                  if (!idNumber.trim()) {
                    Alert.alert('Required', 'Please enter ID number');
                    return;
                  }
                  setIdVerified(true);
                  Alert.alert('ID Verified', 'Guest identification verified successfully');
                }}
              >
                <Text style={styles.verifyButtonText}>
                  {idVerified ? '✅ ID Verified' : 'Verify ID'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Room Selection */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.stepTitle}>Select Room</Text>
            {selectedRoom ? (
              <View style={[styles.card, styles.selectedRoomCard]}>
                <Text style={styles.roomNumber}>Room {selectedRoom.roomNumber}</Text>
                <Text style={styles.roomType}>{selectedRoom.roomType}</Text>
                <Text style={styles.roomFloor}>Floor {selectedRoom.floor}</Text>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setSelectedRoom(null)}
                >
                  <Text style={styles.changeButtonText}>Change Room</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectRoomButton}
                onPress={() =>
                  navigation.navigate('RoomSelection', {
                    roomType: selectedReservation.roomType,
                    onSelectRoom: handleRoomSelection,
                  })
                }
              >
                <Text style={styles.selectRoomButtonText}>Browse Available Rooms</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 4: Deposit Collection */}
        {currentStep === 4 && (
          <View>
            <Text style={styles.stepTitle}>Collect Deposit</Text>
            <View style={styles.card}>
              <Text style={styles.sectionText}>
                Collect security deposit or advance payment from the guest.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Deposit Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.noteText}>
                Recommended deposit: $
                {(selectedReservation.totalAmount * 0.2).toFixed(2)} (20% of total)
              </Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setGeneratePasscode(!generatePasscode)}
              >
                <Text style={styles.optionLabel}>Generate Passcode (TTLock)</Text>
                <View style={[styles.checkbox, generatePasscode && styles.checkboxChecked]}>
                  {generatePasscode && <Text style={styles.checkmark}>X</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setEncodeCard(!encodeCard)}
              >
                <Text style={styles.optionLabel}>Encode IC Card (TTLock)</Text>
                <View style={[styles.checkbox, encodeCard && styles.checkboxChecked]}>
                  {encodeCard && <Text style={styles.checkmark}>X</Text>}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 5: Review & Confirm */}
        {currentStep === 5 && (
          <View>
            <Text style={styles.stepTitle}>Review & Confirm</Text>
            
            <View style={styles.card}>
              <Text style={styles.reviewSectionTitle}>Guest</Text>
              <Text style={styles.reviewText}>{selectedReservation.guestName}</Text>
              <Text style={styles.reviewText}>{selectedReservation.guestEmail}</Text>
              <Text style={styles.reviewText}>{selectedReservation.guestPhone}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.reviewSectionTitle}>Room Assignment</Text>
              <Text style={styles.reviewText}>
                Room {selectedRoom?.roomNumber} • Floor {selectedRoom?.floor}
              </Text>
              <Text style={styles.reviewText}>{selectedRoom?.roomType}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.reviewSectionTitle}>Payment</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Total Amount:</Text>
                <Text style={styles.value}>${selectedReservation.totalAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Deposit Collected:</Text>
                <Text style={[styles.value, { color: '#4CAF50' }]}>
                  ${parseFloat(depositAmount) || 0}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { fontWeight: 'bold' }]}>Balance Due:</Text>
                <Text style={[styles.value, { fontWeight: 'bold', color: '#FF9800' }]}>
                  ${(selectedReservation.totalAmount - (parseFloat(depositAmount) || 0)).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.reviewSectionTitle}>Options</Text>
              <Text style={styles.reviewText}>
                {generatePasscode ? 'Passcode will be generated' : 'No passcode'}
              </Text>
              <Text style={styles.reviewText}>
                {encodeCard ? 'IC card will be encoded' : 'No IC card'}
              </Text>
              <Text style={styles.reviewText}>
                {idVerified ? 'ID verified' : 'ID not verified'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>Check-in Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about check-in..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={handlePreviousStep}
            disabled={isProcessing}
          >
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < 5 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton, currentStep === 1 && styles.fullWidth]}
            onPress={handleNextStep}
          >
            <Text style={[styles.navButtonText, { color: '#fff' }]}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.completeButton]}
            onPress={handleCheckIn}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.navButtonText, { color: '#fff' }]}>
                Complete Check-In ✓
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: '#2196F3',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressDotText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  sectionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
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
    height: 100,
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedRoomCard: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  roomType: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  roomFloor: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  changeButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  selectRoomButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectRoomButtonText: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  fullWidth: {
    marginLeft: 0,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  guests: {
    fontSize: 14,
    color: '#666',
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
