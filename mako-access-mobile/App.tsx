import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RegisterLockScreen from './src/screens/RegisterLockScreen';
import LockDetailsScreen from './src/screens/LockDetailsScreen';
import CreateAccessPointScreen from './src/screens/CreateAccessPointScreen';
import SetupOrganizationScreen from './src/screens/SetupOrganizationScreen';
import { useAuthStore } from './src/store/authStore';

const Stack = createStackNavigator();

export default function App() {
  const { token, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!token ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Mako Access' }} />
            <Stack.Screen name="CreateOrganization" component={SetupOrganizationScreen} options={{ title: 'Create Organization' }} />
            <Stack.Screen name="RegisterLock" component={RegisterLockScreen} options={{ title: 'Register New Lock' }} />
            <Stack.Screen name="LockDetails" component={LockDetailsScreen} options={{ title: 'Lock Settings' }} />
            <Stack.Screen name="CreateAccessPoint" component={CreateAccessPointScreen} options={{ title: 'Add Access Point' }} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
