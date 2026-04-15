import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppMode, useAppModeStore } from '../../store/appModeStore';

const MODE_OPTIONS: Array<{
  mode: AppMode;
  title: string;
  subtitle: string;
  summary: string;
  accent: string;
}> = [
  {
    mode: 'hotel',
    title: 'Hotel Mode',
    subtitle: 'Front desk, reservations, rooms, check-in, housekeeping',
    summary: 'Use the property-management workflow for hotel operations.',
    accent: '#2563eb',
  },
  {
    mode: 'office',
    title: 'Office Mode',
    subtitle: 'Spaces, people, visits, office access, visitor operations',
    summary: 'Use the smart office workflow for staff and visitor access control.',
    accent: '#0f766e',
  },
];

export default function AppModeSelectionScreen({ navigation }: any) {
  const { mode, setMode } = useAppModeStore();

  const handleSelectMode = async (nextMode: AppMode) => {
    if (nextMode === mode) {
      navigation.goBack();
      return;
    }

    try {
      await setMode(nextMode);
      Alert.alert(
        'Mode Switched',
        nextMode === 'hotel'
          ? 'The app is now in Hotel Mode.'
          : 'The app is now in Office Mode.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to switch app mode:', error);
      Alert.alert('Switch Failed', 'Unable to change the application mode right now.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Application Mode</Text>
      <Text style={styles.subtitle}>
        Switch the whole app experience between hotel operations and office access control.
      </Text>

      {MODE_OPTIONS.map((option) => {
        const active = option.mode === mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={[
              styles.card,
              active && { borderColor: option.accent, backgroundColor: `${option.accent}14` },
            ]}
            onPress={() => handleSelectMode(option.mode)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <View style={[styles.badge, active ? { backgroundColor: option.accent } : styles.badgeMuted]}>
                <Text style={[styles.badgeText, !active && styles.badgeTextMuted]}>
                  {active ? 'Active' : 'Tap to switch'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            <Text style={styles.cardSummary}>{option.summary}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#475569',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeMuted: {
    backgroundColor: '#e2e8f0',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextMuted: {
    color: '#334155',
  },
  cardSubtitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  cardSummary: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
