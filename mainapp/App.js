import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/Home";
import HistoryScreen from "./screens/History";
import CartScreen from "./screens/Cart";
import PaymentsScreen from "./screens/Payments";
import MoreScreen from './screens/More';
import AccountDetailsScreen from './screens/AccountDetails';
import AddressBookScreen from './screens/AddressBook';
import AddAddressScreen from './screens/AddAddress';
import EditAddressScreen from './screens/EditAddress';
import AboutUsScreen from './screens/AboutUs';
import SupportScreen from './screens/Support';
import AdminScreen from './screens/AdminScreen';
import ItemDetailsScreen from './screens/ItemDetails';
import CategoryItemsScreen from './screens/CategoryItems';
import ManageCategoriesScreen from './screens/ManageCategoriesScreen';
import WishlistScreen from './screens/WishlistScreen';
import { Image, View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import 'react-native-gesture-handler';
import { CartProvider, useCart } from './context/CartContext';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import Notifications from './screens/Notifications';
import AdminTabs from './navigation/AdminTabs';
import OrderDetails from './screens/OrderDetails';
import { NotificationProvider } from './context/NotificationContext';
import { COLORS } from './constants/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Add SplashScreen component with new theme
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

// Custom Header Component with new logo
const CustomHeader = () => (
  <View style={styles.header}>
    <Image 
      source={require("./assets/theapexlogo.png")} 
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

// Bottom Tab Navigator
const MainTabs = () => {
  const { cartItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'History':
              iconName = focused ? 'history' : 'history';
              break;
            case 'Cart':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'Payments':
              iconName = focused ? 'credit-card' : 'credit-card-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#808080',
        tabBarStyle: {
          height: 60,
          padding: 10,
          backgroundColor: '#2d2d2d',
          borderTopColor: '#404040',
        },
        tabBarLabelStyle: {
          paddingBottom: 5,
        },
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "white",
        headerTitle: () => <CustomHeader />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarBadge: cartItems.length || null,
          tabBarBadgeStyle: {
            backgroundColor: 'red',
          },
        }}
      />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

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
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MainApp"
        component={MainTabs}
        options={{
          headerShown: false,
          headerLeft: null,
        }}
      />
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{
          title: 'Admin Panel',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="AdminTabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AccountDetails" 
        component={AccountDetailsScreen}
        options={{
          title: 'Account Details',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="AddressBook" 
        component={AddressBookScreen}
        options={{
          title: 'Address Book',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="AddAddress" 
        component={AddAddressScreen}
        options={{
          title: 'Add New Address',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="EditAddress" 
        component={EditAddressScreen}
        options={{
          title: 'Edit Address',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUsScreen}
        options={{
          title: 'About Us',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{
          title: 'Help & Support',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="ItemDetails" 
        component={ItemDetailsScreen}
        options={{
          title: 'Product Details',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="CategoryItems" 
        component={CategoryItemsScreen}
        options={{
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="ManageCategories" 
        component={ManageCategoriesScreen}
        options={{
          title: 'Manage Category',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Wishlist" 
        component={WishlistScreen}
        options={{
          title: 'My Wishlist',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={Notifications}
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
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

  const paperTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      surface: COLORS.backgroundCard,
      text: COLORS.textPrimary,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NotificationProvider>
        <CartProvider>
          <NavigationContainer>
            <MainStack />
          </NavigationContainer>
          <Toast />
        </CartProvider>
      </NotificationProvider>
    </PaperProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  header: { 
    width: '100%',
    height: 56,
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#1a1a1a",
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
