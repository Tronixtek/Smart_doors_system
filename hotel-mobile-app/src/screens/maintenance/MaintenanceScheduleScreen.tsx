import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { maintenanceAPI } from '../../api/maintenance';
import { MaintenanceTask, Room } from '../../types/api';

export default function MaintenanceScheduleScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'URGENT'>('ALL');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔧 Loading maintenance data with filter:', filter);
      
      const [tasksData, statsData] = await Promise.all([
        filter === 'URGENT'
          ? maintenanceAPI.getUrgentTasks()
          : filter === 'ALL'
          ? maintenanceAPI.getTasks()
          : maintenanceAPI.getTasks({ status: filter }),
        maintenanceAPI.getStats(),
      ]);

      console.log('✅ Maintenance data loaded:', {
        tasksCount: tasksData.length,
        stats: statsData,
      });

      setTasks(tasksData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Load maintenance data error:', error);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log out and log back in.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 403) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to access maintenance features. Contact your administrator.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to load maintenance data. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return '📅';
      case 'IN_PROGRESS':
        return '🔧';
      case 'COMPLETED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      default:
        return '❓';
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '🚨';
      case 'HIGH':
        return '🔴';
      case 'NORMAL':
        return '🔵';
      case 'LOW':
        return '⚪';
      default:
        return '❓';
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

  const renderTask = ({ item }: { item: MaintenanceTask }) => {
    const room = typeof item.roomId === 'object' ? item.roomId : null;
    const roomNumber = room ? room.roomNumber : 'N/A';

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate('MaintenanceDetail', { taskId: item.id })}
      >
        <View style={styles.taskHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomNumber}>Room {roomNumber}</Text>
            <Text style={styles.issueType}>{getIssueTypeLabel(item.issueType)}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>
              {getPriorityIcon(item.priority)} {item.priority}
            </Text>
          </View>
        </View>

        <View style={styles.taskBody}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(item.status)} {item.status}
            </Text>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.taskFooter}>
          <Text style={styles.duration}>⏱️ {item.estimatedDuration} min</Text>
          {item.scheduledDate && (
            <Text style={styles.scheduledDate}>
              📅 {new Date(item.scheduledDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading maintenance tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Statistics */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.scheduledTasks}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.inProgressTasks}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.urgentTasks}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      )}

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ALL' && styles.filterButtonActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterButtonText, filter === 'ALL' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'URGENT' && styles.filterButtonActive]}
          onPress={() => setFilter('URGENT')}
        >
          <Text style={[styles.filterButtonText, filter === 'URGENT' && styles.filterButtonTextActive]}>
            🚨 Urgent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'SCHEDULED' && styles.filterButtonActive]}
          onPress={() => setFilter('SCHEDULED')}
        >
          <Text style={[styles.filterButtonText, filter === 'SCHEDULED' && styles.filterButtonTextActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'IN_PROGRESS' && styles.filterButtonActive]}
          onPress={() => setFilter('IN_PROGRESS')}
        >
          <Text style={[styles.filterButtonText, filter === 'IN_PROGRESS' && styles.filterButtonTextActive]}>
            In Progress
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No maintenance tasks found</Text>
            <Text style={styles.emptySubtext}>Pull to refresh</Text>
          </View>
        }
      />
    </View>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  issueType: {
    fontSize: 14,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  taskBody: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  scheduledDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
