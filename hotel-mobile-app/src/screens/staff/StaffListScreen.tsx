import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { staffAPI } from '../../api/staff';
import { User } from '../../types/api';

export const StaffListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  const loadStaff = useCallback(async () => {
    try {
      setErrorMessage(null);
      const params: any = {};
      
      if (roleFilter !== 'ALL') {
        params.role = roleFilter;
      }
      
      if (statusFilter === 'ACTIVE') {
        params.status = 'ACTIVE';
      } else if (statusFilter === 'INACTIVE') {
        params.status = 'INACTIVE';
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const data = await staffAPI.getStaff(params);
      setStaff(data);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setErrorMessage('You do not have permission to view staff.');
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to load staff.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  // Reload staff list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStaff();
    }, [loadStaff])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff();
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

  const renderStaffCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.staffCard}
      onPress={() => navigation.navigate('StaffDetail' as never, { staffId: item.id } as never)}
    >
      <View style={styles.staffHeader}>
        <View style={styles.staffInitials}>
          <Text style={styles.initialsText}>
            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
          </Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
          {item.phoneNumber && (
            <Text style={styles.staffPhone}>{item.phoneNumber}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.staffFooter}>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
          <Text style={styles.roleBadgeText}>{getRoleDisplayName(item.role)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'ACTIVE' ? '#d4edda' : '#f8d7da' }
        ]}>
          <Text style={[
            styles.statusBadgeText,
            { color: item.status === 'ACTIVE' ? '#155724' : '#721c24' }
          ]}>
            {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading staff...</Text>
      </View>
    );
  }

  if (errorMessage && staff.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to load staff</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setLoading(true);
          loadStaff();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Role Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Role:</Text>
        <View style={styles.filterButtons}>
          {['ALL', 'ADMIN', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterButton,
                roleFilter === role && styles.filterButtonActive,
              ]}
              onPress={() => setRoleFilter(role)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  roleFilter === role && styles.filterButtonTextActive,
                ]}
              >
                {role === 'ALL' ? 'All' : getRoleDisplayName(role)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterButtons}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.filterButtonTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Staff List */}
      <FlatList
        data={staff}
        renderItem={renderStaffCard}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No staff members found</Text>
          </View>
        }
      />

      {errorMessage ? (
        <View style={styles.inlineBanner}>
          <Text style={styles.inlineBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Add Staff Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEditStaff' as never)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
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
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  filterContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffInitials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 14,
    color: '#888',
  },
  staffFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#007bff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  inlineBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  inlineBannerText: {
    fontSize: 13,
    color: '#9a3412',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
