import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Switch, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
  const [newOrders, setNewOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new');
  const [paymentStatus, setPaymentStatus] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require('../assets/theapexlogo.png')}
          style={styles.headerLogo}
        />
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Icon name="account-circle" size={32} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchOrders = () => {
    const ordersRef = collection(db, 'orders');
    
    const newOrdersQuery = query(ordersRef, where('status', '==', 'pending'));
    onSnapshot(newOrdersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        console.log('New Order Data:', orderData);
        orders.push(orderData);
      });
      setNewOrders(orders);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });

    const acceptedOrdersQuery = query(ordersRef, where('status', '==', 'accepted'));
    onSnapshot(acceptedOrdersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        console.log('Accepted Order Data:', orderData);
        orders.push(orderData);
      });
      setAcceptedOrders(orders);
    }, (error) => {
      console.error("Error fetching accepted orders:", error);
    });

    const completedOrdersQuery = query(
      ordersRef, 
      where('status', '==', 'completed')
    );
    onSnapshot(completedOrdersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        orders.push(orderData);
      });
      setCompletedOrders(orders);
    }, (error) => {
      console.error("Error fetching completed orders:", error);
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'accepted',
        deliveryPersonId: auth.currentUser.uid,
        acceptedAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Order accepted successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeliverOrder = async (orderId, isCOD, paymentReceived) => {
    try {
      if (isCOD && !paymentReceived) {
        Alert.alert('Payment Required', 'Please confirm payment receipt for COD order');
        return;
      }

      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        status: 'completed',
        deliveredAt: serverTimestamp(),
      };

      if (isCOD) {
        updateData.paymentStatus = 'paid';
        updateData.paymentReceivedAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);
      Alert.alert('Success', 'Order marked as delivered!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePaymentReceived = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'paid',
        paymentReceivedAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Payment status updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status: ' + error.message);
    }
  };

  const handlePaymentStatusChange = (orderId, value) => {
    setPaymentStatus(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  const renderNewOrder = ({ item }) => {
    console.log('Rendering New Order:', item);
    const deliveryAddress = item.deliveryAddress || {};
    const customerName = deliveryAddress.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A';
    const customerPhone = deliveryAddress.phoneNumber || item.phoneNumber || 'N/A';
    const address = deliveryAddress.apartment 
      ? `${deliveryAddress.apartment}, ${deliveryAddress.area}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
      : 'Address not available';
    
    return (
      <View style={styles.orderCard}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.orderCardGradient}
        >
          <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Customer Details:</Text>
            <Text style={styles.infoText}>👤 {customerName}</Text>
            <Text style={styles.infoText}>📞 {customerPhone}</Text>
            <Text style={styles.infoText}>📧 {item.userEmail || 'N/A'}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Delivery Address:</Text>
            <Text style={styles.addressText}>{address}</Text>
            {deliveryAddress.landmark && (
              <Text style={styles.landmarkText}>📍 Landmark: {deliveryAddress.landmark}</Text>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Order Details:</Text>
            <Text style={styles.infoText}>💳 {item.paymentMethod}</Text>
            <Text style={styles.totalText}>Total: ₹{item.total || 'N/A'}</Text>
          </View>

          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(item.id)}
          >
            <LinearGradient
              colors={[COLORS.success, '#66bb6a']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Accept Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderAcceptedOrder = ({ item }) => {
    const isCOD = item.paymentMethod === 'Cash On Delivery';
    const isPaymentReceived = item.paymentStatus === 'paid';
    const deliveryAddress = item.deliveryAddress || {};
    const customerName = deliveryAddress.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A';
    const customerPhone = deliveryAddress.phoneNumber || item.phoneNumber || 'N/A';
    const address = deliveryAddress.apartment 
      ? `${deliveryAddress.apartment}, ${deliveryAddress.area}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
      : 'Address not available';

    return (
      <View style={styles.orderCard}>
        <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Customer Details:</Text>
          <Text style={styles.infoText}>👤 {customerName}</Text>
          <Text style={styles.infoText}>📞 {customerPhone}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Delivery Address:</Text>
          <Text style={styles.addressText}>{address}</Text>
          {deliveryAddress.landmark && (
            <Text style={styles.landmarkText}>📍 Landmark: {deliveryAddress.landmark}</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Payment:</Text>
          <Text style={styles.infoText}>💳 {item.paymentMethod}</Text>
          <Text style={styles.totalText}>Total: ₹{item.total}</Text>
        </View>
        
        {isCOD && (
          <View style={styles.paymentRow}>
            <Text style={styles.paymentStatusText}>
              Payment: {isPaymentReceived ? '✅ Paid' : '⏳ Pending'}
            </Text>
            {!isPaymentReceived && (
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={() => handlePaymentReceived(item.id)}
              >
                <Text style={styles.buttonText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.deliverButton,
            (isCOD && !isPaymentReceived) && styles.deliverButtonDisabled
          ]}
          onPress={() => handleDeliverOrder(item.id, isCOD, isPaymentReceived)}
          disabled={isCOD && !isPaymentReceived}
        >
          <Text style={styles.buttonText}>
            ✓ Mark as Delivered
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCompletedOrder = ({ item }) => {
    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      return format(timestamp.toDate(), 'MMM dd, yyyy HH:mm');
    };

    const deliveryAddress = item.deliveryAddress || {};
    const customerName = deliveryAddress.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A';

    return (
      <TouchableOpacity 
        style={styles.completedOrderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.completedOrderHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
          <Text style={styles.totalAmount}>₹{item.total}</Text>
        </View>
        
        <Text style={styles.customerNameSmall}>Customer: {customerName}</Text>
        <Text style={styles.deliveredDate}>Delivered: {formatDate(item.deliveredAt)}</Text>
        
        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Full Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          {activeTab === 'new' ? (
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.activeTabGradient}
            >
              <Text style={styles.activeTabText}>New Orders</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.tabText}>New Orders</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          {activeTab === 'accepted' ? (
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.activeTabGradient}
            >
              <Text style={styles.activeTabText}>Accepted</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.tabText}>Accepted</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          {activeTab === 'completed' ? (
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.activeTabGradient}
            >
              <Text style={styles.activeTabText}>Past Orders</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.tabText}>Past Orders</Text>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'new' && (
        <View style={styles.section}>
          <FlatList
            data={newOrders}
            renderItem={renderNewOrder}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
            }
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No new orders available</Text>
            )}
          />
        </View>
      )}

      {activeTab === 'accepted' && (
        <View style={styles.section}>
          <FlatList
            data={acceptedOrders}
            renderItem={renderAcceptedOrder}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
            }
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No accepted orders</Text>
            )}
          />
        </View>
      )}

      {activeTab === 'completed' && (
        <View style={styles.section}>
          <FlatList
            data={completedOrders}
            renderItem={renderCompletedOrder}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
            }
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No completed orders</Text>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  section: {
    flex: 1,
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 16,
    padding: SIZES.padding,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.large,
  },
  orderCardGradient: {
    padding: SIZES.padding,
  },
  orderId: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: SIZES.h4,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  infoSection: {
    marginBottom: 16,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: SIZES.radiusSmall,
  },
  sectionLabel: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  totalText: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 8,
  },
  acceptButton: {
    marginTop: 16,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  deliverButton: {
    marginTop: 16,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    backgroundColor: COLORS.success,
    ...SHADOWS.medium,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  deliverButtonDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.textSecondary,
  },
  buttonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: SIZES.h5,
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSmall,
  },
  paymentStatusText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  paymentButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius,
    padding: 5,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: SIZES.radius - 2,
    overflow: 'hidden',
  },
  activeTab: {
    overflow: 'hidden',
  },
  activeTabGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  tabText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    paddingVertical: 10,
  },
  activeTabText: {
    fontSize: SIZES.body,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerLogo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
  },
  profileButton: {
    marginRight: 10,
  },
  completedOrderCard: {
    borderRadius: SIZES.radius,
    marginBottom: 12,
    padding: SIZES.padding,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.small,
  },
  completedOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  customerNameSmall: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  deliveredDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  viewDetailsButton: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetailsText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginRight: 10,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 10,
    marginLeft: -6,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timelineDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerLogo: {
    width: 180,
    height: 50,
    resizeMode: 'contain',
  },
  profileButton: {
    marginRight: 15,
    padding: 5,
  },
  infoSection: {
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 4,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  completedOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerNameSmall: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  deliveredDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  viewDetailsButton: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetailsText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen; 