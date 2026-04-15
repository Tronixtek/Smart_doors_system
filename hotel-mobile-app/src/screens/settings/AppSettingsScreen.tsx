import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppModeStore } from '../../store/appModeStore';

export default function AppSettingsScreen({ navigation }: any) {
  const { mode } = useAppModeStore();
  const isOfficeMode = mode === 'office';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{isOfficeMode ? 'Office Settings' : 'Hotel Settings'}</Text>
        <Text style={styles.heroSubtitle}>
          {isOfficeMode
            ? 'Control office-only shortcuts, product switching, and shared platform settings.'
            : 'Control hotel-only shortcuts, product switching, and shared platform settings.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('AppModeSelection')}>
          <Text style={styles.itemTitle}>Application Mode</Text>
          <Text style={styles.itemSubtitle}>
            Active mode: {isOfficeMode ? 'Office' : 'Hotel'}. Switch the entire product shell from here.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isOfficeMode ? 'Office Shortcuts' : 'Hotel Shortcuts'}</Text>

        {isOfficeMode ? (
          <>
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('OfficePeople')}>
              <Text style={styles.itemTitle}>People Directory</Text>
              <Text style={styles.itemSubtitle}>Employees, visitors, contractors, and office contacts.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('OfficeSpaces')}>
              <Text style={styles.itemTitle}>Office Spaces</Text>
              <Text style={styles.itemSubtitle}>Workspaces, meeting rooms, and secure areas.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('OfficeLockList')}>
              <Text style={styles.itemTitle}>Office Lock Management</Text>
              <Text style={styles.itemSubtitle}>Only show locks linked to office spaces.</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('StaffList')}>
              <Text style={styles.itemTitle}>Staff Management</Text>
              <Text style={styles.itemSubtitle}>Manage hotel staff roles and access.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('LockList')}>
              <Text style={styles.itemTitle}>TTLock Management</Text>
              <Text style={styles.itemSubtitle}>Manage locks assigned to hotel rooms.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MaintenanceSchedule')}>
              <Text style={styles.itemTitle}>Maintenance</Text>
              <Text style={styles.itemSubtitle}>Repairs, inspections, and maintenance scheduling.</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shared Platform</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>One Platform, Two Products</Text>
          <Text style={styles.noteText}>
            Authentication and TTLock connectivity stay shared, but the product mode controls which workflows and data
            views are surfaced in the app.
          </Text>
        </View>
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
    paddingBottom: 32,
  },
  hero: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  noteCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  noteText: {
    marginTop: 6,
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 19,
  },
});
