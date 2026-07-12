import React, { useState, useRef } from 'react';
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
import { useAuthStore } from '../store/authStore';
import { Theme } from '../theme';

export default function SetupOrganizationScreen({ navigation, route }: any) {
  const organization = route?.params?.organization;
  const isEditing = !!organization;

  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  const [type, setType] = useState(organization?.type || 'OTHER');
  const [loading, setLoading] = useState(false);
  const { user, setAuth, token } = useAuthStore();

  const slugRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!name.trim() || (!isEditing && !slug.trim())) {
      Alert.alert('Missing Info', 'Please enter a name for your space.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await apiClient.put(`/organizations/${organization._id}`, {
          name,
          type,
        });
        Alert.alert('Updated', 'Organization settings saved.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const response = await apiClient.post('/organizations', {
          name,
          slug: slug.toLowerCase().replace(/\s+/g, '-'),
          type,
        });
        
        const updatedUser = { ...user, organizationId: response.data._id };
        setAuth(token!, updatedUser);
        
        Alert.alert('Welcome!', `${name} is ready.`, [
          { text: 'Start Managing', onPress: () => navigation.navigate('Dashboard') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Save Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Organization',
      'This will permanently remove this organization and all its data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.delete(`/organizations/${organization._id}`);
              navigation.navigate('Dashboard');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete organization');
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
          <View style={styles.iconCircle}>
            <Ionicons name={isEditing ? "settings" : "home"} size={40} color={Theme.colors.primary} />
          </View>
          <Text style={styles.title}>{isEditing ? 'Edit Organization' : 'Create Your Organization'}</Text>
          <Text style={styles.subtitle}>
            {isEditing 
              ? 'Update your top-level workspace details.' 
              : 'Set up the top-level workspace that will contain your access points and locks.'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Organization name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (!isEditing) setSlug(text.toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="e.g. Mako HQ, My Smart Home"
                placeholderTextColor={Theme.colors.textLight}
                returnKeyType={isEditing ? "done" : "next"}
                onSubmitEditing={() => !isEditing && slugRef.current?.focus()}
                blurOnSubmit={isEditing}
                cursorColor="#000000"
                selectionColor={Theme.colors.primary}
              />
            </View>
          </View>

          {!isEditing && (
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Organization Slug (unique ID)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  ref={slugRef}
                  style={styles.input}
                  value={slug}
                  onChangeText={(text) => setSlug(text.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="mako-hq"
                  placeholderTextColor={Theme.colors.textLight}
                  autoCapitalize="none"
                  returnKeyType="done"
                  cursorColor="#000000"
                  selectionColor={Theme.colors.primary}
                />
              </View>
              <Text style={styles.helperText}>This will be used for your unique organization URL.</Text>
            </View>
          )}

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Organization type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(itemValue) => setType(itemValue)}
              style={styles.picker}
              dropdownIconColor={Theme.colors.text}
            >
              <Picker.Item label="Residential / Home" value="RESIDENTIAL" color={Theme.colors.text} />
              <Picker.Item label="Office / Business" value="OFFICE" color={Theme.colors.text} />
              <Picker.Item label="Hotel / Rental" value="HOTEL" color={Theme.colors.text} />
              <Picker.Item label="Other" value="OTHER" color={Theme.colors.text} />
            </Picker>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.setupButton, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.setupButtonText}>{isEditing ? 'Save Changes' : 'Complete Setup'}</Text>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete Organization</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  header: { alignItems: 'center', marginTop: 80, marginBottom: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: Theme.colors.text, marginBottom: Theme.spacing.xs },
  subtitle: { fontSize: 16, color: Theme.colors.textLight, textAlign: 'center', paddingHorizontal: 20 },
  form: { marginTop: Theme.spacing.md },
  inputWrapper: { marginBottom: Theme.spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: Theme.spacing.sm, marginLeft: Theme.spacing.xs },
  helperText: { fontSize: 12, color: Theme.colors.textLight, marginTop: Theme.spacing.xs, marginLeft: Theme.spacing.xs },
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
  setupButton: {
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
  setupButtonText: { color: Theme.colors.white, fontSize: 18, fontWeight: '700' },
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
