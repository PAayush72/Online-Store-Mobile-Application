import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  Image 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Cart = ({ navigation }) => {
  const { cartItems, updateQuantity, getCartTotal, clearCart } = useCart();
  const fadeAnim = new Animated.Value(1); // Start visible

  const updateProductStock = async (items) => {
    try {
      const batch = writeBatch(db);
      
      items.forEach(item => {
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      });

      await batch.commit();
      console.log('Stock updated successfully');
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  };

  const handleCheckout = () => {
    if (!auth.currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Please login',
        text2: 'You need to be logged in to checkout'
      });
      return;
    }

    // Check stock availability for all items
    const stockError = cartItems.find(item => item.quantity > item.stock);
    if (stockError) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient stock',
        text2: `Only ${stockError.stock} units available for ${stockError.name}`
      });
      return;
    }

    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
        text2: 'Please add items to cart before checkout'
      });
      return;
    }
    
    navigation.navigate('Payments', { 
      total: getCartTotal(),
      items: cartItems,
      onPaymentSuccess: async () => {
        try {
          await updateProductStock(cartItems);
          clearCart(); // Clear the cart after successful payment
          Toast.show({
            type: 'success',
            text1: 'Order placed successfully',
            text2: 'Your order has been placed'
          });
          navigation.navigate('Home'); // Navigate back to home
        } catch (error) {
          console.error('Error after payment:', error);
          Toast.show({
            type: 'error',
            text1: 'Error updating stock',
            text2: error.message
          });
        }
      }
    });
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Update stock for each product
      const stockUpdates = cartItems.map(async (product) => {
        const productRef = doc(db, 'products', product.id);
        return updateDoc(productRef, {
          stock: increment(-product.quantity)
        });
      });

      // Wait for all stock updates
      await Promise.all(stockUpdates);

      // Create order document
      const orderData = {
        // ... existing order data ...
      };

      // ... rest of order creation logic ...

    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error placing order',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const originalPrice = item.price;
    const discountedPrice = item.onSale && typeof item.discount === 'number' 
      ? originalPrice - (originalPrice * item.discount / 100) 
      : originalPrice;
    const itemTotal = discountedPrice * item.quantity;
    
    // Get image URL from different possible sources
    const imageUrl = item.mediaItems?.[0]?.url || item.image || item.images?.[0];

    return (
      <Animated.View style={styles.cartItem}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.itemImage, styles.placeholderImage]}>
            <Icon name="image-off" size={24} color="#999" />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{itemTotal.toFixed(2)}</Text>
          <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={() => updateQuantity(item.id, -1)}
            style={styles.quantityButton}
          >
            <Icon name="minus" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={() => updateQuantity(item.id, 1)}
            style={styles.quantityButton}
          >
            <Icon name="plus" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="cart-outline" size={64} color="#9E9E9E" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>₹{getCartTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cartItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 12,
  },
  footer: {
    backgroundColor: 'white',
    padding: 15,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
  checkoutButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    marginTop: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  shopNowButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Cart;