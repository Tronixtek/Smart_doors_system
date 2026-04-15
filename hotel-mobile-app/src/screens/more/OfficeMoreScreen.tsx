import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function OfficeMoreScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {user ? (
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <Text style={styles.title}>Office More</Text>
      <Text style={styles.subtitle}>Office tools, product switching, and office-only configuration</Text>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AppModeSelection')}>
          <Text style={styles.menuIcon}>🔄</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Switch Application Mode</Text>
            <Text style={styles.menuSubtext}>Move between the hotel and office products</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OfficePeople')}>
          <Text style={styles.menuIcon}>👥</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>People Directory</Text>
            <Text style={styles.menuSubtext}>Employees, visitors, contractors, and office contacts</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OfficeSpaces')}>
          <Text style={styles.menuIcon}>🏢</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Office Spaces</Text>
            <Text style={styles.menuSubtext}>Workspaces, meeting rooms, and secure areas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OfficeLockList')}>
          <Text style={styles.menuIcon}>🔐</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>TTLock Management</Text>
            <Text style={styles.menuSubtext}>Show only locks linked to office spaces</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AppSettings')}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuSubtext}>Office-wide preferences and configuration</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 16,
    width: 28,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
  menuSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#ffffff',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
