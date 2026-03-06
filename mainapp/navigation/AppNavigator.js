import React from 'react';
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

// Import all screens
import HomeScreen from '../screens/Home';
import HistoryScreen from '../screens/History';
import CartScreen from '../screens/Cart';
import PaymentsScreen from '../screens/Payments';
import MoreScreen from '../screens/More';
import AdminScreen from '../screens/AdminScreen';
import Notifications from '../screens/Notifications';
import WishlistScreen from '../screens/WishlistScreen';
import ItemDetails from '../screens/ItemDetails';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AccountDetailsScreen from '../screens/AccountDetails';
import AddressBookScreen from '../screens/AddressBook';
import AddAddressScreen from '../screens/AddAddress';
import EditAddressScreen from '../screens/EditAddress';
import AboutUsScreen from '../screens/AboutUs';
import SupportScreen from '../screens/Support';
import CategoryItemsScreen from '../screens/CategoryItems';
import AdminTabs from './AdminTabs'; // Import AdminTabs
import ProductDetails from '../screens/ProductDetails';
import AddProduct from '../screens/AddProduct';
import AddCategory from '../screens/AddCategory';
import ManageProducts from '../screens/ManageProducts';
import ManageCategories from '../screens/ManageCategories';
import ManageOrders from '../screens/ManageOrders';
import OrderHistory from '../screens/OrderHistory';
import OrderDetails from '../screens/OrderDetails';
import Payments from '../screens/Payments';
import More from '../screens/More';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const TabNavigator = () => {
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
        tabBarActiveTintColor: 'green',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: 'green' },
        headerTintColor: 'white',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <Image 
              source={require('../assets/thapa_store.png')} 
              style={{ width: 150, height: 40, resizeMode: 'contain' }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 15 }}>
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => navigation.navigate('Wishlist')}
              >
                <MaterialIcons name="favorite-border" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
              >
                <MaterialIcons name="notifications-none" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarBadge: cartItems?.length > 0 ? cartItems.length : null,
          tabBarBadgeStyle: { backgroundColor: 'red' },
        }}
      />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: 'green' },
        headerTintColor: 'white',
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
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ItemDetails" component={ItemDetails} />
      <Stack.Screen 
        name="Wishlist" 
        component={WishlistScreen}
        options={{ title: 'My Wishlist' }}
      />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{
          title: 'Admin Dashboard',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
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
        options={{ title: 'Account Details' }}
      />
      <Stack.Screen 
        name="AddressBook" 
        component={AddressBookScreen}
        options={{ title: 'Address Book' }}
      />
      <Stack.Screen 
        name="AddAddress" 
        component={AddAddressScreen}
        options={{ title: 'Add New Address' }}
      />
      <Stack.Screen 
        name="EditAddress" 
        component={EditAddressScreen}
        options={{ title: 'Edit Address' }}
      />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUsScreen}
        options={{ title: 'About Us' }}
      />
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <Stack.Screen 
        name="CategoryItems" 
        component={CategoryItemsScreen}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetails} 
        options={{ title: 'Product Details' }} 
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddProduct}
        options={{
          headerTitle: 'Add/Edit Product',
          headerLeft: (props) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('AdminTabs', { screen: 'Products' })}
              {...props}
            >
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="AddCategory" 
        component={AddCategory}
        options={{
          headerTitle: 'Add/Edit Category',
          headerLeft: (props) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('AdminTabs', { screen: 'Categories' })}
              {...props}
            >
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="ManageProducts" 
        component={ManageProducts}
        options={{
          headerTitle: 'Manage Products',
          headerLeft: (props) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('AdminTabs', { screen: 'Products' })}
              {...props}
            >
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="ManageCategories" 
        component={ManageCategories}
        options={{
          headerTitle: 'Manage Categories',
          headerLeft: (props) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('AdminTabs', { screen: 'Categories' })}
              {...props}
            >
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="ManageOrders" 
        component={ManageOrders} 
        options={{ 
          title: 'Manage Orders',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <Stack.Screen 
        name="OrderHistory" 
        component={OrderHistory} 
        options={{ title: 'Order History' }} 
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetails} 
        options={{ title: 'Order Details' }} 
      />
      <Stack.Screen 
        name="Payments" 
        component={Payments} 
        options={{ title: 'Payment' }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

// Note: navigation.navigate('Admin') should be called from within a component using the useNavigation hook:
// const navigation = useNavigation();
// navigation.navigate('Admin'); 