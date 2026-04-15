import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { officePeopleAPI } from '../../api/officePeople';
import { officeSpacesAPI } from '../../api/officeSpaces';
import { officeVisitsAPI } from '../../api/officeVisits';
import { OfficePerson, OfficeSpace, OfficeVisit } from '../../types/api';
import { format } from 'date-fns';

export default function OfficeHomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spaces, setSpaces] = useState<OfficeSpace[]>([]);
  const [people, setPeople] = useState<OfficePerson[]>([]);
  const [todayVisits, setTodayVisits] = useState<OfficeVisit[]>([]);

  const loadOfficeData = useCallback(async () => {
    try {
      const [spaceData, peopleData, visitData] = await Promise.all([
        officeSpacesAPI.getAll(),
        officePeopleAPI.getAll(),
        officeVisitsAPI.getToday(),
      ]);

      setSpaces(spaceData);
      setPeople(peopleData);
      setTodayVisits(visitData);
    } catch (error) {
      console.error('Failed to load office dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOfficeData();
    }, [loadOfficeData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOfficeData();
  };

  const activeSpaces = spaces.filter((space) => space.status === 'ACTIVE').length;
  const activePeople = people.filter((person) => person.status === 'ACTIVE').length;
  const checkedInVisits = todayVisits.filter((visit) => visit.status === 'CHECKED_IN').length;
  const credentialRequests = todayVisits.filter((visit) => visit.credentialRequested).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading office workspace...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Office Access</Text>
        <Text style={styles.headerSubtitle}>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.grid}>
          <View style={[styles.metricCard, { backgroundColor: '#0f766e' }]}>
            <Text style={styles.metricValue}>{activeSpaces}</Text>
            <Text style={styles.metricLabel}>Active Spaces</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#1d4ed8' }]}>
            <Text style={styles.metricValue}>{activePeople}</Text>
            <Text style={styles.metricLabel}>Active People</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#b45309' }]}>
            <Text style={styles.metricValue}>{todayVisits.length}</Text>
            <Text style={styles.metricLabel}>Visits Today</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#7c3aed' }]}>
            <Text style={styles.metricValue}>{credentialRequests}</Text>
            <Text style={styles.metricLabel}>Credential Requests</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('OfficeSpaces')}>
          <Text style={styles.actionTitle}>Spaces</Text>
          <Text style={styles.actionSubtitle}>Browse offices, rooms, and secure areas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('OfficePeople')}>
          <Text style={styles.actionTitle}>People</Text>
          <Text style={styles.actionSubtitle}>Employees, visitors, contractors, and hosts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('OfficeVisits')}>
          <Text style={styles.actionTitle}>Visits</Text>
          <Text style={styles.actionSubtitle}>Issue access and manage arrivals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Visits</Text>
          <Text style={styles.sectionMeta}>{checkedInVisits} checked in</Text>
        </View>
        {todayVisits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No office visits scheduled today</Text>
            <Text style={styles.emptyText}>Create a visit when you want to issue temporary office access.</Text>
          </View>
        ) : (
          todayVisits.slice(0, 4).map((visit) => {
            const person = typeof visit.personId === 'object' ? visit.personId : null;
            const space = typeof visit.spaceId === 'object' ? visit.spaceId : null;
            return (
              <TouchableOpacity
                key={visit.id}
                style={styles.visitCard}
                onPress={() => navigation.navigate('OfficeVisits')}
              >
                <Text style={styles.visitTitle}>{visit.title}</Text>
                <Text style={styles.visitText}>
                  {person ? `${person.firstName} ${person.lastName}` : 'Unknown visitor'}
                </Text>
                <Text style={styles.visitText}>
                  {space ? `${space.name} (${space.code})` : 'Unknown space'}
                </Text>
                <Text style={styles.visitStatus}>{visit.status}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#475569',
  },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 36,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#cbd5e1',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  sectionMeta: {
    fontSize: 13,
    color: '#475569',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#e2e8f0',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
  },
  visitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  visitText: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
  visitStatus: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
});
