import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  FlatList,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableWithoutFeedback,
  Modal
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { 
  fetchCategories, 
  fetchRecommendedItems,
  fetchProductsByCategory,
  fetchProducts
} from '../server';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import LoadingAnimation from '../components/LoadingAnimation';
import { auth } from '../firebaseConfig';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const flatListRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchType, setSearchType] = useState('items');
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useNotifications();
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [currentMinPrice, setCurrentMinPrice] = useState(0);
  const [currentMaxPrice, setCurrentMaxPrice] = useState(50000);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredByPrice, setFilteredByPrice] = useState([]);

  useEffect(() => {
    loadInitialData();
    updateWishlistCount();
    
    // Add listener for wishlist updates
    const unsubscribe = navigation.addListener('focus', () => {
      updateWishlistCount();
    });

    // Add auth state listener
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      updateWishlistCount();
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    if (featuredProducts.length > 1) {
      const timer = setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % featuredProducts.length;
        setCurrentImageIndex(nextIndex);
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
      }, 3000); // 3 seconds

      return () => clearInterval(timer);
    }
  }, [currentImageIndex, featuredProducts]);

  useEffect(() => {
    setupWishlistButton();
  }, [wishlistCount, unreadCount]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch all categories and sort by displayOrder
      const fetchedCategories = await fetchCategories();
      const sortedCategories = fetchedCategories.sort((a, b) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
      );
      setCategories(sortedCategories);
      
      // Fetch products
      const allProducts = await fetchProducts();
      
      // Fetch recommended items (products with discounts)
      const discountedItems = await fetchRecommendedItems();
      setRecommendedItems(discountedItems);
      
      // Filter featured products from all products
      const featured = allProducts.filter(product => product.isFeatured);
      
      // When loading products by category, sort them by displayOrder:
      const productsByCategory = {};
      for (const category of sortedCategories) {
        const products = await fetchProductsByCategory(category.id);
        const sortedProducts = products.sort((a, b) => 
          (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        productsByCategory[category.id] = sortedProducts;
      }
      
      setProducts(allProducts);
      setFeaturedProducts(featured);
      // setCategoryProducts(productsByCategory);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading data',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWishlistCount = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user logged in, setting wishlist count to 0');
        setWishlistCount(0);
        return;
      }
      
      const wishlistKey = `wishlist_${currentUser.uid}`;
      const wishlist = await AsyncStorage.getItem(wishlistKey);
      
      // If no wishlist exists, set count to 0
      if (!wishlist) {
        console.log('No wishlist found, setting count to 0');
        setWishlistCount(0);
        return;
      }

      try {
        const wishlistItems = JSON.parse(wishlist);
        // Validate that we have an array and it has items
        if (!Array.isArray(wishlistItems)) {
          console.log('Wishlist is not an array, setting count to 0');
          setWishlistCount(0);
          return;
        }

        console.log('Wishlist items:', wishlistItems);
        console.log('Setting wishlist count to:', wishlistItems.length);
        setWishlistCount(wishlistItems.length);
      } catch (parseError) {
        console.error('Error parsing wishlist:', parseError);
        setWishlistCount(0);
      }
    } catch (error) {
      console.error('Error loading wishlist count:', error);
      setWishlistCount(0);
    }
  };

  const checkNotifications = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setNotificationCount(0);
        return;
      }
      // Initialize with 0 instead of 2
      setNotificationCount(0);
      // TODO: Implement actual notification counting logic here
    } catch (error) {
      console.error('Error checking notifications:', error);
      setNotificationCount(0);
    }
  };

  const setupWishlistButton = () => {
    console.log('Current unread notifications:', unreadCount);
    
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            onPress={() => {
              console.log('Notifications pressed, count:', unreadCount);
              navigation.navigate('Notifications');
            }}
            style={styles.headerButton}
          >
            <MaterialIcons name="notifications" size={24} color="white" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Wishlist')}
            style={styles.headerButton}
          >
            <MaterialIcons name="favorite" size={24} color="white" />
            {wishlistCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {wishlistCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  };

  const renderFeaturedProduct = () => {
    if (featuredProducts.length === 0) {
      return (
        <View style={[styles.slideContainer, styles.noFeaturedContainer]}>
          <Text style={styles.noFeaturedText}>No featured products available</Text>
        </View>
      );
    }

    return (
      <View>
        <FlatList
          ref={flatListRef}
          data={featuredProducts}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.floor(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item }) => {
            const originalPrice = item.price;
            const discountedPrice = calculateDiscountedPrice(item);

            return (
              <TouchableOpacity 
                style={[styles.slideContainer, { width }]}
                onPress={() => navigation.navigate('ItemDetails', { item })}
              >
                <Image
                  source={{ uri: item.mainImage || item.image }}
                  style={styles.slideImage}
                  resizeMode="contain"
                />
                {item.onSale && (
                  <View style={styles.slideBadge}>
                    <Text style={styles.slideBadgeText}>{item.discount}% OFF</Text>
                  </View>
                )}
                {item.stock > 0 && item.stock <= 5 && (
                  <View style={styles.slideLowStockBadge}>
                    <Text style={styles.slideLowStockText}>Hurry up! Only {item.stock} {item.stock === 1 ? 'piece' : 'pieces'} left</Text>
                  </View>
                )}
                <View style={styles.slideTextContainer}>
                  <Text style={styles.slideName}>{item.name}</Text>
                  <View style={styles.slidePriceContainer}>
                    {item.onSale ? (
                      <>
                        <Text style={styles.slideOriginalPrice}>₹{originalPrice.toFixed(2)}</Text>
                        <Text style={styles.slidePrice}>
                          ₹{discountedPrice.toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.slidePrice}>₹{originalPrice.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.id}
        />
        {featuredProducts.length > 1 && (
          <View style={styles.paginationContainer}>
            {featuredProducts.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPromoCard = () => (
    <View style={styles.promoCard}>
      <Text style={styles.promoTitle}>Special Offer!</Text>
      <Text style={styles.promoText}>Get ₹2000 Cashback</Text>
      <Text style={styles.promoSubtext}>on orders above ₹50000 using UPI</Text>
    </View>
  );

  const renderCategory = ({ item: category }) => {
    // Count products in this category using categoryId instead of name
    const productCount = products.filter(product => 
      product.categoryId === category.id
    ).length;

    return (
      <TouchableOpacity 
        style={styles.categoryCard}
        onPress={() => navigation.navigate('CategoryItems', { category })}
      >
        <View style={styles.categoryImageContainer}>
          <Image
            source={{ uri: category.image }}
            style={styles.categoryImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.productCount}>
            {productCount} Products
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const calculateDiscountedPrice = (product) => {
    if (!product) return 0;
    
    const originalPrice = parseFloat(product.price) || 0;
    
    // Enhanced debugging - display problematic products
    if (originalPrice > 0 && product.onSale && (!product.discount || typeof product.discount !== 'number')) {
      console.log(`Warning: Product missing proper discount value: ${product.name}`, {
        price: originalPrice,
        onSale: product.onSale,
        discount: product.discount,
        discountType: typeof product.discount
      });
    }
    
    if (product.onSale && typeof product.discount === 'number' && product.discount > 0) {
      // Calculate discounted price and round to 2 decimal places
      const discountAmount = originalPrice * product.discount / 100;
      const finalPrice = parseFloat((originalPrice - discountAmount).toFixed(2));
      
      return finalPrice;
    }
    return originalPrice;
  };

  const renderRecommendedItem = ({ item }) => {
    const originalPrice = item.price;
    const discountedPrice = calculateDiscountedPrice(item);

    // Generate random rating between 3.5 and 5.0
    const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
    const reviewCount = Math.floor(Math.random() * (500 - 50) + 50); // Random review count between 50-500

    // Function to render stars based on rating
    const renderStars = (rating) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;

      // Add full stars
      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <Icon key={`full-${i}`} name="star" size={16} color="#FFD700" style={styles.starIcon} />
        );
      }

      // Add half star if needed
      if (hasHalfStar) {
        stars.push(
          <Icon key="half" name="star-half" size={16} color="#FFD700" style={styles.starIcon} />
        );
      }

      // Add empty stars to make total of 5
      const emptyStars = 5 - Math.ceil(rating);
      for (let i = 0; i < emptyStars; i++) {
        stars.push(
          <Icon key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" style={styles.starIcon} />
        );
      }

      return stars;
    };

    return (
      <TouchableOpacity 
        style={styles.recommendedCard}
        onPress={() => {
          navigation.navigate('ItemDetails', { item });
        }}
      >
        <View style={styles.recommendedImageContainer}>
          {item.onSale && item.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
            </View>
          )}
          
          {item.stock > 0 && item.stock <= 5 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Hurry up! Only {item.stock} {item.stock === 1 ? 'piece' : 'pieces'} left</Text>
            </View>
          )}
          
          <Image
            source={{ uri: item.mainImage }}
            style={styles.recommendedImage}
          />
          {item.stock <= 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.recommendedInfo}>
          <Text style={styles.recommendedName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(rating)}
            </View>
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.reviews}>({reviewCount})</Text>
          </View>
          <View style={styles.priceContainer}>
            {item.onSale && item.discount ? (
              <>
                <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.recommendedPrice}>₹{originalPrice.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);

    if (!query.trim()) {
      setFilteredProducts([]);
      setIsSearching(false);
      return;
    }

    const searchLower = query.toLowerCase().trim();
    
    // First try to find a matching category regardless of search type
    const matchingCategory = categories.find(category => 
      category.name.toLowerCase().includes(searchLower)
    );

    if (matchingCategory) {
      // If we found a matching category, show all products from that category
      const filtered = products
        .filter(product => product.categoryId === matchingCategory.id)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setFilteredProducts(filtered);
      return;
    }

    // If no category match found, proceed with the selected search type
    switch (searchType) {
      case 'labels':
        // First group products by category
        const productsByCategory = {};
        products.forEach(product => {
          if (
            searchLower === 'available' && product.stock > 0 ||
            searchLower === 'out of stock' && product.stock <= 0 ||
            searchLower === 'featured' && product.isFeatured ||
            searchLower === 'new arrival' && product.isNewArrival
          ) {
            const categoryId = product.categoryId || 'uncategorized';
            if (!productsByCategory[categoryId]) {
              productsByCategory[categoryId] = [];
            }
            productsByCategory[categoryId].push(product);
          }
        });

        // Sort products within each category by displayOrder
        Object.keys(productsByCategory).forEach(categoryId => {
          productsByCategory[categoryId].sort((a, b) => 
            (a.displayOrder || 0) - (b.displayOrder || 0)
          );
        });

        // Flatten the sorted products
        const sortedByLabel = Object.values(productsByCategory).flat();
        setFilteredProducts(sortedByLabel);
        break;

      default: // 'items'
        // Group matching products by category
        const matchingProductsByCategory = {};
        products.forEach(product => {
          if (product.name.toLowerCase().includes(searchLower)) {
            const categoryId = product.categoryId || 'uncategorized';
            if (!matchingProductsByCategory[categoryId]) {
              matchingProductsByCategory[categoryId] = [];
            }
            matchingProductsByCategory[categoryId].push(product);
          }
        });

        // Sort products within each category by displayOrder
        Object.keys(matchingProductsByCategory).forEach(categoryId => {
          matchingProductsByCategory[categoryId].sort((a, b) => 
            (a.displayOrder || 0) - (b.displayOrder || 0)
          );
        });

        // Get sorted categories
        const sortedCategories = categories.sort((a, b) => 
          (a.displayOrder || 0) - (b.displayOrder || 0)
        );

        // Create final sorted array following category order
        const sortedResults = [];
        sortedCategories.forEach(category => {
          if (matchingProductsByCategory[category.id]) {
            sortedResults.push(...matchingProductsByCategory[category.id]);
          }
        });

        // Add any uncategorized products at the end
        if (matchingProductsByCategory['uncategorized']) {
          sortedResults.push(...matchingProductsByCategory['uncategorized']);
        }

        setFilteredProducts(sortedResults);
        break;
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh data'
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filterByPrice = (currentMin, currentMax) => {
    console.log(`Filtering by price: Min ${currentMin}, Max ${currentMax}`);
    
    // Optional: Log all products with issues in discounted price calculation
    const productsWithPriceIssues = products.filter(product => 
      product.onSale && (typeof product.discount !== 'number' || product.discount <= 0)
    );
    
    if (productsWithPriceIssues.length > 0) {
      console.log(`Found ${productsWithPriceIssues.length} products with price calculation issues:`);
      productsWithPriceIssues.forEach(product => {
        console.log(`- ${product.name}: onSale=${product.onSale}, discount=${product.discount}, type=${typeof product.discount}`);
      });
    }
    
    if (!selectedCategory) {
      // If no category is selected, filter all products
      const filtered = products.filter(product => {
        // Use the consistent helper function to calculate price
        const effectivePrice = calculateDiscountedPrice(product);
        
        // Debug log for products on the edge of the filter
        if (Math.abs(effectivePrice - currentMin) < 10 || Math.abs(effectivePrice - currentMax) < 10) {
          console.log(`Product: ${product.name}, Original: ${product.price}, Effective: ${effectivePrice}, Includes: ${effectivePrice >= currentMin && effectivePrice <= currentMax}`);
        }
        
        return effectivePrice >= currentMin && effectivePrice <= currentMax;
      });
      console.log(`Found ${filtered.length} products in the price range`);
      setFilteredByPrice(filtered);
    } else {
      // Filter products from the selected category
      const categoryProducts = products.filter(product => product.categoryId === selectedCategory.id);
      console.log(`Total products in category "${selectedCategory.name}": ${categoryProducts.length}`);
      
      const filtered = categoryProducts.filter(product => {
        // Use the consistent helper function to calculate price
        const effectivePrice = calculateDiscountedPrice(product);
        
        // Debug log for category products
        if (Math.abs(effectivePrice - currentMin) < 50 || Math.abs(effectivePrice - currentMax) < 50 || 
            (effectivePrice >= currentMin && effectivePrice <= currentMax)) {
          console.log(`Product in ${selectedCategory.name}: ${product.name}`, {
            originalPrice: product.price,
            effectivePrice: effectivePrice,
            included: effectivePrice >= currentMin && effectivePrice <= currentMax,
            onSale: product.onSale,
            discount: product.discount
          });
        }
        
        return effectivePrice >= currentMin && effectivePrice <= currentMax;
      });
      console.log(`Found ${filtered.length} products in category ${selectedCategory.name} in the price range`);
      setFilteredByPrice(filtered);
    }
    
    setShowPriceFilter(false); // Hide the filter after applying
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LoadingAnimation />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setIsSearching(true)}
        >
          <Ionicons name="search" size={20} color="gray" />
          <Text style={styles.searchButtonText}>Search products...</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowPriceFilter(true)}
        >
          <Ionicons name="options-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Search Modal */}
      {isSearching && (
        <View style={styles.searchResultsDropdown}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products...."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    setFilteredProducts([]);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
                setFilteredProducts([]);
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.searchResultsContent}>
            {filteredProducts.length > 0 && (
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsTitle}>
                  Search Results ({filteredProducts.length})
                </Text>
              </View>
            )}
            
            {filteredProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchResultItem}
                onPress={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                  navigation.navigate('ItemDetails', { item });
                }}
              >
                <Image
                  source={{ 
                    uri: item.mainImage || item.image || 'https://via.placeholder.com/50'
                  }}
                  style={styles.searchResultImage}
                  resizeMode="contain"
                  defaultSource={require('../assets/placeholder.png')}
                />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.searchResultPrice}>
                    ₹{calculateDiscountedPrice(item).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Make sure the filter modal is rendered at this level */}
      {showPriceFilter && (
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter by Price</Text>
              <TouchableOpacity 
                onPress={() => setShowPriceFilter(false)}
                style={styles.closeFilterButton}
              >
                <Icon name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.categorySelector}>
              <Text style={styles.filterLabel}>Select Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                  style={[
                    styles.categoryFilterItem, 
                    selectedCategory === null && styles.selectedCategoryItem
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategory === null && styles.selectedCategoryText
                  ]}>All</Text>
                </TouchableOpacity>
                {categories.map(category => (
                  <TouchableOpacity 
                    key={category.id}
                    style={[
                      styles.categoryFilterItem, 
                      selectedCategory?.id === category.id && styles.selectedCategoryItem
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryFilterText,
                      selectedCategory?.id === category.id && styles.selectedCategoryText
                    ]}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.priceInputContainer}>
              <Text style={styles.filterLabel}>Price Range (₹):</Text>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={currentMinPrice.toString()}
                  onChangeText={(text) => {
                    const value = text ? parseInt(text) : 0;
                    if (value >= 0) {
                      setCurrentMinPrice(value);
                    }
                  }}
                />
                <Text style={styles.priceSeparator}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={currentMaxPrice.toString()}
                  onChangeText={(text) => {
                    const value = text ? parseInt(text) : 0;
                    if (value >= 0) {
                      setCurrentMaxPrice(value);
                    }
                  }}
                />
              </View>
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setCurrentMinPrice(0);
                  setCurrentMaxPrice(50000);
                  setSelectedCategory(null);
                  setFilteredByPrice([]);
                  setShowPriceFilter(false);
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => {
                  if (currentMinPrice > currentMaxPrice) {
                    Toast.show({
                      type: 'error',
                      text1: 'Invalid Price Range',
                      text2: 'Minimum price cannot be greater than maximum price'
                    });
                    return;
                  }
                  setMinPrice(currentMinPrice);
                  setMaxPrice(currentMaxPrice);
                  filterByPrice(currentMinPrice, currentMaxPrice);
                }}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {filteredByPrice.length > 0 ? (
        <View style={styles.filterResultsContainer}>
          <View style={styles.filterResultsHeader}>
            <Text style={styles.filterResultsTitle}>
              {filteredByPrice.length} {filteredByPrice.length === 1 ? 'Result' : 'Results'} Found
            </Text>
            <TouchableOpacity onPress={() => setFilteredByPrice([])}>
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredByPrice}
            renderItem={renderRecommendedItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.recommendedList}
            nestedScrollEnabled={true}
          />
        </View>
      ) : minPrice > 0 || maxPrice < 50000 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No products found in this price range</Text>
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={() => {
              setFilteredByPrice([]);
              setMinPrice(0);
              setMaxPrice(50000);
            }}
          >
            <Text style={styles.clearFilterButtonText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]} 
            tintColor="#4CAF50" 
          />
        }
      >
        <View style={styles.carouselContainer}>
          {renderFeaturedProduct()}
        </View>
        
        <Text style={styles.sectionTitle}>Festive Offer!</Text>
        <FlatList
          data={recommendedItems}
          renderItem={renderRecommendedItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.recommendedList}
          nestedScrollEnabled={true}
        />
        
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={{ paddingBottom: 20 }}>
          {categories.map((item) => (
            <View key={item.id}>
              {renderCategory({ item })}
            </View>
          ))}
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const additionalStyles = StyleSheet.create({
  discountText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  outOfStock: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  }
});

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  promoCard: { 
    padding: 20, 
    backgroundColor: 'green', 
    borderRadius: 12, 
    margin: 15 
  },
  promoTitle: { 
    color: COLORS.white, 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  promoText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: '600' 
  },
  promoSubtext: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14 
  },
  sectionTitle: { 
    fontSize: SIZES.h3, 
    fontWeight: 'bold', 
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  categoryCard: {
    width: width - 32,
    height: 130,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryImageContainer: {
    width: 130,
    height: 130,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  categoryImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  categoryInfo: {
    flex: 1,
    padding: 20,
  },
  categoryName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  productCount: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  recommendedList: {
    paddingHorizontal: 5
  },
  recommendedCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    marginRight: 14,
    width: width * 0.45,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  recommendedImageContainer: {
    width: '100%',
    height: width * 0.45,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  recommendedInfo: {
    padding: 14,
    backgroundColor: COLORS.backgroundCard,
    minHeight: 135,
  },
  recommendedName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  rating: {
    fontSize: SIZES.small,
    color: COLORS.warning,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  reviews: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ...additionalStyles,
  carouselContainer: {
    height: 220,
    marginVertical: 12,
    marginHorizontal: 16,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  slideContainer: {
    width: width,
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  slideImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  slideTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  slideName: {
    color: COLORS.white,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  slidePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  slideOriginalPrice: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    textDecorationLine: 'line-through',
  },
  slidePrice: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  slideBadge: {
    position: 'absolute',
    top: 12,
    right: 25,
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusMedium,
    zIndex: 2,
    ...SHADOWS.medium,
  },
  slideBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.backgroundCard,
  },
  noFeaturedContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  noFeaturedText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  wishlistButton: {
    marginRight: 15,
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchButtonText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    marginLeft: 10,
    fontWeight: '500',
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.backgroundCard,
    zIndex: 1000,
  },
  searchHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: SIZES.body,
    color: COLORS.white,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchResultsContent: {
    flex: 1,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 5,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 4,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultPrice: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    marginRight: 15,
  },
  headerButton: {
    marginHorizontal: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  originalPrice: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  recommendedPrice: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusMedium,
    zIndex: 1,
    ...SHADOWS.small,
  },
  discountBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    maxWidth: '80%',
  },
  lowStockText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
  },
  slideLowStockBadge: {
    position: 'absolute',
    bottom: 70,
    left: 25,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    zIndex: 2,
    elevation: 3,
    maxWidth: '60%',
  },
  slideLowStockText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  priceFilterContainer: {
    backgroundColor: COLORS.backgroundCard,
    margin: 10,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priceFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  priceFilterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  priceFilterContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  categorySelector: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.white,
  },
  categoryFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLarge,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryFilterText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  priceInputContainer: {
    marginBottom: 15,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMedium,
    padding: 12,
    fontSize: SIZES.body,
    backgroundColor: COLORS.background,
    color: COLORS.white,
    fontWeight: '600',
  },
  priceSeparator: {
    paddingHorizontal: 10,
    color: COLORS.textSecondary,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMedium,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  resetButtonText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: SIZES.body,
  },
  applyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    ...SHADOWS.medium,
  },
  applyButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterResultsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  filterResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterResultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clearFilterText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  filterButtonSmall: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  filterModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContent: {
    width: '90%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  filterModalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  closeFilterButton: {
    padding: 5,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  clearFilterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearFilterButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Home;
