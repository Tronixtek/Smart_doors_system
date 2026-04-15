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
import { maintenanceAPI } from '../../api/maintenance';
import { roomsAPI } from '../../api/rooms';
import { MaintenanceTask, Room, User } from '../../types/api';

export default function MaintenanceDetailScreen({ route, navigation }: any) {
  const { taskId } = route.params;
  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actualDuration, setActualDuration] = useState('');

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setIsLoading(true);
      const taskData = await maintenanceAPI.getTaskById(taskId);
      setTask(taskData);
      setResolutionNotes(taskData.resolutionNotes || '');
      setActualDuration(taskData.actualDuration?.toString() || '');
    } catch (error: any) {
      console.error('Load maintenance task error:', error);
      Alert.alert('Error', error.message || 'Failed to load task');
navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTask();
    setRefreshing(false);
  };

  const updateStatus = async (newStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    if (!task) return;

    const statusLabels = {
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };

    Alert.alert(
      'Update Status',
      `Change status to ${statusLabels[newStatus]}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const duration = actualDuration ? parseInt(actualDuration) : undefined;
              const updatedTask = await maintenanceAPI.updateTaskStatus(
                taskId,
                newStatus,
                resolutionNotes,
                duration
              );
              setTask(updatedTask);

              // If completed, update room status to AVAILABLE
              if (newStatus === 'COMPLETED') {
                const room = typeof task.roomId === 'object' ? task.roomId : null;
                if (room && room.status === 'MAINTENANCE') {
                  await roomsAPI.updateStatus(room.id, 'AVAILABLE');
                }
              }

              Alert.alert('Success', 'Task status updated successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update status');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return '#FF9800';
      case 'IN_PROGRESS':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '#D32F2F';
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

  const getIssueTypeLabel = (issueType: string) => {
    const labels: Record<string, string> = {
      PLUMBING: 'Plumbing',
      ELECTRICAL: 'Electrical',
      HVAC: 'HVAC',
      FURNITURE: 'Furniture',
      APPLIANCES: 'Appliances',
      STRUCTURAL: 'Structural',
      GENERAL: 'General',
    };
    return labels[issueType] || issueType;
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

  const room = typeof task.roomId === 'object' ? task.roomId : null;
  const assignedUser = typeof task.assignedTo === 'object' ? task.assignedTo : null;
  const reportedByUser = typeof task.reportedBy === 'object' ? task.reportedBy : null;

  const canEdit = task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roomNumber}>Room {room?.roomNumber || 'N/A'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{task.status}</Text>
        </View>
      </View>

      {/* Task Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Information</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Issue Type:</Text>
          <Text style={styles.detailValue}>{getIssueTypeLabel(task.issueType)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priority:</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>

        {task.scheduledDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(task.scheduledDate).toLocaleDateString()} {new Date(task.scheduledDate).toLocaleTimeString()}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Est. Duration:</Text>
          <Text style={styles.detailValue}>{task.estimatedDuration} minutes</Text>
        </View>

        {assignedUser && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned To:</Text>
            <Text style={styles.detailValue}>
              {assignedUser.firstName} {assignedUser.lastName}
            </Text>
          </View>
        )}

        {reportedByUser && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reported By:</Text>
            <Text style={styles.detailValue}>
              {reportedByUser.firstName} {reportedByUser.lastName}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{task.description}</Text>
      </View>

      {/* Resolution Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resolution Notes</Text>
        <TextInput
          style={[styles.notesInput, !canEdit && styles.notesInputDisabled]}
          placeholder="Enter resolution notes..."
          value={resolutionNotes}
          onChangeText={setResolutionNotes}
          multiline
          numberOfLines={4}
          editable={canEdit}
        />
      </View>

      {/* Actual Duration Input */}
      {(task.status === 'IN_PROGRESS' || task.status === 'COMPLETED') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actual Duration (minutes)</Text>
          <TextInput
            style={[styles.durationInput, !canEdit && styles.notesInputDisabled]}
            placeholder="Enter actual duration..."
            value={actualDuration}
            onChangeText={setActualDuration}
            keyboardType="numeric"
            editable={canEdit}
          />
        </View>
      )}

      {/* Status Actions */}
      {canEdit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsContainer}>
            {task.status === 'SCHEDULED' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => updateStatus('IN_PROGRESS')}
                disabled={isUpdating}
              >
                <Text style={styles.actionButtonText}>Start Task</Text>
              </TouchableOpacity>
            )}

            {task.status === 'IN_PROGRESS' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => updateStatus('COMPLETED')}
                disabled={isUpdating}
              >
                <Text style={styles.actionButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            )}

            {(task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS') && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => updateStatus('CANCELLED')}
                disabled={isUpdating}
              >
                <Text style={styles.actionButtonText}>Cancel Task</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Created:</Text>
            <Text style={styles.timelineValue}>
              {new Date(task.createdAt).toLocaleString()}
            </Text>
          </View>
          {task.startedAt && (
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Started:</Text>
              <Text style={styles.timelineValue}>
                {new Date(task.startedAt).toLocaleString()}
              </Text>
            </View>
          )}
          {task.completedAt && (
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Completed:</Text>
              <Text style={styles.timelineValue}>
                {new Date(task.completedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

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
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666',
  },
  timelineValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
