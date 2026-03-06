import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  Image,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Cart = ({ navigation }) => {
  const { cartItems, updateQuantity, getCartTotal, removeFromCart } = useCart();
  const fadeAnim = new Animated.Value(1); // Start visible

  const validateStockLevels = () => {
    const invalidItems = cartItems.filter(item => item.quantity > item.stock);
    
    if (invalidItems.length > 0) {
      const itemMessages = invalidItems.map(item => 
        `${item.name} (Available: ${item.stock}, In cart: ${item.quantity})`
      );
      
      Alert.alert(
        "Stock Limit Exceeded",
        "The following items exceed available stock:\n\n" + itemMessages.join("\n\n") + 
        "\n\nPlease adjust quantities before checkout.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
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

    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
        text2: 'Please add items to cart before checkout'
      });
      return;
    }

    if (!validateStockLevels()) {
      return;
    }
    
    navigation.navigate('Payments', { 
      total: getCartTotal(),
      items: cartItems
    });
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from cart?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: () => {
            removeFromCart(item.id);
            Toast.show({
              type: 'success',
              text1: 'Item removed from cart'
            });
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const originalPrice = item.price;
    const discountedPrice = item.onSale && typeof item.discount === 'number' 
      ? originalPrice - (originalPrice * item.discount / 100) 
      : originalPrice;
    const itemTotal = discountedPrice * item.quantity;

    const handleQuantityChange = (change) => {
      const newQuantity = item.quantity + change;
      if (newQuantity > item.stock) {
        Toast.show({
          type: 'error',
          text1: 'Stock limit reached',
          text2: `Only ${item.stock} items available`
        });
        return;
      }
      if (newQuantity > 0) {
        updateQuantity(item.id, change);
      }
    };

    return (
      <Animated.View style={styles.cartItem}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.cartItemGradient}
        >
          <Image 
            source={{ uri: item.mainImage || item.image }}
            style={styles.itemImage}
            defaultSource={require('../assets/placeholder.png')}
            resizeMode="cover"
          />
          <View style={styles.itemDetails}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.priceContainer}>
                {item.onSale && item.discount ? (
                  <>
                    <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                    <Text style={styles.itemPrice}>₹{discountedPrice.toFixed(2)}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.itemPrice}>₹{originalPrice.toFixed(2)}</Text>
                )}
              </View>
              <Text style={styles.itemTotal}>Total: ₹{itemTotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.actionContainer}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(-1)}
                  style={styles.quantityButton}
                >
                  <Icon name="minus" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(1)}
                  style={styles.quantityButton}
                >
                  <Icon name="plus" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                onPress={() => handleRemoveItem(item)}
                style={styles.removeButton}
              >
                <Icon name="delete" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.stockInfo}>
              Available: {item.stock}
            </Text>
          </View>
        </LinearGradient>
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
            <Icon name="cart-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => navigation.navigate('Home')}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.shopNowGradient}
              >
                <Text style={styles.shopNowText}>Shop Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <LinearGradient
            colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
            style={styles.footerGradient}
          >
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>₹{getCartTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.checkoutGradient}
              >
                <Icon name="cart-arrow-right" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cartItem: {
    marginHorizontal: SIZES.margin,
    marginVertical: 8,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cartItemGradient: {
    flexDirection: 'row',
    padding: 15,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: SIZES.body,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: SIZES.small,
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  itemPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    fontSize: SIZES.body,
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  removeButton: {
    padding: 8,
  },
  stockInfo: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  footer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  footerGradient: {
    padding: 15,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkoutButton: {
    margin: 10,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  checkoutGradient: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  shopNowButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  shopNowGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  shopNowText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
});

export default Cart;