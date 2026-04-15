import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { staffAPI } from '../../api/staff';
import { User } from '../../types/api';

export const StaffDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { staffId } = route.params as { staffId: string };

  const [staff, setStaff] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStaff = async () => {
    try {
      const data = await staffAPI.getStaffById(staffId);
      setStaff(data);
    } catch (error: any) {
      console.error('Failed to load staff details:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
      } else if (error.response?.status === 404) {
        Alert.alert('Not Found', 'Staff member not found');
        navigation.goBack();
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to load staff details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [staffId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const handleToggleStatus = () => {
    if (!staff) return;

    const isActive = staff.status === 'ACTIVE';
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    const action = isActive ? 'deactivate' : 'activate';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Staff Member`,
      `Are you sure you want to ${action} ${staff.firstName} ${staff.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const updated = await staffAPI.updateStatus(staffId, newStatus);
              setStaff(updated);
              Alert.alert('Success', `Staff member ${action}d successfully`);
            } catch (error: any) {
              console.error('Failed to update status:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!staff) return;

    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staff.firstName} ${staff.lastName}? This will deactivate their account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffAPI.deleteStaff(staffId);
              Alert.alert('Success', 'Staff member deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              console.error('Failed to delete staff:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete staff');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    if (!staff) return;

    Alert.prompt(
      'Change Password',
      `Enter new password for ${staff.firstName} ${staff.lastName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async (newPassword?: string) => {
            if (!newPassword || newPassword.length < 6) {
              Alert.alert('Error', 'Password must be at least 6 characters');
              return;
            }

            try {
              await staffAPI.changePassword(staffId, newPassword);
              Alert.alert('Success', 'Password changed successfully');
            } catch (error: any) {
              console.error('Failed to change password:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#dc3545';
      case 'MANAGER':
        return '#6f42c1';
      case 'FRONT_DESK':
        return '#007bff';
      case 'HOUSEKEEPING':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Staff member not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Staff Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInitials}>
          <Text style={styles.profileInitialsText}>
            {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
          </Text>
        </View>
        <Text style={styles.profileName}>
          {staff.firstName} {staff.lastName}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(staff.role) }]}>
          <Text style={styles.roleBadgeText}>{getRoleDisplayName(staff.role)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: staff.status === 'ACTIVE' ? '#d4edda' : '#f8d7da' }
        ]}>
          <Text style={[
            styles.statusBadgeText,
            { color: staff.status === 'ACTIVE' ? '#155724' : '#721c24' }
          ]}>
            {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{staff.email}</Text>
        </View>
        {staff.phoneNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{staff.phoneNumber}</Text>
          </View>
        )}
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{getRoleDisplayName(staff.role)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={styles.infoValue}>{staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateEditStaff' as never, { staffId: staff.id } as never)}
        >
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.warningButton]}
          onPress={handleToggleStatus}
        >
          <Text style={[styles.actionButtonText, styles.warningButtonText]}>
            {staff.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            Delete Staff Member
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileInitials: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInitialsText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  warningButtonText: {
    color: '#000',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#fff',
  },
  bottomSpace: {
    height: 30,
  },
});
