import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
  Share
} from 'react-native';
import { Video } from 'expo-av';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import Modal from 'react-native-modal';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

// Consistent discount calculation function to use across the app
const calculateDiscountedPrice = (product) => {
  if (!product) return 0;
  
  const originalPrice = parseFloat(product.price) || 0;
  
  if (product.onSale && typeof product.discount === 'number' && product.discount > 0) {
    // Calculate discounted price and round to 2 decimal places
    const discountAmount = originalPrice * product.discount / 100;
    return parseFloat((originalPrice - discountAmount).toFixed(2));
  }
  
  return originalPrice;
};

const ItemDetails = ({ route, navigation }) => {
  const { item } = route.params;

  // Validate required data
  React.useEffect(() => {
    if (!item || typeof item.price === 'undefined') {
      console.error('Invalid item data:', item);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to load product details'
      });
      navigation.goBack();
      return;
    }
  }, [item]);

  // If item is invalid, show loading or return null
  if (!item || typeof item.price === 'undefined') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isModalVideoVisible, setIsModalVideoVisible] = useState(false);
  const flatListRef = React.useRef(null);

  // Debug log
  useEffect(() => {
    console.log('Item received:', item);
    console.log('Media items:', item.mediaItems);
    console.log('Images:', item.images);
  }, [item]);

  // Convert media items to a consistent format
  const media = React.useMemo(() => {
    console.log('Processing media items...'); // Debug log
    
    if (!item) {
      console.log('No item provided');
      return [];
    }

    if (item.mediaItems && Array.isArray(item.mediaItems) && item.mediaItems.length > 0) {
      console.log('Using mediaItems:', item.mediaItems);
      return item.mediaItems;
    } 
    
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      console.log('Converting images to mediaItems:', item.images);
      return item.images.map(url => ({
        url: url,
        type: 'image'
      }));
    } 
    
    if (item.mainImage) {
      console.log('Using mainImage:', item.mainImage);
      return [{
        url: item.mainImage,
        type: 'image'
      }];
    }
    
    if (item.image) {
      console.log('Using single image:', item.image);
      return [{
        url: item.image,
        type: 'image'
      }];
    }
    
    console.log('No media found, returning empty array');
    return [];
  }, [item]);

  // Check if item is in wishlist on component mount
  useEffect(() => {
    checkWishlistStatus();
    console.log('Item Data:', item); // Log the item data to verify image URLs
  }, []);

  const checkWishlistStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const wishlist = await AsyncStorage.getItem(`wishlist_${currentUser.uid}`);
      const wishlistItems = wishlist ? JSON.parse(wishlist) : [];
      setIsFavorite(wishlistItems.includes(item.id));
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
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
      let wishlistItems = wishlist ? JSON.parse(wishlist) : [];

      if (isFavorite) {
        // Remove from wishlist
        wishlistItems = wishlistItems.filter(id => id !== item.id);
        Toast.show({
          type: 'success',
          text1: 'Removed from wishlist'
        });
      } else {
        // Add to wishlist
        wishlistItems.push(item.id);
        Toast.show({
          type: 'success',
          text1: 'Added to wishlist'
        });
      }

      await AsyncStorage.setItem(`wishlist_${currentUser.uid}`, JSON.stringify(wishlistItems));
      setIsFavorite(!isFavorite);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update wishlist'
      });
    }
  };

  const handleImagePress = (index) => {
    setSelectedImageIndex(index);
    setIsImageViewVisible(true);
  };

  const renderMediaItem = ({ item, index }) => {
    console.log('Rendering media item:', item);
    
    return (
      <TouchableOpacity 
        style={styles.mediaContainer}
        onPress={() => {
          setSelectedImageIndex(index);
          setIsImageViewVisible(true);
        }}
      >
        {item.type === 'video' ? (
          <Video
            source={{ uri: item.url }}
            style={styles.carouselVideo}
            useNativeControls
            resizeMode="contain"
            isLooping
            shouldPlay={isVideoVisible && activeIndex === index}
            onLoadStart={() => setLoading(true)}
            onLoad={() => {
              setLoading(false);
              console.log('Video loaded successfully');
            }}
            onError={(error) => {
              console.error('Video loading error:', error);
              setLoading(false);
            }}
          />
        ) : (
          <Image
            source={{ uri: item.url }}
            style={styles.carouselImage}
            resizeMode="contain"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => {
              setLoading(false);
              console.log('Image loaded successfully');
            }}
            onError={(e) => {
              console.error("Image loading error:", e.nativeEvent.error);
              setLoading(false);
            }}
          />
        )}
        {loading && (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const handleShare = async () => {
    try {
      if (media.length > 0) {
        await Share.share({
          message: `Check out ${item.name} on our app!`,
          url: media[0].url
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={toggleWishlist}
      >
        <Icon 
          name={isFavorite ? "heart" : "heart-outline"} 
          size={24} 
          color={isFavorite ? "#f44336" : "#fff"} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleShare}
      >
        <Icon name="share-variant" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const addToWishlist = async (productId) => {
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
      
      // Check if product is already in wishlist
      if (!wishlistArray.includes(productId)) {
        // Add the product ID to wishlist
        wishlistArray.push(productId);
        await AsyncStorage.setItem(`wishlist_${currentUser.uid}`, JSON.stringify(wishlistArray));
        
        Toast.show({
          type: 'success',
          text1: 'Added to wishlist'
        });
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to wishlist'
      });
    }
  };

  const handleQuantityChange = (increment) => {
    if (increment) {
      if (quantity < item.stock) {
        setQuantity(quantity + 1);
      } else {
        Toast.show({
          type: 'info',
          text1: 'Maximum stock limit reached'
        });
      }
    } else {
      if (quantity > 1) {
        setQuantity(quantity - 1);
      }
    }
  };

  // Use the consistent price calculation
  const discountedPrice = calculateDiscountedPrice(item);

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        {/* Media Gallery */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={media}
            renderItem={renderMediaItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                setActiveIndex(viewableItems[0].index);
                setIsVideoVisible(viewableItems[0].item.type === 'video');
              }
            }}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50
            }}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            ref={flatListRef}
          />
          
          {/* Pagination Dots */}
          {media.length > 1 && (
            <View style={styles.pagination}>
              {media.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* Action Buttons */}
          {renderActionButtons()}
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Title and Price Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.priceRow}>
              {item.onSale ? (
                <>
                  <Text style={styles.originalPrice}>₹{item.price.toFixed(2)}</Text>
                  <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discount}% OFF</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
              )}
            </View>
            {item.discountPercentage && (
              <Text style={styles.saveText}>
                You save: ₹{((item.price * item.discountPercentage) / 100).toFixed(2)}
              </Text>
            )}
          </View>

          {/* Badges Section */}
          <View style={styles.badgesContainer}>
            {item.featured && (
              <View style={[styles.badge, styles.featuredBadge]}>
                <Icon name="star" size={16} color="#FFC107" />
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
            {item.trending && (
              <View style={[styles.badge, styles.trendingBadge]}>
                <Icon name="trending-up" size={16} color="#E91E63" />
                <Text style={styles.badgeText}>Trending</Text>
              </View>
            )}
            {item.isNewArrival && (
              <View style={[styles.badge, styles.newBadge]}>
                <Icon name="new-box" size={16} color="#4CAF50" />
                <Text style={styles.badgeText}>New Arrival</Text>
              </View>
            )}
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={20} color="#FFC107" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            <Text style={styles.reviewCount}>({item.reviewCount} reviews)</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Specifications */}
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {Object.entries(item.specifications).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stock Status */}
          <View style={styles.stockSection}>
            <Icon 
              name={item.stock > 0 ? "check-circle" : "close-circle"} 
              size={20} 
              color={item.stock > 0 ? "#4CAF50" : "#f44336"} 
            />
            <Text style={[
              styles.stockText,
              { color: item.stock > 0 ? "#4CAF50" : "#f44336" }
            ]}>
              {item.stock > 0 ? `In Stock (${item.stock} available)` : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      {item.stock > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(false)}
            >
              <Icon name="minus" size={20} color={COLORS.white} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(true)}
            >
              <Icon name="plus" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={() => {
              // Add the selected quantity to cart
              for (let i = 0; i < quantity; i++) {
                addToCart(item);
              }
              Toast.show({
                type: 'success',
                text1: `Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`
              });
              setQuantity(1); // Reset quantity after adding to cart
            }}
          >
            <Icon name="cart-plus" size={24} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        isVisible={isImageViewVisible}
        onBackdropPress={() => setIsImageViewVisible(false)}
        onBackButtonPress={() => setIsImageViewVisible(false)}
        style={styles.modal}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsImageViewVisible(false)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImageIndex}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                setModalImageIndex(viewableItems[0].index);
                setIsModalVideoVisible(viewableItems[0].item.type === 'video');
              }
            }}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50
            }}
            getItemLayout={(data, index) => ({
              length: width * 0.9,
              offset: width * 0.9 * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <View style={styles.modalImageContainer}>
                {item.type === 'video' ? (
                  <Video
                    source={{ uri: item.url }}
                    style={styles.modalVideo}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                    shouldPlay={isModalVideoVisible && modalImageIndex === index}
                  />
                ) : (
                  <Image
                    source={{ uri: item.url }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          {/* Pagination Dots */}
          <View style={styles.modalPagination}>
            {media.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.modalPaginationDot,
                  modalImageIndex === index && styles.modalPaginationDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  carouselContainer: {
    position: 'relative',
    backgroundColor: COLORS.backgroundCard,
    elevation: 2,
  },
  mediaContainer: {
    width: width,
    height: width * 0.8,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  carouselVideo: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: COLORS.white,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusXLarge,
    borderTopRightRadius: SIZES.radiusXLarge,
    marginTop: -24,
    ...SHADOWS.large,
  },
  headerSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 14,
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusMedium,
  },
  discountText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveText: {
    color: COLORS.success,
    fontSize: SIZES.body,
    marginTop: 8,
    fontWeight: '600',
  },
  price: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusLarge,
    gap: 6,
    ...SHADOWS.small,
  },
  featuredBadge: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  trendingBadge: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error + '50',
  },
  newBadge: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success + '50',
  },
  badgeText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  ratingText: {
    marginLeft: 6,
    fontWeight: 'bold',
    color: COLORS.warning,
    fontSize: SIZES.body,
  },
  reviewCount: {
    marginLeft: 10,
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: SIZES.body,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  specKey: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  specValue: {
    flex: 2,
    fontSize: SIZES.body,
    color: COLORS.white,
    fontWeight: '500',
  },
  bottomBar: {
    padding: 18,
    backgroundColor: COLORS.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.large,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityContainer: {
    width: 130,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quantityText: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  addToCartButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  addToCartText: {
    color: COLORS.white,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: {
    position: 'absolute',
  },
  stockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    padding: 16,
    borderRadius: SIZES.radiusMedium,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  stockText: {
    marginLeft: 10,
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalImageContainer: {
    width: width * 0.9,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  modalImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  modalPagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  modalPaginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  modalPaginationDotActive: {
    backgroundColor: COLORS.white,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalVideo: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default ItemDetails; 
