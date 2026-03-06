// screens/AdminPanel.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  BackHandler,
  LogBox
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

// Ignore the specific navigation warning
LogBox.ignoreLogs(['The action \'NAVIGATE\' with payload']);

const AdminScreen = () => {
  const navigation = useNavigation();

  const goToMoreScreen = () => {
    // First go back to the root navigator
    navigation.popToTop();
    
    // Then navigate to MainTabs with More tab
    navigation.navigate('More', {
      screen: 'More'
    });
  };

  // Set up header back button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={goToMoreScreen}
          style={{ marginLeft: 15 }}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      goToMoreScreen();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  const adminMenuItems = [
    {
      title: 'Dashboard',
      subtitle: 'View sales analytics',
      icon: 'view-dashboard',
      onPress: () => navigation.navigate('AdminTabs', { screen: 'Dashboard' }),
      colors: [COLORS.primary, COLORS.primaryLight]
    },
    {
      title: 'Manage Orders',
      subtitle: 'View and manage all orders',
      icon: 'calendar',
      onPress: () => navigation.navigate('AdminTabs', { screen: 'ManageOrders' }),
      colors: ['#E91E63', '#F06292']
    },
    {
      title: 'Add Product',
      subtitle: 'Add new products to your store',
      icon: 'plus',
      onPress: () => navigation.navigate('AdminTabs', { screen: 'AddProduct' }),
      colors: [COLORS.success, '#66bb6a']
    },
    {
      title: 'Add Category',
      subtitle: 'Create new product categories',
      icon: 'plus',
      onPress: () => navigation.navigate('AdminTabs', { screen: 'AddCategory' }),
      colors: ['#2196F3', '#64B5F6']
    },
    {
      title: 'Manage Products',
      subtitle: 'Edit or remove existing products',
      icon: 'package-variant',
      onPress: () => navigation.navigate('AdminTabs', { screen: 'ManageProducts' }),
      colors: ['#FF9800', '#FFB74D']
    },
    {
      title: 'Manage Categories',
      subtitle: 'Edit or remove categories',
      icon: 'shape',
      onPress: () => navigation.navigate('AdminTabs', { screen: 'ManageCategories' }),
      colors: ['#9C27B0', '#BA68C8']
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <Icon name="shield-account" size={48} color={COLORS.white} />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage The Apex Store</Text>
      </LinearGradient>
      
      <View style={styles.gridContainer}>
        {adminMenuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={item.onPress}
          >
            <LinearGradient
              colors={item.colors}
              style={styles.cardGradient}
            >
              <Icon name={item.icon} size={32} color={COLORS.white} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginTop: 8,
    opacity: 0.9,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: SIZES.radius,
    marginBottom: 20,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    marginTop: 12,
  },
  cardSubtitle: {
    color: COLORS.white,
    fontSize: SIZES.small,
    marginTop: 6,
    opacity: 0.9,
  }
});

export default AdminScreen;