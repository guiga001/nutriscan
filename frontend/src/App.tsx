import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import BarcodeScannerScreen from './screens/BarcodeScannerScreen';
import DashboardScreen from './screens/DashboardScreen';

// Services & Store
import { useNutriTrackerStore } from './store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * MainApp - Tabbed navigation (after login)
 */
function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'chart-box' : 'chart-box-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'barcode-scan' : 'barcode';
          }
          return (
            <MaterialCommunityIcons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Scanner"
        component={BarcodeScannerScreen}
        options={{ title: 'Escanear' }}
      />
    </Tab.Navigator>
  );
}

/**
 * RootNavigator - Authentication check
 */
function RootNavigator() {
  const { authToken } = useNutriTrackerStore();
  const [isLoading, setIsLoading] = React.useState(true);

  // Load from AsyncStorage on app start
  React.useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {authToken ? (
        <Stack.Screen name="Main" component={MainApp} />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ animationEnabled: false }}
        />
      )}
    </Stack.Navigator>
  );
}

/**
 * SimpleAuthScreen - For development
 */
function AuthScreen() {
  const { setAuthToken, setUser } = useNutriTrackerStore();

  const handleLogin = () => {
    // Mock login - in production: call /api/v1/macros/setup
    setAuthToken('mock-jwt-token-12345');
    setUser({
      id: 'user-1',
      email: 'user@example.com',
      weight_kg: 80,
      height_cm: 175,
      age_years: 28,
      tmb_base: 1780.5,
      subscription_tier: 'pro',
    });
  };

  return (
    <View style={styles.authContainer}>
      <View style={styles.authContent}>
        <MaterialCommunityIcons
          name="nutrition"
          size={80}
          color="#4CAF50"
          style={styles.logo}
        />
        <Text style={styles.title}>NutriTracker</Text>
        <Text style={styles.subtitle}>
          Rastreie seus macros, atinja seus objetivos
        </Text>
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
        >
          Criar Conta / Login
        </Button>
      </View>
    </View>
  );
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authContent: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
    textAlign: 'center',
  },
  loginButton: {
    width: 200,
  },
});

// Import Button after defining styles
import { Button } from 'react-native-paper';
import { Text } from 'react-native';
