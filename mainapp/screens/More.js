import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../firebaseConfig';
import { getUserData } from '../server';
import Toast from 'react-native-toast-message';
import { signOut } from 'firebase/auth';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const More = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUserName();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const user = auth.currentUser;
    if (user && (user.email === 'deevpatel223@gmail.com' || user.email === 'n@gmail.com')) {
      setIsAdmin(true);
    }
  };

  const fetchUserName = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) {
          const fullName = `${userData.firstName} ${userData.lastName}`;
          setUserName(fullName);
          setUserInitials(
            `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`
          );
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error logging out',
        text2: error.message
      });
    }
  };

  const menuItems = [
    {
      title: 'Account Details',
      icon: 'account-circle',
      onPress: () => navigation.navigate('AccountDetails')
    },
    {
      title: 'Address Book',
      icon: 'book-open',
      onPress: () => navigation.navigate('AddressBook')
    },
    {
      title: 'About Us',
      icon: 'information',
      onPress: () => navigation.navigate('AboutUs')
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => navigation.navigate('Support')
    },
    ...(isAdmin ? [{
      title: 'Admin Panel',
      icon: 'shield-account',
      onPress: () => {
        navigation.navigate('Admin');
      },
      color: 'green'
    }] : []),
    {
      title: 'Logout',
      icon: 'logout',
      onPress: handleLogout,
      color: 'red'
    }
  ];

  const renderMenuItem = ({ title, icon, onPress, color }, index) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={onPress}
    >
      <LinearGradient
        colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
        style={styles.menuItemGradient}
      >
        <View style={styles.menuItemContent}>
          <Icon 
            name={icon} 
            size={24} 
            color={color === 'red' ? COLORS.error : color === 'green' ? COLORS.success : COLORS.primary} 
          />
          <Text style={[
            styles.menuItemText, 
            { color: color === 'red' ? COLORS.error : COLORS.textPrimary }
          ]}>
            {title}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.headerGradient}
        >
          <View style={styles.profileSection}>
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primary]}
              style={styles.profileIcon}
            >
              <Text style={styles.initials}>{userInitials || '?'}</Text>
            </LinearGradient>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userName || 'Loading...'}
              </Text>
              <Text style={styles.userEmail}>
                {auth.currentUser?.email || ''}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => renderMenuItem(item, index))}
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
    marginBottom: 20,
  },
  headerGradient: {
    padding: 30,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  initials: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.9,
  },
  menuContainer: {
    paddingHorizontal: SIZES.margin,
  },
  menuItem: {
    marginBottom: 12,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: SIZES.body,
    marginLeft: 16,
    fontWeight: '500',
  }
});

export default More; 