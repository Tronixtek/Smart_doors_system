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
import { housekeepingAPI } from '../../api/housekeeping';
import { HousekeepingTask, Room } from '../../types/api';

export default function HousekeepingDashboardScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🧹 Loading housekeeping data with filter:', filter);
      
      const [tasksData, statsData] = await Promise.all([
        filter === 'ALL' 
          ? housekeepingAPI.getTasks()  // Get ALL tasks, not just today's
          : housekeepingAPI.getTasks({ status: filter }),
        housekeepingAPI.getStats(),
      ]);

      console.log('✅ Housekeeping data loaded:', {
        tasksCount: tasksData.length,
        stats: statsData,
      });

      setTasks(tasksData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Load housekeeping data error:', error);
      
      // Show helpful error message for authentication issues
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log out and log back in.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 403) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to access housekeeping features. Contact your administrator.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to load housekeeping data. Please try again.',
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
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

  const getRoomNumber = (task: HousekeepingTask): string => {
    if (typeof task.roomId === 'object' && task.roomId !== null) {
      return (task.roomId as Room).roomNumber;
    }
    return 'N/A';
  };

  const renderTask = ({ item }: { item: HousekeepingTask }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskHeaderLeft}>
          <Text style={styles.roomNumber}>
            🚪 Room {getRoomNumber(item)}
          </Text>
          <Text style={styles.taskType}>{getTaskTypeLabel(item.taskType)}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>
            {getPriorityIcon(item.priority)} {item.priority}
          </Text>
        </View>
      </View>

      <View style={styles.taskBody}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(item.status)} {item.status.replace('_', ' ')}
          </Text>
        </View>

        {item.notes && (
          <Text style={styles.taskNotes} numberOfLines={2}>
            📝 {item.notes}
          </Text>
        )}

        {item.estimatedDuration && (
          <Text style={styles.duration}>
            ⏱️ Est. {item.estimatedDuration} minutes
          </Text>
        )}
      </View>

      <View style={styles.taskFooter}>
        <Text style={styles.timestamp}>
          Created: {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
        {item.status === 'COMPLETED' && item.completedAt && (
          <Text style={styles.completedTime}>
            ✅ Completed: {new Date(item.completedAt).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.pendingTasks || 0}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#2196F3' }]}>{stats?.inProgressTasks || 0}</Text>
        <Text style={styles.statLabel}>In Progress</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats?.completedToday || 0}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.totalTasks || 0}</Text>
        <Text style={styles.statLabel}>Total Active</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            filter === status && styles.filterButtonActive,
          ]}
          onPress={() => setFilter(status)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === status && styles.filterButtonTextActive,
            ]}
          >
            {status.replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderStats()}
      {renderFilters()}
      
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧹</Text>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'ALL' ? 'No tasks for today' : `No ${filter.toLowerCase().replace('_', ' ')} tasks`}
            </Text>
          </View>
        }
      />
    </View>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 15,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    marginBottom: 10,
  },
  taskHeaderLeft: {
    flex: 1,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  taskType: {
    fontSize: 14,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  taskBody: {
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  taskNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  duration: {
    fontSize: 13,
    color: '#2196F3',
  },
  taskFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  completedTime: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
