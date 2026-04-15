import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import officePeopleAPI from '../../api/officePeople';
import { OfficePerson } from '../../types/api';

const PERSON_TYPE_OPTIONS: Array<{ label: string; value: OfficePerson['personType'] }> = [
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Visitor', value: 'VISITOR' },
  { label: 'Contractor', value: 'CONTRACTOR' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'Facility Admin', value: 'FACILITY_ADMIN' },
];

const STATUS_OPTIONS: Array<{ label: string; value: OfficePerson['status'] }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export default function CreateOfficePersonScreen({ navigation }: any) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    personType: 'VISITOR' as OfficePerson['personType'],
    status: 'ACTIVE' as OfficePerson['status'],
    employeeId: '',
    company: '',
    department: '',
    title: '',
    identityDocument: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Incomplete Form', 'Please fix the highlighted fields and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await officePeopleAPI.create({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        personType: formData.personType,
        status: formData.status,
        employeeId: formData.employeeId.trim() || undefined,
        company: formData.company.trim() || undefined,
        department: formData.department.trim() || undefined,
        title: formData.title.trim() || undefined,
        identityDocument: formData.identityDocument.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      Alert.alert('Person Created', 'The office person has been added successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to create office person:', error);
      Alert.alert('Create Failed', error.response?.data?.error || 'Unable to create office person');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity</Text>

        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          value={formData.firstName}
          onChangeText={(text) => updateField('firstName', text)}
          placeholder="Ada"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
        />
        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          value={formData.lastName}
          onChangeText={(text) => updateField('lastName', text)}
          placeholder="Okafor"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
        />
        {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

        <Text style={styles.label}>Person Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.personType}
            onValueChange={(value: OfficePerson['personType']) => updateField('personType', value)}
          >
            {PERSON_TYPE_OPTIONS.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.status}
            onValueChange={(value: OfficePerson['status']) => updateField('status', value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          placeholder="ada@example.com"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber}
          onChangeText={(text) => updateField('phoneNumber', text)}
          placeholder="+234 800 000 0000"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organization</Text>

        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          style={styles.input}
          value={formData.employeeId}
          onChangeText={(text) => updateField('employeeId', text)}
          placeholder="Optional"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Company</Text>
        <TextInput
          style={styles.input}
          value={formData.company}
          onChangeText={(text) => updateField('company', text)}
          placeholder="Optional"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={formData.department}
          onChangeText={(text) => updateField('department', text)}
          placeholder="Optional"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          placeholder="Optional"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Identity Document</Text>
        <TextInput
          style={styles.input}
          value={formData.identityDocument}
          onChangeText={(text) => updateField('identityDocument', text)}
          placeholder="Passport, national ID, or badge number"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Anything important for office access or reception"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Create Person</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#dc2626',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
