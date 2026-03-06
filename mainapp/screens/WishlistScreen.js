import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const WishlistScreen = ({ navigation }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addNotification } = useNotifications();

  useEffect(() => {
    checkAuthAndLoadWishlist();
    const unsubscribe = navigation.addListener('focus', () => {
      checkAuthAndLoadWishlist();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAuthAndLoadWishlist = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setWishlistItems([]);
        setLoading(false);
        Toast.show({
          type: 'info',
          text1: 'Please login',
          text2: 'You need to be logged in to view your wishlist'
        });
        navigation.navigate('Login');
        return;
      }
      
      await loadWishlist(currentUser.uid);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setLoading(false);
    }
  };

  const loadWishlist = async (userId) => {
    try {
      setLoading(true);
      const wishlistKey = `wishlist_${userId}`;
      const wishlist = await AsyncStorage.getItem(wishlistKey);
      
      if (wishlist) {
        const wishlistArray = JSON.parse(wishlist);
        
        const unsubscribes = [];
        
        const productsPromises = wishlistArray.map(async (productId) => {
          const productRef = doc(db, 'products', productId);
          
          const unsubscribe = onSnapshot(productRef, async (snapshot) => {
            if (!snapshot.exists()) return;
            
            const productData = snapshot.data();
            const stockKey = `product_stock_${productId}`;
            
            try {
              const prevStockJson = await AsyncStorage.getItem(stockKey);
              const prevStock = prevStockJson ? JSON.parse(prevStockJson) : null;

              console.log('Stock change detected:', {
                productId,
                prevStock,
                newStock: productData.stock
              });

              if (prevStock !== null && prevStock === 0 && productData.stock > 0) {
                console.log('Triggering restock notification for:', productData.name);
                addNotification({
                  id: productId,
                  ...productData
                });
              }

              await AsyncStorage.setItem(stockKey, JSON.stringify(productData.stock));
            } catch (error) {
              console.error('Error checking stock:', error);
            }
          });

          unsubscribes.push(unsubscribe);

          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            await AsyncStorage.setItem(
              `product_stock_${productId}`,
              JSON.stringify(productData.stock)
            );
            return {
              id: productSnap.id,
              ...productData,
              mainImage: productData.mainImage || productData.image || '',
              image: productData.image || productData.mainImage || ''
            };
          }
          return null;
        });

        const products = await Promise.all(productsPromises);
        const validProducts = products.filter(product => product !== null);
        setWishlistItems(validProducts);

        return () => {
          unsubscribes.forEach(unsubscribe => unsubscribe());
        };
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading wishlist',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Toast.show({
          type: 'info',
          text1: 'Please login',
          text2: 'You need to be logged in to manage your wishlist'
        });
        navigation.navigate('Login');
        return;
      }

      const wishlist = await AsyncStorage.getItem(`wishlist_${currentUser.uid}`);
      let wishlistArray = wishlist ? JSON.parse(wishlist) : [];
      
      wishlistArray = wishlistArray.filter(id => id !== productId);
      
      await AsyncStorage.setItem(`wishlist_${currentUser.uid}`, JSON.stringify(wishlistArray));
      
      setWishlistItems(prev => prev.filter(item => item.id !== productId));
      
      Toast.show({
        type: 'success',
        text1: 'Removed from wishlist'
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item from wishlist'
      });
    }
  };

  const renderItem = ({ item }) => {
    const originalPrice = item.price;
    const discountedPrice = item.onSale && item.discount ? 
      originalPrice - (originalPrice * item.discount / 100) : 
      originalPrice;

    return (
      <View style={styles.itemCard}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.itemCardGradient}
        >
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
                <View style={styles.priceRow}>
                  {item.onSale && item.discount ? (
                    <>
                      <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                      <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.itemPrice}>₹{originalPrice.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item.id)}
              >
                <Icon name="close" size={20} color={COLORS.error} />
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>

              {item.stock > 0 ? (
                <TouchableOpacity 
                  style={styles.addToCartButton}
                  onPress={async () => {
                    try {
                      addToCart(item);
                      await removeFromWishlist(item.id);
                      Toast.show({
                        type: 'success',
                        text1: 'Added to cart and removed from wishlist'
                      });
                    } catch (error) {
                      Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Failed to update cart/wishlist'
                      });
                    }
                  }}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryLight]}
                    style={styles.addToCartGradient}
                  >
                    <Icon name="shopping-cart" size={20} color={COLORS.white} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {wishlistItems.length > 0 ? (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => `wishlist-item-${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="favorite-border" size={80} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySubtext}>
            Favourite the products you love and buy them whenever you like!
          </Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.shopNowGradient}
            >
              <Text style={styles.shopNowText}>Shop Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  itemCard: {
    marginHorizontal: SIZES.margin,
    marginVertical: 8,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  itemCardGradient: {
    flexDirection: 'row',
    padding: 15,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
  },
  itemContent: {
    flex: 1,
    marginLeft: 15,
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
    fontWeight: '500',
    color: COLORS.textPrimary,
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
    fontSize: SIZES.small,
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  discountedPrice: {
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
  itemPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  removeText: {
    color: COLORS.error,
    marginLeft: 4,
    fontWeight: '500',
    fontSize: SIZES.small,
  },
  addToCartButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addToCartText: {
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
    fontSize: SIZES.small,
  },
  outOfStock: {
    color: COLORS.error,
    fontWeight: '500',
    fontSize: SIZES.small,
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopNowButton: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  shopNowGradient: {
    padding: 15,
    paddingHorizontal: 32,
  },
  shopNowText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
  },
});

export default WishlistScreen; 