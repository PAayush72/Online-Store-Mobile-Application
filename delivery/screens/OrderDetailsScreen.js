import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [deliveryPerson, setDeliveryPerson] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        // Fetch delivery person details
        if (orderData.deliveryPersonId) {
          const deliveryPersonDoc = await getDoc(doc(db, 'users', orderData.deliveryPersonId));
          if (deliveryPersonDoc.exists()) {
            setDeliveryPerson(deliveryPersonDoc.data());
          }
        }

        // Fetch customer details
        if (orderData.userId) {
          const customerDoc = await getDoc(doc(db, 'users', orderData.userId));
          if (customerDoc.exists()) {
            setCustomer(customerDoc.data());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const calculateDeliveryFee = () => {
    // Calculate delivery partner's cut (e.g., 10% of delivery fee or fixed amount)
    const deliveryFee = order?.deliveryFee || 40;
    const partnerCut = deliveryFee * 0.8; // 80% goes to delivery partner
    return { deliveryFee, partnerCut };
  };

  const generateReceipt = async () => {
    if (!order) return;

    const { deliveryFee, partnerCut } = calculateDeliveryFee();
    const deliveryAddress = order.deliveryAddress || {};
    const customerName = deliveryAddress.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
          .header h1 { color: #4CAF50; margin: 0; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .label { font-weight: 600; color: #666; }
          .value { color: #333; }
          .highlight { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .highlight .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
          .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Delivery Receipt</h1>
          <p>Order #${order.id.slice(-8).toUpperCase()}</p>
        </div>

        <div class="section">
          <div class="section-title">Delivery Partner Information</div>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${deliveryPerson?.firstName || ''} ${deliveryPerson?.lastName || ''}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">${deliveryPerson?.phoneNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${deliveryPerson?.email || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${customerName}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">${deliveryAddress.phoneNumber || order.phoneNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${order.userEmail || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Address:</span>
            <span class="value">${deliveryAddress.apartment || ''}, ${deliveryAddress.area || ''}, ${deliveryAddress.city || ''}, ${deliveryAddress.state || ''} - ${deliveryAddress.pincode || ''}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Order Items</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${item.name || 'N/A'}</td>
                  <td>${item.quantity || 1}</td>
                  <td>₹${item.price || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Order Summary</div>
          <div class="info-row">
            <span class="label">Subtotal:</span>
            <span class="value">₹${order.subtotal || 0}</span>
          </div>
          <div class="info-row">
            <span class="label">Delivery Fee:</span>
            <span class="value">₹${deliveryFee}</span>
          </div>
          <div class="info-row">
            <span class="label">Total Amount:</span>
            <span class="value"><strong>₹${order.total || 0}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Payment Method:</span>
            <span class="value">${order.paymentMethod || 'N/A'}</span>
          </div>
        </div>

        <div class="highlight">
          <div class="info-row">
            <span class="label">Delivery Partner Earnings:</span>
            <span class="amount">₹${partnerCut.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Timeline</div>
          <div class="info-row">
            <span class="label">Order Created:</span>
            <span class="value">${formatDate(order.createdAt)}</span>
          </div>
          <div class="info-row">
            <span class="label">Order Accepted:</span>
            <span class="value">${formatDate(order.acceptedAt)}</span>
          </div>
          <div class="info-row">
            <span class="label">Order Delivered:</span>
            <span class="value">${formatDate(order.deliveredAt)}</span>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer-generated receipt</p>
          <p>Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
      Alert.alert('Success', 'Receipt generated successfully!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const deliveryAddress = order.deliveryAddress || {};
  const customerName = deliveryAddress.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim();
  const { deliveryFee, partnerCut } = calculateDeliveryFee();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <Icon name="package-variant-closed" size={40} color={COLORS.white} />
        <Text style={styles.headerTitle}>Order Details</Text>
        <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
      </LinearGradient>

      {/* Delivery Partner Info */}
      <View style={styles.section}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.sectionGradient}
        >
          <View style={styles.sectionHeader}>
            <Icon name="truck-delivery" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Delivered By</Text>
          </View>
          {deliveryPerson ? (
            <>
              <Text style={styles.infoText}>Name: {deliveryPerson.firstName} {deliveryPerson.lastName}</Text>
              <Text style={styles.infoText}>Phone: {deliveryPerson.phoneNumber}</Text>
              <Text style={styles.infoText}>Email: {deliveryPerson.email}</Text>
            </>
          ) : (
            <Text style={styles.infoText}>Delivery partner information not available</Text>
          )}
        </LinearGradient>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Customer Details</Text>
        <Text style={styles.infoText}>Name: {customerName}</Text>
        <Text style={styles.infoText}>Phone: {deliveryAddress.phoneNumber || order.phoneNumber || 'N/A'}</Text>
        <Text style={styles.infoText}>Email: {order.userEmail || 'N/A'}</Text>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
        <Text style={styles.addressText}>
          {deliveryAddress.apartment}, {deliveryAddress.area}
        </Text>
        <Text style={styles.addressText}>
          {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
        </Text>
        {deliveryAddress.landmark && (
          <Text style={styles.landmarkText}>Landmark: {deliveryAddress.landmark}</Text>
        )}
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Order Items</Text>
        {(order.items || []).map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
        ))}
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Payment Details</Text>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>Subtotal:</Text>
          <Text style={styles.value}>₹{order.subtotal || 0}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>Delivery Fee:</Text>
          <Text style={styles.value}>₹{deliveryFee}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.labelBold}>Total:</Text>
          <Text style={styles.valueBold}>₹{order.total}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{order.paymentMethod}</Text>
        </View>
      </View>

      {/* Delivery Partner Earnings */}
      <View style={styles.earningsSection}>
        <LinearGradient
          colors={[COLORS.success, '#66bb6a']}
          style={styles.earningsGradient}
        >
          <Icon name="currency-inr" size={32} color={COLORS.white} />
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsAmount}>₹{partnerCut.toFixed(2)}</Text>
          <Text style={styles.earningsNote}>
            (80% of delivery fee: ₹{deliveryFee})
          </Text>
        </LinearGradient>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Timeline</Text>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Order Created:</Text>
          <Text style={styles.timelineValue}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Order Accepted:</Text>
          <Text style={styles.timelineValue}>{formatDate(order.acceptedAt)}</Text>
        </View>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Order Delivered:</Text>
          <Text style={styles.timelineValue}>{formatDate(order.deliveredAt)}</Text>
        </View>
      </View>

      {/* Download Receipt Button */}
      <TouchableOpacity style={styles.downloadButton} onPress={generateReceipt}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.downloadGradient}
        >
          <Icon name="download" size={24} color={COLORS.white} />
          <Text style={styles.downloadButtonText}>Download Receipt</Text>
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
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
  },
  orderId: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginTop: 5,
  },
  section: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  sectionGradient: {
    padding: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  infoText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 5,
    lineHeight: 20,
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
    marginTop: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
  },
  itemQty: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
  },
  labelBold: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  valueBold: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  earningsSection: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  earningsGradient: {
    padding: 20,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginBottom: 5,
    marginTop: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  earningsNote: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  timelineValue: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
  },
  downloadButton: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  downloadGradient: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
});

export default OrderDetailsScreen;
