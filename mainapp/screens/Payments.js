import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useCart } from '../context/CartContext';
import { auth } from '../firebaseConfig';
import { createOrderInDatabase, updateProductStock } from '../server';
import RazorpayCheckout from '../components/RazorpayCheckout';
import { calculateOrderTotal } from '../utils/priceCalculations';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Payments = ({ route, navigation }) => {
  const { items = [] } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const { clearCart } = useCart();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const paymentMethods = [
    { id: 'Cash On Delivery', name: 'Cash On Delivery', icon: 'cash' },
    { id: 'razorpay', name: 'Pay Online', icon: 'credit-card' }
  ];

  useEffect(() => {
    fetchUserAddresses(true);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh addresses when screen comes into focus
      fetchUserAddresses();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchUserAddresses = async (isInitialLoad = false) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.addresses && Array.isArray(userData.addresses)) {
          setAddresses(userData.addresses);
          if (isInitialLoad && !selectedAddress) {
            const defaultAddress = userData.addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddress(defaultAddress);
            }
          }
        }
      }
      if (isInitialLoad) {
        setInitialLoadDone(true);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: 'error',
        text1: 'Error fetching addresses',
        text2: error.message
      });
    }
  };

  const validateStockLevels = () => {
    const invalidItems = items.filter(item => item.quantity > item.stock);
    
    if (invalidItems.length > 0) {
      const itemMessages = invalidItems.map(item => 
        `${item.name} (Available: ${item.stock}, In cart: ${item.quantity})`
      );
      
      Toast.show({
        type: 'error',
        text1: 'Stock Limit Exceeded',
        text2: 'Some items exceed available stock. Please return to cart and adjust quantities.'
      });
      return false;
    }
    return true;
  };

  const handlePayment = () => {
    if (!selectedAddress) {
      Toast.show({
        type: 'error',
        text1: 'Select Address',
        text2: 'Please select a delivery address to continue'
      });
      return;
    }

    if (!selectedMethod) {
      Toast.show({
        type: 'error',
        text1: 'Select Payment Method',
        text2: 'Please select a payment method to continue'
      });
      return;
    }

    if (!validateStockLevels()) {
      return;
    }

    if (selectedMethod === 'razorpay') {
      initializePayment();
    } else if (selectedMethod === 'Cash On Delivery') {
      handleCOD();
    }
  };

  const handleCOD = async () => {
    try {
      if (!validateStockLevels()) {
        return;
      }

      setLoading(true);
      const user = auth.currentUser;
      
      // Check stock levels one final time before updating
      for (const item of items) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock;
          if (currentStock < item.quantity) {
            Toast.show({
              type: 'error',
              text1: 'Stock Changed',
              text2: `Sorry, ${item.name} stock has changed. Please return to cart.`
            });
            return;
          }
        }
      }
      
      const { subtotal, deliveryFee, cgst, sgst, total } = calculateOrderTotal(items);
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Create delivery address object with all necessary details
      const deliveryAddressDetails = {
        type: selectedAddress.type || 'Default',
        apartment: selectedAddress.apartment || '',
        area: selectedAddress.area || '',
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode || '',
        isDefault: selectedAddress.isDefault || false,
        fullName: selectedAddress.fullName || `${userData.firstName} ${userData.lastName}`.trim(),
        phoneNumber: selectedAddress.phoneNumber || userData.phoneNumber || '',
      };

      const orderData = {
        items,
        subtotal,
        total,
        userEmail: user.email,
        userId: user.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        status: 'pending',
        paymentMethod: 'Cash On Delivery',
        paymentStatus: 'pending',
        createdAt: new Date(),
        deliveryFee,
        cgst,
        sgst,
        // Add complete delivery address details
        deliveryAddress: deliveryAddressDetails,
        // Add order tracking information
        orderTracking: {
          status: 'Order Placed',
          timestamp: new Date(),
          updates: [
            {
              status: 'Order Placed',
              timestamp: new Date(),
              description: 'Your order has been placed successfully'
            }
          ]
        }
      };

      await createOrderInDatabase(orderData);
      
      // Call onPaymentSuccess callback if it exists
      if (route.params?.onPaymentSuccess) {
        await route.params.onPaymentSuccess();
      } else {
        // Update stock for each product if callback doesn't exist
        const stockUpdates = items.map(async (product) => {
          const productRef = doc(db, 'products', product.id);
          return updateDoc(productRef, {
            stock: increment(-product.quantity)
          });
        });

        // Wait for all stock updates
        await Promise.all(stockUpdates);
      }
      
      await clearCart();
      
      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: 'Your order has been placed!'
      });

      // Updated navigation logic
      navigation.navigate('OrderConfirmation', { orderData });
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 100);

    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to place order. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = () => {
    const user = auth.currentUser;
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Please login to continue'
      });
      return;
    }

    const total = items.reduce((acc, item) => {
      const discountedPrice = calculateDiscountedPrice(item);
      return acc + discountedPrice * item.quantity;
    }, 0);

    const deliveryFee = 40;
    const cgst = total * 0.09;
    const sgst = total * 0.09;
    const finalTotal = total + deliveryFee + cgst + sgst;

    const data = {
      key: 'rzp_test_s2VG2G2HwcOQd6',
      amount: Math.round(finalTotal * 100), // Amount in paise
      currency: 'INR',
      name: 'The Apex Store',
      description: 'Purchase Payment',
      image: 'https://res.cloudinary.com/diqqsuiv5/image/upload/v1740491093/huz8a2oqjnzm9cnzvpca.png',
      prefill: {
        email: user.email || '',
        contact: user.phoneNumber || '',
        name: user.displayName || ''
      },
      theme: { color: COLORS.success },
      notes: {
        address: 'Razorpay Corporate Office'
      }
    };

    setPaymentData(data);
    setShowRazorpay(true);
  };

  const calculateDiscountedPrice = (item) => {
    const originalPrice = item.price;
    return item.onSale && typeof item.discount === 'number'
      ? originalPrice - (originalPrice * item.discount / 100)
      : originalPrice;
  };

  const getCartTotal = () => {
    return items.reduce((acc, item) => {
      const discountedPrice = calculateDiscountedPrice(item);
      return acc + discountedPrice * item.quantity;
    }, 0);
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      if (!validateStockLevels()) {
        return;
      }

      setLoading(true);
      const user = auth.currentUser;

      // Check stock levels one final time before updating
      for (const item of items) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock;
          if (currentStock < item.quantity) {
            Toast.show({
              type: 'error',
              text1: 'Stock Changed',
              text2: `Sorry, ${item.name} stock has changed. Please return to cart.`
            });
            return;
          }
        }
      }

      const { subtotal, deliveryFee, cgst, sgst, total } = calculateOrderTotal(items);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Create delivery address object with all necessary details
      const deliveryAddressDetails = {
        type: selectedAddress.type || 'Default',
        apartment: selectedAddress.apartment || '',
        area: selectedAddress.area || '',
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode || '',
        isDefault: selectedAddress.isDefault || false,
        fullName: selectedAddress.fullName || `${userData.firstName} ${userData.lastName}`.trim(),
        phoneNumber: selectedAddress.phoneNumber || userData.phoneNumber || '',
      };

      const orderData = {
        items,
        subtotal,
        total,
        userEmail: user.email,
        userId: user.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        status: 'pending',
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        paymentDetails: paymentResponse,
        createdAt: new Date(),
        deliveryFee,
        cgst,
        sgst,
        // Add complete delivery address details
        deliveryAddress: deliveryAddressDetails,
        // Add order tracking information
        orderTracking: {
          status: 'Order Placed',
          timestamp: new Date(),
          updates: [
            {
              status: 'Order Placed',
              timestamp: new Date(),
              description: 'Your order has been placed and payment received'
            }
          ]
        }
      };

      await createOrderInDatabase(orderData);
      
      // Call onPaymentSuccess callback if it exists
      if (route.params?.onPaymentSuccess) {
        await route.params.onPaymentSuccess();
      } else {
        // Update stock for each product if callback doesn't exist
        const stockUpdates = items.map(async (product) => {
          const productRef = doc(db, 'products', product.id);
          return updateDoc(productRef, {
            stock: increment(-product.quantity)
          });
        });

        // Wait for all stock updates
        await Promise.all(stockUpdates);
      }
      
      await clearCart();

      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: 'Your payment was successful!'
      });

      // Updated navigation logic
      navigation.navigate('OrderConfirmation', { orderData });
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 100);

    } catch (error) {
      console.error('Error processing payment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to process payment. Please try again.'
      });
    } finally {
      setLoading(false);
      setShowRazorpay(false);
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment Error:', error);
    Toast.show({
      type: 'error',
      text1: 'Payment Failed',
      text2: error.description || 'Please try again'
    });
    setShowRazorpay(false);
  };

  const renderOrderSummary = () => {
    const total = items.reduce((acc, item) => {
      const discountedPrice = calculateDiscountedPrice(item);
      return acc + discountedPrice * item.quantity;
    }, 0);

    const deliveryFee = items.length > 0 ? 40 : 0;
    const cgst = items.length > 0 ? total * 0.09 : 0;
    const sgst = items.length > 0 ? total * 0.09 : 0;
    const finalTotal = total + deliveryFee + cgst + sgst;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        {items.map((item, index) => {
          const originalPrice = item.price;
          const discountedPrice = calculateDiscountedPrice(item);

          return (
            <View key={index} style={styles.itemCard}>
              <Image 
                source={{ uri: item.mainImage || item.image }}
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
                <Text style={styles.itemTotal}>Total: ₹{(discountedPrice * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
        
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
        </View>
        
        {items.length > 0 && (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>CGST (9%)</Text>
              <Text style={styles.summaryValue}>₹{cgst.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>SGST (9%)</Text>
              <Text style={styles.summaryValue}>₹{sgst.toFixed(2)}</Text>
            </View>
          </>
        )}
        
        <View style={[styles.summaryItem, styles.totalItem]}>
          <Text style={styles.totalText}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{finalTotal.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const renderAddressSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Address</Text>
      
      {selectedAddress ? (
        <View style={styles.selectedAddress}>
          <View style={styles.addressContent}>
            <Text style={styles.addressType}>{selectedAddress.type}</Text>
            <Text style={styles.addressText}>{selectedAddress.apartment}</Text>
            <Text style={styles.addressText}>{selectedAddress.area}</Text>
            {selectedAddress.landmark && (
              <Text style={styles.addressText}>Landmark: {selectedAddress.landmark}</Text>
            )}
            <Text style={styles.addressText}>
              {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.changeAddressButton}
            onPress={() => {
              navigation.navigate('AddressBook', {
                fromPayments: true,
                currentSelectedAddress: selectedAddress,
                onAddressSelect: (address) => {
                  setSelectedAddress(address);
                }
              });
            }}
          >
            <Text style={styles.changeAddressText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addAddressButton}
          onPress={() => {
            navigation.navigate('AddressBook', {
              fromPayments: true,
              onAddressSelect: (address) => {
                setSelectedAddress(address);
              }
            });
          }}
        >
          <Icon name="plus" size={28} color={COLORS.primary} />
          <Text style={styles.addAddressText}>Select Delivery Address</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderOrderSummary()}
        {renderAddressSection()}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedMethod === method.id && styles.paymentMethodSelected
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <Icon name={method.icon} size={26} color={selectedMethod === method.id ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[
                styles.paymentMethodText,
                selectedMethod === method.id && styles.paymentMethodTextSelected
              ]}>
                {method.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.payButton,
          !selectedMethod && styles.payButtonDisabled
        ]}
        onPress={handlePayment}
        disabled={!selectedMethod}
      >
        <Text style={styles.payButtonText}>Pay Now</Text>
      </TouchableOpacity>

      {showRazorpay && paymentData && (
        <RazorpayCheckout
          paymentData={paymentData}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    marginBottom: 18,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: SIZES.radiusMedium,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
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
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 6,
    lineHeight: 20,
  },
  itemQuantity: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: SIZES.small,
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  discountedPrice: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    color: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: SIZES.radiusSmall,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemUnitPrice: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  itemTotal: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  totalItem: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderRadius: SIZES.radiusMedium,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  totalText: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMedium,
    marginBottom: 14,
    backgroundColor: COLORS.background,
    ...SHADOWS.medium,
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 2,
  },
  paymentMethodText: {
    marginLeft: 16,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  paymentMethodTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: SIZES.radiusMedium,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  payButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    padding: 18,
    borderRadius: SIZES.radiusMedium,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  addressContent: {
    flex: 1,
  },
  addressType: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  changeAddressButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMedium,
    marginLeft: 12,
    ...SHADOWS.small,
  },
  changeAddressText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: SIZES.radiusMedium,
    marginTop: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    ...SHADOWS.medium,
  },
  addAddressText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default Payments;
