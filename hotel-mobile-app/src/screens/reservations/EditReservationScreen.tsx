import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useReservationStore } from '../../store/reservationStore';
import { Reservation } from '../../types/api';
import { format } from 'date-fns';

export default function EditReservationScreen({ route, navigation }: any) {
  const { reservationId } = route.params;
  const { updateReservation, getReservationById } = useReservationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestIdNumber: '',
    numberOfGuests: '1',
    roomType: '',
    checkInDate: new Date(),
    checkOutDate: new Date(),
    specialRequests: '',
    totalAmount: '',
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (!reservationId) {
      Alert.alert('Error', 'Reservation ID is missing');
      navigation.goBack();
      return;
    }
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      const data = await getReservationById(reservationId);
      setReservation(data);
      
      // Populate form
      setFormData({
        guestName: data.guestName || '',
        guestEmail: data.guestEmail || '',
        guestPhone: data.guestPhone || '',
        guestIdNumber: data.guestIdNumber || '',
        numberOfGuests: data.numberOfGuests.toString(),
        roomType: data.roomType || '',
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        specialRequests: data.specialRequests || '',
        totalAmount: data.totalAmount.toString(),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load reservation');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.guestName.trim()) newErrors.guestName = 'Guest name is required';
    if (!formData.guestEmail.trim()) newErrors.guestEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.guestEmail)) newErrors.guestEmail = 'Invalid email format';
    if (!formData.guestPhone.trim()) newErrors.guestPhone = 'Phone number is required';
    if (!formData.numberOfGuests || parseInt(formData.numberOfGuests) < 1) {
      newErrors.numberOfGuests = 'Number of guests must be at least 1';
    }
    if (formData.checkOutDate <= formData.checkInDate) {
      newErrors.checkOutDate = 'Check-out must be after check-in';
    }
    if (!formData.totalAmount.trim()) newErrors.totalAmount = 'Total amount is required';
    else if (isNaN(parseFloat(formData.totalAmount))) newErrors.totalAmount = 'Invalid amount';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        guestName: formData.guestName.trim(),
        guestEmail: formData.guestEmail.trim(),
        guestPhone: formData.guestPhone.trim(),
        guestIdNumber: formData.guestIdNumber.trim() || undefined,
        numberOfGuests: parseInt(formData.numberOfGuests),
        roomType: formData.roomType.trim() || undefined,
        checkInDate: formData.checkInDate.toISOString(),
        checkOutDate: formData.checkOutDate.toISOString(),
        specialRequests: formData.specialRequests.trim() || undefined,
        totalAmount: parseFloat(formData.totalAmount),
      };

      await updateReservation(reservationId, updates);

      Alert.alert(
        'Success',
        'Reservation updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to update reservation'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onCheckInChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, checkInDate: selectedDate });
    }
  };

  const onCheckOutChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, checkOutDate: selectedDate });
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

  return (
    <ScrollView style={styles.container}>
      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) }]}>
          <Text style={styles.statusText}>{reservation.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Information</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.guestName && styles.inputError]}
          value={formData.guestName}
          onChangeText={(text) => setFormData({ ...formData, guestName: text })}
          placeholder="John Doe"
          autoCapitalize="words"
        />
        {errors.guestName && <Text style={styles.errorText}>{errors.guestName}</Text>}

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, errors.guestEmail && styles.inputError]}
          value={formData.guestEmail}
          onChangeText={(text) => setFormData({ ...formData, guestEmail: text })}
          placeholder="john.doe@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.guestEmail && <Text style={styles.errorText}>{errors.guestEmail}</Text>}

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.guestPhone && styles.inputError]}
          value={formData.guestPhone}
          onChangeText={(text) => setFormData({ ...formData, guestPhone: text })}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />
        {errors.guestPhone && <Text style={styles.errorText}>{errors.guestPhone}</Text>}

        <Text style={styles.label}>ID Number (Passport/License)</Text>
        <TextInput
          style={styles.input}
          value={formData.guestIdNumber}
          onChangeText={(text) => setFormData({ ...formData, guestIdNumber: text })}
          placeholder="Optional"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reservation Details</Text>

        <Text style={styles.label}>Room Type</Text>
        <TextInput
          style={styles.input}
          value={formData.roomType}
          onChangeText={(text) => setFormData({ ...formData, roomType: text })}
          placeholder="e.g., Deluxe, Suite, Standard"
        />

        <Text style={styles.label}>Number of Guests *</Text>
        <TextInput
          style={[styles.input, errors.numberOfGuests && styles.inputError]}
          value={formData.numberOfGuests}
          onChangeText={(text) => setFormData({ ...formData, numberOfGuests: text })}
          placeholder="1"
          keyboardType="number-pad"
        />
        {errors.numberOfGuests && <Text style={styles.errorText}>{errors.numberOfGuests}</Text>}

        <Text style={styles.label}>Check-In Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Text style={styles.dateButtonText}>
            📅 {format(formData.checkInDate, 'MMM dd, yyyy')}
          </Text>
        </TouchableOpacity>
        {showCheckInPicker && (
          <DateTimePicker
            value={formData.checkInDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onCheckInChange}
          />
        )}

        <Text style={styles.label}>Check-Out Date *</Text>
        <TouchableOpacity
          style={[styles.dateButton, errors.checkOutDate && styles.inputError]}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <Text style={styles.dateButtonText}>
            📅 {format(formData.checkOutDate, 'MMM dd, yyyy')}
          </Text>
        </TouchableOpacity>
        {errors.checkOutDate && <Text style={styles.errorText}>{errors.checkOutDate}</Text>}
        {showCheckOutPicker && (
          <DateTimePicker
            value={formData.checkOutDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onCheckOutChange}
            minimumDate={formData.checkInDate}
          />
        )}

        <Text style={styles.label}>Total Amount ($) *</Text>
        <TextInput
          style={[styles.input, errors.totalAmount && styles.inputError]}
          value={formData.totalAmount}
          onChangeText={(text) => setFormData({ ...formData, totalAmount: text })}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {errors.totalAmount && <Text style={styles.errorText}>{errors.totalAmount}</Text>}

        <Text style={styles.label}>Special Requests</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.specialRequests}
          onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
          placeholder="Any special requests or notes..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
    default:
      return '#666';
  }
};

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
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
