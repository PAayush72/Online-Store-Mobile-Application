import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, PermissionsAndroid, Platform, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { calculateDiscountedPrice, calculateOrderTotal } from '../utils/priceCalculations';

// Import your specific logo
import Logo from '../assets/thapa_store.png';

const OrderDetails = ({ route }) => {
  const { order } = route.params;
  const [orderData, setOrderData] = useState({
    ...order,
    // Ensure status is 'pending' if not set
    status: order.status || 'pending'
  });
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [userData, setUserData] = useState(null);

  // Update real-time listener to ensure status
  useEffect(() => {
    const orderRef = doc(db, 'orders', order.id);
    const unsubscribe = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Process items to ensure image URLs are up to date
        const processedItems = data.items?.map(item => ({
          ...item,
          // Ensure image URL is always fresh
          image: item.image || item.images?.[0] || item.mediaItems?.[0]?.url || null,
          mainImage: item.image || item.images?.[0] || item.mediaItems?.[0]?.url || null
        })) || [];

        const updatedOrder = { 
          id: snapshot.id, 
          ...data,
          items: processedItems,
          status: data.status || 'pending'
        };
        setOrderData(updatedOrder);
      }
    });

    return () => unsubscribe();
  }, [order.id]);

  // Fetch default address when component mounts
  useEffect(() => {
    const fetchUserDataAndAddress = async () => {
      try {
        const user = auth.currentUser;
        const userRef = doc(db, 'users', order.userId); // Use order.userId instead of querying by email
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          console.log("Found user data:", userData);

          // Find the default address from user's addresses
          if (userData.addresses && Array.isArray(userData.addresses)) {
            const defaultAddr = userData.addresses.find(addr => addr.isDefault === true);
            if (defaultAddr) {
              console.log("Found default address:", defaultAddr);
              setDefaultAddress(defaultAddr);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch user details'
        });
      }
    };

    if (order.userId) {
      fetchUserDataAndAddress();
    }
  }, [order.userId]);

  console.log("Full order data:", order); // Debug log

  // Get items from the order data
  const orderItems = order?.items || [];
  const { subtotal, deliveryFee, cgst, sgst, total: orderTotal } = calculateOrderTotal(orderItems);
  console.log("Order items:", orderItems); // Debug log

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#757575';
      case 'accepted': return '#2196F3';
      case 'confirmed': return '#4A90E2';
      case 'processing': return '#2196F3';
      case 'shipped': return '#FF9800';
      case 'delivered': return '#4A90E2';
      case 'completed': return '#4A90E2';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp.toDate()).toLocaleString();
    } catch (error) {
      return new Date().toLocaleString();
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'Cash On Delivery':
        return 'Cash On Delivery';
      case 'razorpay':
        return 'Online Payment';
      default:
        return method || 'N/A';
    }
  };

  const generatePDF = async () => {
    try {
      const logoPath = Image.resolveAssetSource(Logo).uri;
      let logoBase64;
      
      // Get customer details from userData
      const customerName = userData ? 
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 
        'Valued Customer';

      const customerEmail = userData?.email || order.userEmail || '';
      const customerPhone = userData?.phoneNumber || '';
      
      // Get delivery address from order data first, fallback to default address
      const deliveryAddress = order.deliveryAddress || defaultAddress || {
        streetAddress: userData?.streetAddress || '',
        apartment: userData?.apartment || '',
        area: userData?.area || '',
        landmark: userData?.landmark || '',
        city: userData?.city || '',
        state: userData?.state || '',
        pincode: userData?.pincode || ''
      };

      console.log("Generating PDF with:", { customerName, customerEmail, customerPhone, deliveryAddress });

      if (Platform.OS === 'web') {
        logoBase64 = logoPath;
      } else {
        const response = await fetch(logoPath);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        logoBase64 = base64;
      }

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <!-- Header with Left-aligned Logo -->
            <div style="background-color: #4A90E2; padding: 20px;">
              <img src="${logoBase64}" alt="The Apex Store" style="width: 200px; height: auto; display: block;"/>
            </div>

            <!-- Invoice Title -->
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #333;">INVOICE</h1>
            </div>

            <div style="padding: 0 20px 20px 20px;">
              <!-- Customer and Delivery Details in Two Columns -->
              <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <!-- Billing Details -->
                <div style="flex: 1; margin-right: 20px;">
                  <h3 style="color: #4A90E2; margin-bottom: 10px;">Billing Details</h3>
                  <p style="font-weight: bold; margin-bottom: 5px;">To,</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 500;">${customerName}</p>
                  <p style="margin: 5px 0; color: #666; line-height: 1.5;">
                    ${customerEmail}<br/>
                    ${customerPhone ? `Phone: ${customerPhone}` : ''}
                  </p>
                </div>

                <!-- Delivery Address -->
                <div style="flex: 1;">
                  <h3 style="color: #4A90E2; margin-bottom: 10px;">Delivery Address</h3>
                  <p style="margin: 0; font-size: 16px; font-weight: 500;">
                    ${deliveryAddress.type ? `${deliveryAddress.type}` : ''}
                  </p>
                  <p style="margin: 5px 0; color: #666; line-height: 1.5;">
                    ${deliveryAddress.apartment ? `${deliveryAddress.apartment}, ` : ''}
                    ${deliveryAddress.area ? `${deliveryAddress.area}` : ''}<br/>
                    ${deliveryAddress.landmark ? `Near ${deliveryAddress.landmark},<br/>` : ''}
                    ${deliveryAddress.city ? `${deliveryAddress.city}, ` : ''}
                    ${deliveryAddress.state ? `${deliveryAddress.state} ` : ''}
                    ${deliveryAddress.pincode ? `- ${deliveryAddress.pincode}` : ''}
                  </p>
                </div>
              </div>

              <!-- Order Details -->
              <div style="margin-bottom: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="margin: 5px 0;">Order: #${order.id?.slice(-6) || 'N/A'}</p>
                <p style="margin: 5px 0;">Date: ${formatDate(order.createdAt)}</p>
                <p style="margin: 5px 0;">Payment Method: ${getPaymentMethodText(order.paymentMethod)}</p>
                <p style="margin: 5px 0;">Payment Status: ${order.paymentStatus || 'Pending'}</p>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
                ${orderItems.map(item => {
                  const originalPrice = item.price;
                  const discountedPrice = calculateDiscountedPrice(item);
                  const itemTotal = discountedPrice * item.quantity;

                  return `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                        ${item.onSale 
                          ? `<span style="text-decoration: line-through; color: #666;">₹${originalPrice.toFixed(2)}</span>
                             <br/>₹${discountedPrice.toFixed(2)}`
                          : `₹${originalPrice.toFixed(2)}`}
                      </td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${itemTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </table>

              <!-- Price Summary -->
              <div style="margin-top: 20px; margin-left: auto; width: 300px;">
                <p style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>Subtotal:</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>Delivery Fee:</span>
                  <span>₹${deliveryFee.toFixed(2)}</span>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>CGST (9%):</span>
                  <span>₹${cgst.toFixed(2)}</span>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 5px 0;">
                  <span>SGST (9%):</span>
                  <span>₹${sgst.toFixed(2)}</span>
                </p>
                <p style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #eee;">
                  <span>Total:</span>
                  <span>₹${orderTotal.toFixed(2)}</span>
                </p>
              </div>

              <!-- Thank You Message -->
              <div style="text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 16px; color: #4A90E2; margin: 0;">
                  Thank you for shopping with <strong>The Apex Store</strong>, ${customerName}!
                </p>
                <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">
                  We look forward to serving you again!
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const downloadPath = FileSystem.documentDirectory + `Invoice_${order.id?.slice(-6)}.pdf`;
        await FileSystem.moveAsync({
          from: uri,
          to: downloadPath
        });
        await Sharing.shareAsync(downloadPath);
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invoice generated successfully'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to generate invoice'
      });
    }
  };

  // Add this debug useEffect to check userData when it changes
  useEffect(() => {
    console.log("userData updated:", userData);
  }, [userData]);

  const renderOrderItems = (items) => {
    return items.map((item, index) => {
      const originalPrice = item.price;
      const discountedPrice = calculateDiscountedPrice(item);
      const itemTotal = discountedPrice * item.quantity;
      const imageUrl = item.image || item.mainImage;

      return (
        <View key={index} style={styles.itemCard}>
          <Image 
            source={imageUrl ? { uri: imageUrl } : require('../assets/placeholder.png')}
            style={styles.itemImage}
            defaultSource={require('../assets/placeholder.png')}
            resizeMode="cover"
          />
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                <View style={styles.priceRow}>
                  {item.onSale && item.discount ? (
                    <>
                      <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                      <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
                      <Text style={styles.discountBadge}>{item.discount}% OFF</Text>
                    </>
                  ) : (
                    <Text style={styles.itemUnitPrice}>₹{originalPrice.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            </View>
            <Text style={styles.itemTotal}>Total: ₹{itemTotal.toFixed(2)}</Text>
          </View>
        </View>
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.card}>
        <Text style={styles.orderId}>Order #{order.id?.slice(-6) || 'N/A'}</Text>
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        
        <View style={styles.statusSection}>
          <View style={styles.statusBadge}>
            <Icon name="truck-delivery" size={20} color={getStatusColor(order.status)} />
            <Text style={[styles.status, { color: getStatusColor(order.status) }]}>
              {order.status || 'Processing'}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>{getPaymentMethodText(order.paymentMethod)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status:</Text>
            <Text style={[
              styles.paymentStatus, 
              { color: order.paymentStatus?.toLowerCase() === 'paid' ? '#4A90E2' : '#f44336' }
            ]}>
              {order.paymentStatus || 'Pending'}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {order.deliveryAddress && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressType}>{order.deliveryAddress.type}</Text>
              <Text style={styles.addressText}>{order.deliveryAddress.apartment}</Text>
              <Text style={styles.addressText}>{order.deliveryAddress.area}</Text>
              {order.deliveryAddress.landmark && (
                <Text style={styles.addressText}>Landmark: {order.deliveryAddress.landmark}</Text>
              )}
              <Text style={styles.addressText}>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </Text>
            </View>
          )}
        </View>

        {/* Print Bill Button */}
        <TouchableOpacity style={styles.printButton} onPress={generatePDF}>
          <Icon name="file-pdf-box" size={24} color="white" />
          <Text style={styles.printButtonText}>Download Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Order Summary */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.orderItemsContainer}>
          {renderOrderItems(orderItems)}
        </View>
        
        <View style={styles.summaryContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal</Text>
            <Text style={styles.detailValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Fee</Text>
            <Text style={styles.detailValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CGST (9%)</Text>
            <Text style={styles.detailValue}>₹{cgst.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SGST (9%)</Text>
            <Text style={styles.detailValue}>₹{sgst.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{orderTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  card: {
    backgroundColor: 'white',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    color: '#666',
    marginTop: 5,
  },
  statusSection: {
    marginTop: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  status: {
    marginLeft: 5,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  orderItemsContainer: {
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
    color: '#999',
  },
  discountedPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
  },
  discountBadge: {
    backgroundColor: '#ffebee',
    color: '#f44336',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '500',
  },
  itemUnitPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  printButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  paymentInfo: {
    marginTop: 15,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 15,
  },
  addressContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addressType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

export default OrderDetails; 