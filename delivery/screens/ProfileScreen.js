import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    pendingDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchDeliveryStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({ id: user.uid, ...userDoc.data() });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const ordersRef = collection(db, 'orders');
      
      // Get completed deliveries
      const completedQuery = query(
        ordersRef,
        where('deliveryPersonId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const completedSnapshot = await getDocs(completedQuery);
      
      let totalEarnings = 0;
      completedSnapshot.forEach((doc) => {
        const order = doc.data();
        const deliveryFee = order.deliveryFee || 40;
        const partnerCut = deliveryFee * 0.8; // 80% of delivery fee
        totalEarnings += partnerCut;
      });

      // Get pending deliveries
      const pendingQuery = query(
        ordersRef,
        where('deliveryPersonId', '==', user.uid),
        where('status', '==', 'accepted')
      );
      const pendingSnapshot = await getDocs(pendingQuery);

      setStats({
        totalDeliveries: completedSnapshot.size,
        totalEarnings: totalEarnings.toFixed(2),
        pendingDeliveries: pendingSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
  const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          {userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primary]}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          )}
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{userData.email}</Text>
        <View style={styles.badge}>
          <Icon name="truck-delivery" size={16} color={COLORS.white} />
          <Text style={styles.badgeText}>Delivery Partner</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.statsGradient}
        >
          <View style={styles.statCard}>
            <Icon name="package-variant-closed" size={32} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="currency-inr" size={32} color={COLORS.success} />
            <Text style={styles.statNumber}>₹{stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="clock-outline" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.pendingDeliveries}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.sectionGradient}
        >
          <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoRow}>
          <Icon name="account" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{fullName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="email" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{userData.phoneNumber || 'Not provided'}</Text>
          </View>
        </View>
        </LinearGradient>
      </View>

      {/* Address Information */}
      {userData.addresses && userData.addresses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          {userData.addresses.map((address, index) => (
            <View key={index} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Icon name="map-marker" size={20} color="#4CAF50" />
                <Text style={styles.addressType}>{address.type || 'Home'}</Text>
              </View>
              <Text style={styles.addressText}>
                {address.apartment}, {address.area}
              </Text>
              <Text style={styles.addressText}>
                {address.city}, {address.state} - {address.pincode}
              </Text>
              {address.landmark && (
                <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="lock-reset" size={24} color="#666" />
          <Text style={styles.actionText}>Change Password</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help-circle" size={24} color="#666" />
          <Text style={styles.actionText}>Help & Support</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="information" size={24} color="#666" />
          <Text style={styles.actionText}>About</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LinearGradient
          colors={[COLORS.error, '#ff6b6b']}
          style={styles.logoutGradient}
        >
          <Icon name="logout" size={24} color={COLORS.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  name: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  email: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 5,
  },
  badgeText: {
    color: COLORS.white,
    marginLeft: 5,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: -20,
    marginHorizontal: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  statsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 5,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginTop: 15,
    marginHorizontal: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  sectionGradient: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  addressCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: SIZES.radius,
    marginBottom: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressType: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  addressText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 15,
  },
  logoutButton: {
    marginHorizontal: SIZES.margin,
    marginTop: 20,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  logoutGradient: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bottomPadding: {
    height: 30,
  },
});

export default ProfileScreen;
