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
  TextInput,
} from 'react-native';
import { housekeepingAPI } from '../../api/housekeeping';
import { HousekeepingTask, Room, User } from '../../types/api';

export default function TaskDetailScreen({ navigation, route }: any) {
  const { taskId } = route.params || {};
  const [task, setTask] = useState<HousekeepingTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setIsLoading(true);
      const data = await housekeepingAPI.getTaskById(taskId);
      setTask(data);
      if (data.completionNotes) {
        setCompletionNotes(data.completionNotes);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTask();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'IN_PROGRESS':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'IN_PROGRESS':
        return '🔄';
      case 'COMPLETED':
        return '✅';
      default:
        return '❓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#F44336';
      case 'NORMAL':
        return '#2196F3';
      case 'LOW':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'CHECKOUT_CLEAN':
        return 'Checkout Clean';
      case 'DAILY_CLEAN':
        return 'Daily Clean';
      case 'DEEP_CLEAN':
        return 'Deep Clean';
      default:
        return taskType;
    }
  };

  const getRoomNumber = (): string => {
    if (task && typeof task.roomId === 'object' && task.roomId !== null) {
      return (task.roomId as Room).roomNumber;
    }
    return 'N/A';
  };

  const getAssignedToName = (): string => {
    if (task && task.assignedTo && typeof task.assignedTo === 'object') {
      const user = task.assignedTo as User;
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Unassigned';
  };

  const handleStatusChange = (newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!task) return;

    const statusLabels = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
    };

    let message = `Change task status to ${statusLabels[newStatus]}?`;
    
    if (newStatus === 'COMPLETED') {
      message = 'Mark this task as completed? This will update the room status to Available.';
    }

    Alert.alert('Update Task Status', message, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Confirm',
        onPress: () => updateStatus(newStatus),
      },
    ]);
  };

  const updateStatus = async (newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!task) return;

    try {
      setIsUpdating(true);
      const updatedTask = await housekeepingAPI.updateTaskStatus(
        taskId,
        newStatus,
        newStatus === 'COMPLETED' ? completionNotes : undefined
      );
      setTask(updatedTask);
      
      Alert.alert(
        'Success',
        newStatus === 'COMPLETED'
          ? 'Task completed! Room is now Available.'
          : 'Task status updated successfully'
      );

      if (newStatus === 'COMPLETED') {
        // Navigate back to housekeeping dashboard after completion
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Task not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canStart = task.status === 'PENDING';
  const canComplete = task.status === 'IN_PROGRESS';
  const isCompleted = task.status === 'COMPLETED';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Task Header */}
      <View style={styles.header}>
        <Text style={styles.roomNumber}>🚪 Room {getRoomNumber()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Task Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Information</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Task Type:</Text>
          <Text style={styles.detailValue}>{getTaskTypeLabel(task.taskType)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priority:</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Assigned To:</Text>
          <Text style={styles.detailValue}>{getAssignedToName()}</Text>
        </View>

        {task.estimatedDuration && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Duration:</Text>
            <Text style={styles.detailValue}>{task.estimatedDuration} minutes</Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {task.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{task.notes}</Text>
        </View>
      )}

      {/* Completion Notes Input (for in-progress or completed tasks) */}
      {(task.status === 'IN_PROGRESS' || task.status === 'COMPLETED') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completion Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            value={completionNotes}
            onChangeText={setCompletionNotes}
            placeholder="Add notes about the cleaning (optional)..."
            editable={task.status !== 'COMPLETED'}
          />
        </View>
      )}

      {/* Status Actions */}
      {!isCompleted && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>

          {isUpdating ? (
            <View style={styles.updatingContainer}>
              <ActivityIndicator size="small" color="#0066CC" />
              <Text style={styles.updatingText}>Updating...</Text>
            </View>
          ) : (
            <View style={styles.actionButtonsContainer}>
              {canStart && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => handleStatusChange('IN_PROGRESS')}
                >
                  <Text style={styles.actionButtonIcon}>🔄</Text>
                  <Text style={styles.actionButtonText}>Start Task</Text>
                </TouchableOpacity>
              )}

              {canComplete && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleStatusChange('COMPLETED')}
                >
                  <Text style={styles.actionButtonIcon}>✅</Text>
                  <Text style={styles.actionButtonText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Timestamps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {new Date(task.createdAt).toLocaleString()}
          </Text>
        </View>

        {task.startedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started:</Text>
            <Text style={styles.detailValue}>
              {new Date(task.startedAt).toLocaleString()}
            </Text>
          </View>
        )}

        {task.completedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed:</Text>
            <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
              {new Date(task.completedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Completed Badge */}
      {isCompleted && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedBannerText}>✅ Task Completed</Text>
        </View>
      )}
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
    paddingHorizontal: 20,
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
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FFF',
  },
  actionButtonsContainer: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
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
  completedBanner: {
    backgroundColor: '#4CAF50',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedBannerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
