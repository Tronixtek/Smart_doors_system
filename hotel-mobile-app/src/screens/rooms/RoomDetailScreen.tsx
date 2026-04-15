import React, { useEffect, useState } from 'react';
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
import { useRoomStore } from '../../store/roomStore';
import { roomsAPI } from '../../api/rooms';
import { housekeepingAPI } from '../../api/housekeeping';
import { maintenanceAPI } from '../../api/maintenance';
import { Room } from '../../types/api';

export default function RoomDetailScreen({ navigation, route }: any) {
  const { roomId } = route.params || {};
  const { fetchRooms } = useRoomStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isSchedulingMaintenance, setIsSchedulingMaintenance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  const loadRoom = async () => {
    try {
      setIsLoading(true);
      const data = await roomsAPI.getById(roomId);
      setRoom(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load room details');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoom();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return '#4CAF50';
      case 'OCCUPIED':
        return '#2196F3';
      case 'CLEANING':
        return '#FF9800';
      case 'MAINTENANCE':
        return '#F44336';
      case 'OUT_OF_SERVICE':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return '✅';
      case 'OCCUPIED':
        return '🔒';
      case 'CLEANING':
        return '🧹';
      case 'MAINTENANCE':
        return '🔧';
      case 'OUT_OF_SERVICE':
        return '🚫';
      default:
        return '❓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'Available';
      case 'OCCUPIED':
        return 'Occupied';
      case 'CLEANING':
        return 'Cleaning';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      default:
        return status;
    }
  };

  const handleStatusChange = (newStatus: Room['status']) => {
    if (!room) return;

    const statusLabel = getStatusLabel(newStatus);
    const currentLabel = getStatusLabel(room.status);

    Alert.alert(
      'Change Room Status',
      `Change status from ${currentLabel} to ${statusLabel}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => updateStatus(newStatus),
        },
      ]
    );
  };

  const updateStatus = async (newStatus: Room['status']) => {
    if (!room) return;

    try {
      setIsUpdating(true);
      const updatedRoom = await roomsAPI.updateStatus(roomId, newStatus);
      setRoom(updatedRoom);
      await fetchRooms(); // Refresh the room list cache
      Alert.alert('Success', 'Room status updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update room status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignCleaning = () => {
    if (!room) return;

    console.log('🧹 Opening cleaning task menu for room:', room.roomNumber);

    Alert.alert(
      'Assign Cleaning Task',
      `Create a cleaning task for Room ${room.roomNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Cleaning task creation cancelled'),
        },
        {
          text: 'Checkout Clean',
          onPress: () => {
            console.log('🧹 User selected: Checkout Clean');
            createCleaningTask('CHECKOUT_CLEAN', 'HIGH');
          },
        },
        {
          text: 'Daily Clean',
          onPress: () => {
            console.log('🧹 User selected: Daily Clean');
            createCleaningTask('DAILY_CLEAN', 'NORMAL');
          },
        },
        {
          text: 'Deep Clean',
          onPress: () => {
            console.log('🧹 User selected: Deep Clean');
            createCleaningTask('DEEP_CLEAN', 'NORMAL');
          },
        },
      ]
    );
  };

  const createCleaningTask = async (
    taskType: 'CHECKOUT_CLEAN' | 'DAILY_CLEAN' | 'DEEP_CLEAN',
    priority: 'LOW' | 'NORMAL' | 'HIGH'
  ) => {
    if (!room) {
      console.error('❌ Cannot create task: room is null');
      return;
    }

    console.log('🧹 Creating cleaning task:', {
      roomId: room.id,
      roomNumber: room.roomNumber,
      taskType,
      priority,
    });

    try {
      setIsCreatingTask(true);
      
      console.log('🧹 Calling housekeepingAPI.createTask...');
      const task = await housekeepingAPI.createTask({
        roomId: room.id,
        taskType,
        priority,
        notes: `${taskType.replace(/_/g, ' ')} for Room ${room.roomNumber}`,
        estimatedDuration: taskType === 'DEEP_CLEAN' ? 60 : 30,
      });
      console.log('✅ Task created successfully:', task);

      // Update room status to CLEANING if not already
      if (room.status !== 'CLEANING') {
        console.log('🧹 Updating room status to CLEANING...');
        await roomsAPI.updateStatus(roomId, 'CLEANING');
        const updatedRoom = await roomsAPI.getById(roomId);
        setRoom(updatedRoom);
        await fetchRooms();
        console.log('✅ Room status updated');
      }

      Alert.alert(
        'Success',
        'Cleaning task created successfully!',
        [
          {
            text: 'OK',
          },
          {
            text: 'View Tasks',
            onPress: () => navigation.navigate('HousekeepingDashboard'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Create cleaning task error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to create cleaning task'
      );
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleScheduleMaintenance = () => {
    if (!room) return;

    console.log('🔧 Opening maintenance schedule menu for room:', room.roomNumber);

    Alert.alert(
      'Schedule Maintenance',
      `Report a maintenance issue for Room ${room.roomNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Maintenance scheduling cancelled'),
        },
        {
          text: 'Plumbing',
          onPress: () => {
            console.log('🔧 User selected: Plumbing');
            scheduleMaintenance('PLUMBING', 'Plumbing issue reported');
          },
        },
        {
          text: 'Electrical',
          onPress: () => {
            console.log('🔧 User selected: Electrical');
            scheduleMaintenance('ELECTRICAL', 'Electrical issue reported');
          },
        },
        {
          text: 'HVAC',
          onPress: () => {
            console.log('🔧 User selected: HVAC');
            scheduleMaintenance('HVAC', 'HVAC issue reported');
          },
        },
        {
          text: 'Other',
          onPress: () => {
            console.log('🔧 User selected: Other');
            scheduleMaintenance('GENERAL', 'General maintenance issue reported');
          },
        },
      ]
    );
  };

  const scheduleMaintenance = async (
    issueType: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'FURNITURE' | 'APPLIANCES' | 'STRUCTURAL' | 'GENERAL',
    description: string
  ) => {
    if (!room) {
      console.error('❌ Cannot schedule maintenance: room is null');
      return;
    }

    console.log('🔧 Scheduling maintenance:', {
      roomId: room.id,
      roomNumber: room.roomNumber,
      issueType,
      description,
    });

    try {
      setIsSchedulingMaintenance(true);
      
      console.log('🔧 Calling maintenanceAPI.createTask...');
      const task = await maintenanceAPI.createTask({
        roomId: room.id,
        issueType,
        description: `${description} - Room ${room.roomNumber}`,
        priority: 'NORMAL',
        estimatedDuration: 60,
        scheduledDate: new Date().toISOString(),
      });
      console.log('✅ Maintenance task created successfully:', task);

      // Update room status to MAINTENANCE if not already
      if (room.status !== 'MAINTENANCE') {
        console.log('🔧 Updating room status to MAINTENANCE...');
        await roomsAPI.updateStatus(roomId, 'MAINTENANCE');
        const updatedRoom = await roomsAPI.getById(roomId);
        setRoom(updatedRoom);
        await fetchRooms();
        console.log('✅ Room status updated');
      }

      Alert.alert(
        'Success',
        'Maintenance task scheduled successfully!',
        [
          {
            text: 'OK',
          },
          {
            text: 'View Tasks',
            onPress: () => navigation.navigate('MaintenanceSchedule'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Schedule maintenance error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to schedule maintenance'
      );
    } finally {
      setIsSchedulingMaintenance(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading room details...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Room not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusOptions: Room['status'][] = [
    'AVAILABLE',
    'OCCUPIED',
    'CLEANING',
    'MAINTENANCE',
    'OUT_OF_SERVICE',
  ];

  const availableStatusChanges = statusOptions.filter((status) => status !== room.status);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Room Header */}
      <View style={styles.header}>
        <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(room.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(room.status)} {getStatusLabel(room.status)}
          </Text>
        </View>
      </View>

      {/* Room Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room Type:</Text>
          <Text style={styles.detailValue}>{room.roomType}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Floor:</Text>
          <Text style={styles.detailValue}>{room.floor}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Base Price:</Text>
          <Text style={styles.detailValue}>${room.basePrice.toFixed(2)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Max Occupancy:</Text>
          <Text style={styles.detailValue}>{room.maxOccupancy} guests</Text>
        </View>
      </View>

      {/* Room Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{room.hasBalcony ? '✅' : '❌'}</Text>
            <Text style={styles.featureText}>Balcony</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{room.hasKitchen ? '✅' : '❌'}</Text>
            <Text style={styles.featureText}>Kitchen</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{room.isSmoking ? '🚬' : '🚭'}</Text>
            <Text style={styles.featureText}>{room.isSmoking ? 'Smoking' : 'Non-Smoking'}</Text>
          </View>
        </View>
      </View>

      {/* TTLock Integration */}
      {room.lockMac && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Lock</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lock MAC:</Text>
            <Text style={styles.detailValue}>{room.lockMac || 'Not configured'}</Text>
          </View>

          {room.lockBattery !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Battery:</Text>
              <Text style={styles.detailValue}>{room.lockBattery}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Status Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Room Status</Text>
        
        {isUpdating ? (
          <View style={styles.updatingContainer}>
            <ActivityIndicator size="small" color="#0066CC" />
            <Text style={styles.updatingText}>Updating status...</Text>
          </View>
        ) : (
          <View style={styles.statusButtonsContainer}>
            {availableStatusChanges.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { borderColor: getStatusColor(status) },
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <Text style={styles.statusButtonIcon}>{getStatusIcon(status)}</Text>
                <Text style={[styles.statusButtonText, { color: getStatusColor(status) }]}>
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={handleAssignCleaning}
          disabled={isCreatingTask}
        >
          <Text style={styles.actionButtonIcon}>🧹</Text>
          <Text style={styles.actionButtonText}>
            {isCreatingTask ? 'Creating Task...' : 'Assign for Cleaning'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={handleScheduleMaintenance}
          disabled={isSchedulingMaintenance}
        >
          <Text style={styles.actionButtonIcon}>🔧</Text>
          <Text style={styles.actionButtonText}>
            {isSchedulingMaintenance ? 'Scheduling...' : 'Schedule Maintenance'}
          </Text>
        </TouchableOpacity>

        {room.status === 'OCCUPIED' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => Alert.alert('Coming Soon', 'View current guest feature will be available soon')}
          >
            <Text style={styles.actionButtonIcon}>👤</Text>
            <Text style={styles.actionButtonText}>View Current Guest</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {new Date(room.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated:</Text>
          <Text style={styles.detailValue}>
            {new Date(room.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  roomNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 15,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  statusButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  updatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  updatingText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
