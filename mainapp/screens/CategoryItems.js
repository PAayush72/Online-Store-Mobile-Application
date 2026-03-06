import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchProductsByCategory } from '../server';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

const CategoryItems = ({ route, navigation }) => {
  const { category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryProducts();
    navigation.setOptions({
      title: category.name,
    });
  }, []);

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      const categoryProducts = await fetchProductsByCategory(category.id);
      
      // Check for products with missing or invalid discount values
      const problematicProducts = categoryProducts.filter(product => 
        product.onSale && (typeof product.discount !== 'number' || product.discount <= 0)
      );
      
      if (problematicProducts.length > 0) {
        console.log(`Found ${problematicProducts.length} products with discount issues in ${category.name}`);
        problematicProducts.forEach(product => {
          console.log(`- ${product.name}: onSale=${product.onSale}, discount=${product.discount}, type=${typeof product.discount}`);
        });
      }
      
      setProducts(categoryProducts);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error loading products',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Consistent discount calculation function
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

  const renderProduct = ({ item }) => {
    const originalPrice = item.price;
    const discountedPrice = calculateDiscountedPrice(item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ItemDetails', { item })}
      >
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.productCardGradient}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.mainImage }}
              style={styles.productImage}
              onError={() => {
                console.error(`Failed to load image: ${item.mainImage}`);
              }}
            />
            {item.onSale && item.discount && (
              <LinearGradient
                colors={[COLORS.error, '#ff6b6b']}
                style={styles.discountBadge}
              >
                <Text style={styles.discountBadgeText}>
                  {item.discount}% OFF
                </Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.priceContainer}>
              {item.onSale && item.discount ? (
                <>
                  <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                  <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
                </>
              ) : (
                <Text style={styles.productPrice}>₹{originalPrice.toFixed(2)}</Text>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{item.rating}</Text>
              <Text style={styles.reviews}>({item.reviewCount} reviews)</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="package-variant" size={50} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
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
  productList: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    maxWidth: (width - 48) / 2,
    ...SHADOWS.medium,
  },
  productCardGradient: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.4,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  productInfo: {
    padding: 12,
    minHeight: 130,
  },
  productName: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: SIZES.small,
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  reviews: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 10,
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
  discountedPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CategoryItems; 