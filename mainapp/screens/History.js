import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchOrderHistory } from '../server';
import { auth } from '../firebaseConfig';
import Toast from 'react-native-toast-message';
import { calculateDiscountedPrice } from '../utils/priceCalculations';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const History = ({ route, navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Set up real-time listener for orders
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userEmail', '==', auth.currentUser.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        // Process items to ensure image URLs are up to date
        const processedItems = data.items?.map(item => ({
          ...item,
          // Ensure image URL is always fresh
          image: item.image || item.images?.[0] || item.mediaItems?.[0]?.url || null
        })) || [];

        return {
          id: doc.id,
          ...data,
          items: processedItems,
          status: data.status || 'pending'
        };
      });
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadOrders();

    if (route.params?.newOrder) {
      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: 'Your order has been added to history'
      });
    }
  }, [route.params?.newOrder]);

  const loadOrders = async () => {
    try {
      const history = await fetchOrderHistory(auth.currentUser.uid);
      
      const processedOrders = history.map(order => {
        let orderItems = [];
        if (Array.isArray(order.items)) {
          orderItems = order.items;
        } else if (Array.isArray(order.paymentDetails?.items)) {
          orderItems = order.paymentDetails.items;
        }

        const validatedItems = orderItems.map(item => ({
          id: item.id || '',
          name: item.name || 'Unknown Item',
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          onSale: item.onSale || false,
          discount: item.discount || 0,
          image: item.image || item.images?.[0] || item.mediaItems?.[0]?.url || null
        }));

        return {
          ...order,
          items: validatedItems,
          total: order.total || validatedItems.reduce((sum, item) => 
            sum + (calculateDiscountedPrice(item) * item.quantity), 0),
          // Ensure status is 'pending' if not set
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: order.paymentMethod || 'Cash On Delivery'
        };
      });

      setOrders(processedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load order history'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#757575';
      case 'accepted': return '#2196F3';
      case 'confirmed': return '#4CAF50';
      case 'processing': return '#2196F3';
      case 'shipped': return '#FF9800';
      case 'delivered': return '#4CAF50';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const renderOrderItem = ({ item }) => {
    const discountedPrice = calculateDiscountedPrice(item);
    
    return (
      <View style={styles.orderItemContainer}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Icon name="image-off" size={24} color={COLORS.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemInfo}>
            <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{(discountedPrice * item.quantity).toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderOrder = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id?.slice(-6)}</Text>
            <Text style={styles.orderDate}>
              {item.createdAt?.toDate().toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: getStatusColor(item.status) + '20',
            borderColor: getStatusColor(item.status) + '50'
          }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.itemsContainer}>
          {item.items.map((orderItem, index) => (
            <View key={index}>
              {renderOrderItem({ item: orderItem })}
            </View>
          ))}
        </View>

        {item.deliveryAddress && (
          <View style={styles.addressInfo}>
            <Icon name="map-marker" size={18} color={COLORS.primary} />
            <Text style={styles.addressText} numberOfLines={1}>
              Delivering to: {item.deliveryAddress.city}, {item.deliveryAddress.state}
            </Text>
          </View>
        )}

        <View style={styles.orderFooter}>
          <View style={styles.paymentMethod}>
            <Icon 
              name={item.paymentMethod === 'Cash On Delivery' ? 'cash' : 'credit-card'} 
              size={18} 
              color={COLORS.primary}
            />
            <Text style={styles.paymentMethodText}>
              {item.paymentMethod}
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.orderTotal}>
                ₹{(item.total || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading your orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="shopping" size={80} color={COLORS.border} />
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={[styles.emptyText, { fontSize: SIZES.small, marginTop: 8 }]}>
          Your order history will appear here
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            progressBackgroundColor={COLORS.backgroundCard}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: COLORS.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsContainer: {
    padding: 18,
    backgroundColor: COLORS.backgroundCard,
  },
  orderItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: SIZES.radiusMedium,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 6,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: COLORS.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  totalContainer: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  totalLabel: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderTotal: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: SIZES.h4,
    fontWeight: '500',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  addressText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
});

export default History; 