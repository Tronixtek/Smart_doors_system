import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../api/client';
import { Theme } from '../theme';

export default function CreateAccessPointScreen({ navigation, route }: any) {
  const accessPoint = route?.params?.accessPoint;
  const isEditing = !!accessPoint;

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState(accessPoint?.organizationId?._id || accessPoint?.organizationId || '');
  const [name, setName] = useState(accessPoint?.name || '');
  const [description, setDescription] = useState(accessPoint?.description || '');
  const [type, setType] = useState<'DOOR' | 'GATE' | 'CABINET' | 'LIFT'>(accessPoint?.type || 'DOOR');
  const [loading, setLoading] = useState(false);

  const descriptionRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isEditing) fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await apiClient.get('/organizations');
      setOrganizations(response.data);
      if (response.data.length > 0 && !organizationId) {
        setOrganizationId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load organizations', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give this access point a name.');
      return;
    }

    if (!organizationId) {
      Alert.alert('Missing Organization', 'Create an organization first.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await apiClient.put(`/access-points/${accessPoint._id}`, {
          name,
          description,
          type,
        });
        Alert.alert('Updated', 'Access point updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await apiClient.post('/access-points', {
          organizationId,
          name,
          description,
          type,
        });
        Alert.alert('Success', 'Access Point created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save access point');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Access Point',
      'This will permanently remove this access point. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.delete(`/access-points/${accessPoint._id}`);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete access point');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Access Point' : 'Add Access Point'}</Text>
          <Text style={styles.subtitle}>
            {isEditing 
              ? 'Update the details for this access point location.' 
              : 'Create a door, gate, cabinet, or lift location under your organization.'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isEditing && (
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Organization</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={organizationId}
                  onValueChange={(itemValue) => setOrganizationId(itemValue)}
                  style={styles.picker}
                  dropdownIconColor={Theme.colors.text}
                >
                  {organizations.map((organization) => (
                    <Picker.Item key={organization._id} label={organization.name} value={organization._id} color={Theme.colors.text} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Front Door, Server Room"
                placeholderTextColor={Theme.colors.textLight}
                returnKeyType="next"
                onSubmitEditing={() => descriptionRef.current?.focus()}
                blurOnSubmit={false}
                cursorColor="#000000"
                selectionColor={Theme.colors.primary}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={type}
                onValueChange={(itemValue) => setType(itemValue)}
                style={styles.picker}
                dropdownIconColor={Theme.colors.text}
              >
                <Picker.Item label="Door" value="DOOR" color={Theme.colors.text} />
                <Picker.Item label="Gate" value="GATE" color={Theme.colors.text} />
                <Picker.Item label="Cabinet" value="CABINET" color={Theme.colors.text} />
                <Picker.Item label="Lift" value="LIFT" color={Theme.colors.text} />
              </Picker>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start' }]}>
              <TextInput
                ref={descriptionRef}
                style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe where this is located..."
                placeholderTextColor={Theme.colors.textLight}
                multiline
                cursorColor="#000000"
                selectionColor={Theme.colors.primary}
              />
            </View>
          </View>

        <TouchableOpacity 
          style={[styles.createButton, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.createButtonText}>{isEditing ? 'Save Changes' : 'Create Access Point'}</Text>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete Access Point</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  header: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: Theme.colors.text },
  subtitle: { fontSize: 16, color: Theme.colors.textLight, marginTop: 4 },
  form: { marginTop: Theme.spacing.md },
  inputWrapper: { marginBottom: Theme.spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: Theme.spacing.sm, marginLeft: Theme.spacing.xs },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  input: { height: 55, color: '#000000', fontSize: 16 },
  pickerContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  picker: { height: 55 },
  createButton: {
    backgroundColor: Theme.colors.primary,
    height: 55,
    borderRadius: Theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    elevation: 2,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 60,
  },
  buttonDisabled: { backgroundColor: Theme.colors.textLight },
  createButtonText: { color: Theme.colors.white, fontSize: 18, fontWeight: '700' },
  deleteButton: {
    height: 55,
    borderRadius: Theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error,
    marginBottom: 100,
  },
  deleteButtonText: { color: Theme.colors.error, fontSize: 16, fontWeight: '700' },
});
