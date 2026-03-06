import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import OrderDetailsScreen from "./screens/OrderDetailsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { Image, View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import 'react-native-gesture-handler';
import app from './firebaseConfig';

const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// Add SplashScreen component
const SplashScreen = () => (
  <View style={styles.splashContainer}>
    <Image
      source={require("./assets/homeapex.png")}
      style={styles.splashImage}
      resizeMode="cover"
      onError={(error) => console.error('Image loading error:', error)}
    />
    <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
  </View>
);

// Custom Header Component
const CustomHeader = () => (
  <View style={styles.header}>
    <Image 
      source={require("./assets/theapexlogo.png")} 
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerLeft: null,
          headerTitle: "Delivery Dashboard",
        }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen}
        options={{
          headerTitle: "Order Details",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "white",
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerTitle: "My Profile",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "white",
        }}
      />
    </Stack.Navigator>
  );
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1a1a1a',
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 50,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
});
