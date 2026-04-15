import React, { useState } from 'react';
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
import { format } from 'date-fns';

export default function CreateReservationScreen({ navigation }: any) {
  const { createReservation } = useReservationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestIdNumber: '',
    numberOfGuests: '1',
    roomType: '',
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    specialRequests: '',
    totalAmount: '',
  });

  const [errors, setErrors] = useState<any>({});

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

    setIsLoading(true);
    try {
      const reservationData = {
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
        paidAmount: 0,
        status: 'CONFIRMED' as const,
      };

      await createReservation(reservationData);

      Alert.alert(
        'Success',
        'Reservation created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create reservation'
      );
    } finally {
      setIsLoading(false);
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

  return (
    <ScrollView style={styles.container}>
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
            minimumDate={new Date()}
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
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Reservation</Text>
          )}
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
