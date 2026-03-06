import React, { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import screens
import ManageProductsScreen from '../screens/ManageProductsScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageOrders from '../screens/ManageOrders';
import AddProductScreen from '../screens/AddProductScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import OrderDetails from '../screens/OrderDetails';

const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const backAction = () => {
      // Navigate to Admin dashboard
      navigation.navigate('Admin');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'AddProduct':
              iconName = focused ? 'plus-circle' : 'plus-circle-outline';
              break;
            case 'ManageProducts':
              iconName = focused ? 'package-variant' : 'package-variant-closed';
              break;
            case 'ManageCategories':
              iconName = focused ? 'shape' : 'shape-outline';
              break;
            case 'AddCategory':
              iconName = focused ? 'folder-plus' : 'folder-plus-outline';
              break;
            case 'ManageOrders':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
          includeFontPadding: false,
          textAlign: 'center',
        
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 25 : 5,
        },
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Admin')}
            style={{ marginLeft: 15 }}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      })}
      backBehavior="none" // Prevents default back behavior
    >
      <Tab.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{
          title: 'Products',
          tabBarLabel: 'Add Product',
          unmountOnBlur: true // This will reset the screen when unfocused
        }}
      />
      <Tab.Screen 
        name="ManageProducts" 
        component={ManageProductsScreen}
        options={{
          title: 'Products',
          tabBarLabel: 'Manage Pdts',
          unmountOnBlur: true
        }}
      />
      <Tab.Screen 
        name="ManageCategories" 
        component={ManageCategoriesScreen}
        options={{
          title: 'Categories',
          tabBarLabel: 'Manage Ctgs',
          unmountOnBlur: true
        }}
      />
      <Tab.Screen 
        name="AddCategory" 
        component={AddCategoryScreen}
        options={{
          title: 'Categories',
          tabBarLabel: 'Add Ctgs',
          unmountOnBlur: true
        }}
      />
      <Tab.Screen 
        name="ManageOrders" 
        component={ManageOrders}
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          unmountOnBlur: true
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabs; 