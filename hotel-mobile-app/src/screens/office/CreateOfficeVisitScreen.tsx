import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import officeVisitsAPI from '../../api/officeVisits';
import officePeopleAPI from '../../api/officePeople';
import officeSpacesAPI from '../../api/officeSpaces';
import { OfficePerson, OfficeSpace, OfficeVisit } from '../../types/api';
import { useAuthStore } from '../../store/authStore';

const PURPOSE_OPTIONS: Array<{ label: string; value: OfficeVisit['purpose'] }> = [
  { label: 'Meeting', value: 'MEETING' },
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Contractor Work', value: 'CONTRACTOR_WORK' },
  { label: 'Office Access', value: 'OFFICE_ACCESS' },
  { label: 'Event', value: 'EVENT' },
  { label: 'Other', value: 'OTHER' },
];

const CREDENTIAL_OPTIONS: Array<{ label: string; value: NonNullable<OfficeVisit['credentialType']> }> = [
  { label: 'Passcode', value: 'PASSCODE' },
  { label: 'Card', value: 'CARD' },
  { label: 'Fingerprint', value: 'FINGERPRINT' },
  { label: 'E-Key', value: 'EKEY' },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const combineDateAndTime = (date: Date, time: string) => {
  const match = TIME_PATTERN.exec(time.trim());
  if (!match) {
    return null;
  }

  const nextDate = new Date(date);
  nextDate.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  return nextDate;
};

export default function CreateOfficeVisitScreen({ navigation }: any) {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [people, setPeople] = useState<OfficePerson[]>([]);
  const [spaces, setSpaces] = useState<OfficeSpace[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tomorrow = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return next;
  }, []);

  const [formData, setFormData] = useState({
    personId: '',
    spaceId: '',
    title: '',
    purpose: 'MEETING' as OfficeVisit['purpose'],
    startDate: new Date(),
    startTime: '09:00',
    endDate: tomorrow,
    endTime: '17:00',
    visitorCount: '1',
    credentialRequested: true,
    credentialType: 'CARD' as NonNullable<OfficeVisit['credentialType']>,
    notes: '',
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [peopleData, spaceData] = await Promise.all([
          officePeopleAPI.getAll(),
          officeSpacesAPI.getActive(),
        ]);

        setPeople(peopleData.filter((person) => person.status === 'ACTIVE'));
        setSpaces(spaceData);
      } catch (error) {
        console.error('Failed to load office visit form data:', error);
        Alert.alert('Load Failed', 'Unable to load people and spaces for office visits.');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const updateField = (field: string, value: any) => {
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

    if (!formData.personId) nextErrors.personId = 'Select a person';
    if (!formData.spaceId) nextErrors.spaceId = 'Select a space';
    if (!formData.title.trim()) nextErrors.title = 'Visit title is required';
    if (!TIME_PATTERN.test(formData.startTime.trim())) nextErrors.startTime = 'Use HH:MM format';
    if (!TIME_PATTERN.test(formData.endTime.trim())) nextErrors.endTime = 'Use HH:MM format';

    const visitorCount = parseInt(formData.visitorCount, 10);
    if (Number.isNaN(visitorCount) || visitorCount < 1) {
      nextErrors.visitorCount = 'Visitor count must be at least 1';
    }

    const startAt = combineDateAndTime(formData.startDate, formData.startTime);
    const endAt = combineDateAndTime(formData.endDate, formData.endTime);

    if (!startAt) nextErrors.startTime = 'Start time is invalid';
    if (!endAt) nextErrors.endTime = 'End time is invalid';
    if (startAt && endAt && endAt <= startAt) {
      nextErrors.endTime = 'End time must be after the start';
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      startAt,
      endAt,
      visitorCount,
    };
  };

  const handleSubmit = async () => {
    const { isValid, startAt, endAt, visitorCount } = validate();
    if (!isValid || !startAt || !endAt) {
      Alert.alert('Incomplete Form', 'Please fix the highlighted fields and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await officeVisitsAPI.create({
        personId: formData.personId,
        spaceId: formData.spaceId,
        hostUserId: user?.id,
        title: formData.title.trim(),
        purpose: formData.purpose,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        visitorCount,
        credentialRequested: formData.credentialRequested,
        credentialType: formData.credentialRequested ? formData.credentialType : undefined,
        notes: formData.notes.trim() || undefined,
      });

      Alert.alert('Visit Created', 'The office visit has been scheduled successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to create office visit:', error);
      Alert.alert('Create Failed', error.response?.data?.error || 'Unable to create office visit');
    } finally {
      setSubmitting(false);
    }
  };

  const onStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateField('startDate', selectedDate);
      if (selectedDate > formData.endDate) {
        updateField('endDate', selectedDate);
      }
    }
  };

  const onEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateField('endDate', selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading office visit form...</Text>
      </View>
    );
  }

  const formDisabled = people.length === 0 || spaces.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Basics</Text>

        <Text style={styles.label}>Person *</Text>
        <View style={[styles.pickerContainer, errors.personId && styles.inputError]}>
          <Picker
            selectedValue={formData.personId}
            onValueChange={(value: string) => updateField('personId', value)}
            enabled={!formDisabled}
          >
            <Picker.Item label="Select a person" value="" />
            {people.map((person) => (
              <Picker.Item
                key={person.id}
                label={`${person.firstName} ${person.lastName} - ${person.personType}`}
                value={person.id}
              />
            ))}
          </Picker>
        </View>
        {errors.personId ? <Text style={styles.errorText}>{errors.personId}</Text> : null}

        <Text style={styles.label}>Space *</Text>
        <View style={[styles.pickerContainer, errors.spaceId && styles.inputError]}>
          <Picker
            selectedValue={formData.spaceId}
            onValueChange={(value: string) => updateField('spaceId', value)}
            enabled={!formDisabled}
          >
            <Picker.Item label="Select a space" value="" />
            {spaces.map((space) => (
              <Picker.Item
                key={space.id}
                label={`${space.name} (${space.code})`}
                value={space.id}
              />
            ))}
          </Picker>
        </View>
        {errors.spaceId ? <Text style={styles.errorText}>{errors.spaceId}</Text> : null}

        <Text style={styles.label}>Visit Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          placeholder="Board meeting with finance"
          placeholderTextColor="#94a3b8"
          editable={!formDisabled}
        />
        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

        <Text style={styles.label}>Purpose</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.purpose}
            onValueChange={(value: OfficeVisit['purpose']) => updateField('purpose', value)}
            enabled={!formDisabled}
          >
            {PURPOSE_OPTIONS.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Window</Text>

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
          disabled={formDisabled}
        >
          <Text style={styles.dateButtonText}>{format(formData.startDate, 'MMM dd, yyyy')}</Text>
        </TouchableOpacity>
        {showStartDatePicker ? (
          <DateTimePicker
            value={formData.startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
            minimumDate={new Date()}
          />
        ) : null}

        <Text style={styles.label}>Start Time *</Text>
        <TextInput
          style={[styles.input, errors.startTime && styles.inputError]}
          value={formData.startTime}
          onChangeText={(text) => updateField('startTime', text)}
          placeholder="09:00"
          placeholderTextColor="#94a3b8"
          keyboardType="numbers-and-punctuation"
          editable={!formDisabled}
        />
        {errors.startTime ? <Text style={styles.errorText}>{errors.startTime}</Text> : null}

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
          disabled={formDisabled}
        >
          <Text style={styles.dateButtonText}>{format(formData.endDate, 'MMM dd, yyyy')}</Text>
        </TouchableOpacity>
        {showEndDatePicker ? (
          <DateTimePicker
            value={formData.endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndDateChange}
            minimumDate={formData.startDate}
          />
        ) : null}

        <Text style={styles.label}>End Time *</Text>
        <TextInput
          style={[styles.input, errors.endTime && styles.inputError]}
          value={formData.endTime}
          onChangeText={(text) => updateField('endTime', text)}
          placeholder="17:00"
          placeholderTextColor="#94a3b8"
          keyboardType="numbers-and-punctuation"
          editable={!formDisabled}
        />
        {errors.endTime ? <Text style={styles.errorText}>{errors.endTime}</Text> : null}

        <Text style={styles.label}>Visitor Count *</Text>
        <TextInput
          style={[styles.input, errors.visitorCount && styles.inputError]}
          value={formData.visitorCount}
          onChangeText={(text) => updateField('visitorCount', text)}
          placeholder="1"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          editable={!formDisabled}
        />
        {errors.visitorCount ? <Text style={styles.errorText}>{errors.visitorCount}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credential Settings</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Request access credential</Text>
            <Text style={styles.switchSubtitle}>Issue a temporary TTLock credential for this visit.</Text>
          </View>
          <Switch
            value={formData.credentialRequested}
            onValueChange={(value) => updateField('credentialRequested', value)}
            disabled={formDisabled}
            trackColor={{ false: '#cbd5e1', true: '#c4b5fd' }}
            thumbColor={formData.credentialRequested ? '#7c3aed' : '#f8fafc'}
          />
        </View>

        {formData.credentialRequested ? (
          <>
            <Text style={styles.label}>Credential Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.credentialType}
                onValueChange={(value: NonNullable<OfficeVisit['credentialType']>) =>
                  updateField('credentialType', value)
                }
                enabled={!formDisabled}
              >
                {CREDENTIAL_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </>
        ) : null}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Host details, visitor instructions, or security notes"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!formDisabled}
        />

        {formDisabled ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Setup needed first</Text>
            <Text style={styles.noticeText}>
              Add at least one active person and one active space before creating office visits.
            </Text>
          </View>
        ) : null}
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
          style={[styles.primaryButton, (submitting || formDisabled) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || formDisabled}
        >
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Create Visit</Text>}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#475569',
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
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#dc2626',
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dateButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  switchSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  noticeCard: {
    marginTop: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
  },
  noticeText: {
    marginTop: 4,
    fontSize: 13,
    color: '#9a3412',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#7c3aed',
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
