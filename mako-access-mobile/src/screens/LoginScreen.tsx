import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Theme } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setAuth(response.data.token, response.data.user);
      // Leave the spinner up: setAuth swaps the navigator over to the
      // dashboard, so this screen unmounts rather than returning to idle.
    } catch (error: any) {
      // Never surface the server address or transport details to the user.
      const message = error.response
        ? error.response.data?.message || 'Something went wrong. Please try again.'
        : 'Connection failed. Check your internet connection and try again.';

      Alert.alert('Login Failed', message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={60} color={Theme.colors.primary} />
          </View>
          <Text style={styles.title}>Mako Access</Text>
          <Text style={styles.subtitle}>Secure access management made simple</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={Theme.colors.textLight}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              cursorColor="#000000"
              selectionColor={Theme.colors.primary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={Theme.colors.textLight}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              cursorColor="#000000"
              selectionColor={Theme.colors.primary}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Theme.colors.textLight}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: Theme.spacing.xl },
  header: { alignItems: 'center', marginTop: 80, marginBottom: 40 },
  logoContainer: { 
    width: 100, 
    height: 100, 
    backgroundColor: Theme.colors.white, 
    borderRadius: Theme.borderRadius.xl, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: Theme.spacing.md,
  },
  title: { fontSize: 32, fontWeight: '800', color: Theme.colors.text, marginBottom: Theme.spacing.xs },
  subtitle: { fontSize: 16, color: Theme.colors.textLight, textAlign: 'center' },
  form: { marginTop: Theme.spacing.xl },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  inputIcon: { marginRight: Theme.spacing.sm },
  input: { flex: 1, height: 55, color: '#000000', fontSize: 16 },
  eyeButton: { paddingLeft: Theme.spacing.sm, paddingVertical: Theme.spacing.sm },
  loginButton: {
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
  },
  buttonDisabled: { backgroundColor: Theme.colors.textLight },
  loginButtonText: { color: Theme.colors.white, fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Theme.spacing.xl, paddingBottom: Theme.spacing.lg },
  footerText: { color: Theme.colors.textLight, fontSize: 16 },
  linkText: { color: Theme.colors.primary, fontSize: 16, fontWeight: '700' },
});
