import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import CheckInScreen from '../screens/checkin/CheckInScreen';
import CheckOutScreen from '../screens/checkin/CheckOutScreen';
import RoomSelectionScreen from '../screens/checkin/RoomSelectionScreen';
import TodayCheckInsScreen from '../screens/checkin/TodayCheckInsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HousekeepingDashboardScreen from '../screens/housekeeping/HousekeepingDashboardScreen';
import TaskDetailScreen from '../screens/housekeeping/TaskDetailScreen';
import AddLockScreen from '../screens/locks/AddLockScreen';
import LockDetailScreen from '../screens/locks/LockDetailScreen';
import LockListScreen from '../screens/locks/LockListScreen';
import LockManagementScreen from '../screens/locks/LockManagementScreen';
import MaintenanceDetailScreen from '../screens/maintenance/MaintenanceDetailScreen';
import MaintenanceScheduleScreen from '../screens/maintenance/MaintenanceScheduleScreen';
import AppModeSelectionScreen from '../screens/mode/AppModeSelectionScreen';
import MoreScreen from '../screens/more/MoreScreen';
import OfficeMoreScreen from '../screens/more/OfficeMoreScreen';
import OfficeLockListScreen from '../screens/office/OfficeLockListScreen';
import CreateOfficePersonScreen from '../screens/office/CreateOfficePersonScreen';
import CreateOfficeVisitScreen from '../screens/office/CreateOfficeVisitScreen';
import OfficeHomeScreen from '../screens/office/OfficeHomeScreen';
import OfficePeopleScreen from '../screens/office/OfficePeopleScreen';
import OfficeSpacesScreen from '../screens/office/OfficeSpacesScreen';
import OfficeVisitsScreen from '../screens/office/OfficeVisitsScreen';
import AppSettingsScreen from '../screens/settings/AppSettingsScreen';
import CreateReservationScreen from '../screens/reservations/CreateReservationScreen';
import EditReservationScreen from '../screens/reservations/EditReservationScreen';
import ReservationDetailScreen from '../screens/reservations/ReservationDetailScreen';
import ReservationsListScreen from '../screens/reservations/ReservationsListScreen';
import RoomDetailScreen from '../screens/rooms/RoomDetailScreen';
import RoomsListScreen from '../screens/rooms/RoomsListScreen';
import { CreateEditStaffScreen } from '../screens/staff/CreateEditStaffScreen';
import { StaffDetailScreen } from '../screens/staff/StaffDetailScreen';
import { StaffListScreen } from '../screens/staff/StaffListScreen';
import { useAppModeStore } from '../store/appModeStore';
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const renderTabIcon = (icon: string) => (
  <Text style={{ fontSize: 20 }}>{icon}</Text>
);

function HotelTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="HotelDashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: () => renderTabIcon('🏨'),
          headerTitle: 'Hotel Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="HotelReservations"
        component={ReservationsListScreen}
        options={{
          tabBarIcon: () => renderTabIcon('📅'),
          headerTitle: 'Reservations',
          tabBarLabel: 'Reservations',
        }}
      />
      <Tab.Screen
        name="HotelCheckIns"
        component={TodayCheckInsScreen}
        options={{
          tabBarIcon: () => renderTabIcon('🛎️'),
          headerTitle: "Today's Check-Ins",
          tabBarLabel: 'Check-In',
        }}
      />
      <Tab.Screen
        name="HotelRooms"
        component={RoomsListScreen}
        options={{
          tabBarIcon: () => renderTabIcon('🚪'),
          headerTitle: 'Rooms',
          tabBarLabel: 'Rooms',
        }}
      />
      <Tab.Screen
        name="HotelMore"
        component={MoreScreen}
        options={{
          tabBarIcon: () => renderTabIcon('✨'),
          headerTitle: 'More',
          tabBarLabel: 'More',
        }}
      />
    </Tab.Navigator>
  );
}

function OfficeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="OfficeDashboard"
        component={OfficeHomeScreen}
        options={{
          tabBarIcon: () => renderTabIcon('🏢'),
          headerTitle: 'Office Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="OfficeVisitsTab"
        component={OfficeVisitsScreen}
        options={{
          tabBarIcon: () => renderTabIcon('📋'),
          headerTitle: 'Office Visits',
          tabBarLabel: 'Visits',
        }}
      />
      <Tab.Screen
        name="OfficePeopleTab"
        component={OfficePeopleScreen}
        options={{
          tabBarIcon: () => renderTabIcon('👥'),
          headerTitle: 'Office People',
          tabBarLabel: 'People',
        }}
      />
      <Tab.Screen
        name="OfficeSpacesTab"
        component={OfficeSpacesScreen}
        options={{
          tabBarIcon: () => renderTabIcon('🧭'),
          headerTitle: 'Office Spaces',
          tabBarLabel: 'Spaces',
        }}
      />
      <Tab.Screen
        name="OfficeMoreTab"
        component={OfficeMoreScreen}
        options={{
          tabBarIcon: () => renderTabIcon('⚙️'),
          headerTitle: 'More',
          tabBarLabel: 'More',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { mode, isReady, loadMode } = useAppModeStore();

  useEffect(() => {
    loadUser();
    loadMode();
  }, [loadMode, loadUser]);

  if (isLoading || !isReady) {
    return null;
  }

  return (
    <NavigationContainer key={`${isAuthenticated ? 'auth' : 'guest'}-${mode}`}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : mode === 'hotel' ? (
          <>
            <Stack.Screen name="HotelMain" component={HotelTabs} />
            <Stack.Screen name="AppModeSelection" component={AppModeSelectionScreen} options={{ headerShown: true, title: 'Application Mode' }} />
            <Stack.Screen name="AppSettings" component={AppSettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
            <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} options={{ headerShown: true, title: 'Reservation Details' }} />
            <Stack.Screen name="CreateReservation" component={CreateReservationScreen} options={{ headerShown: true, title: 'New Reservation' }} />
            <Stack.Screen name="EditReservation" component={EditReservationScreen} options={{ headerShown: true, title: 'Edit Reservation' }} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ headerShown: true, title: 'Check-In' }} />
            <Stack.Screen name="CheckOut" component={CheckOutScreen} options={{ headerShown: true, title: 'Check-Out' }} />
            <Stack.Screen name="RoomSelection" component={RoomSelectionScreen} options={{ headerShown: true, title: 'Select Room' }} />
            <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ headerShown: true, title: 'Room Details' }} />
            <Stack.Screen name="HousekeepingDashboard" component={HousekeepingDashboardScreen} options={{ headerShown: true, title: 'Housekeeping' }} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ headerShown: true, title: 'Task Details' }} />
            <Stack.Screen name="MaintenanceSchedule" component={MaintenanceScheduleScreen} options={{ headerShown: true, title: 'Maintenance Schedule' }} />
            <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ headerShown: true, title: 'Maintenance Details' }} />
            <Stack.Screen name="StaffList" component={StaffListScreen} options={{ headerShown: true, title: 'Staff Management' }} />
            <Stack.Screen name="StaffDetail" component={StaffDetailScreen} options={{ headerShown: true, title: 'Staff Details' }} />
            <Stack.Screen name="CreateEditStaff" component={CreateEditStaffScreen} options={{ headerShown: true, title: 'Staff Member' }} />
            <Stack.Screen name="LockManagement" component={LockManagementScreen} options={{ headerShown: true, title: 'TTLock Management' }} />
            <Stack.Screen name="LockList" component={LockListScreen} options={{ headerShown: true, title: 'Lock Management' }} />
            <Stack.Screen name="AddLock" component={AddLockScreen} options={{ headerShown: true, title: 'Add New Lock' }} />
            <Stack.Screen name="LockDetail" component={LockDetailScreen} options={{ headerShown: true, title: 'Lock Details' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="OfficeMain" component={OfficeTabs} />
            <Stack.Screen name="AppModeSelection" component={AppModeSelectionScreen} options={{ headerShown: true, title: 'Application Mode' }} />
            <Stack.Screen name="AppSettings" component={AppSettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
            <Stack.Screen name="OfficeHome" component={OfficeHomeScreen} options={{ headerShown: true, title: 'Office Access' }} />
            <Stack.Screen name="OfficeSpaces" component={OfficeSpacesScreen} options={{ headerShown: true, title: 'Office Spaces' }} />
            <Stack.Screen name="OfficePeople" component={OfficePeopleScreen} options={{ headerShown: true, title: 'Office People' }} />
            <Stack.Screen name="OfficeVisits" component={OfficeVisitsScreen} options={{ headerShown: true, title: 'Office Visits' }} />
            <Stack.Screen name="OfficeLockList" component={OfficeLockListScreen} options={{ headerShown: true, title: 'Office Lock Management' }} />
            <Stack.Screen name="CreateOfficeVisit" component={CreateOfficeVisitScreen} options={{ headerShown: true, title: 'Create Office Visit' }} />
            <Stack.Screen name="CreateOfficePerson" component={CreateOfficePersonScreen} options={{ headerShown: true, title: 'Add Office Person' }} />
            <Stack.Screen name="StaffList" component={StaffListScreen} options={{ headerShown: true, title: 'Team Management' }} />
            <Stack.Screen name="StaffDetail" component={StaffDetailScreen} options={{ headerShown: true, title: 'Staff Details' }} />
            <Stack.Screen name="CreateEditStaff" component={CreateEditStaffScreen} options={{ headerShown: true, title: 'Staff Member' }} />
            <Stack.Screen name="LockManagement" component={LockManagementScreen} options={{ headerShown: true, title: 'TTLock Management' }} />
            <Stack.Screen name="LockList" component={LockListScreen} options={{ headerShown: true, title: 'Lock Management' }} />
            <Stack.Screen name="AddLock" component={AddLockScreen} options={{ headerShown: true, title: 'Add New Lock' }} />
            <Stack.Screen name="LockDetail" component={LockDetailScreen} options={{ headerShown: true, title: 'Lock Details' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
