import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LogBox,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchProducts, fetchCategories, deleteProduct, updateProductDisplayOrder } from '../server';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Video } from 'expo-av';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Ignore the Text strings warning
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

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

const ManageProductsScreen = ({ navigation, route }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we're returning from an update operation
      if (route.params?.productUpdated) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product updated successfully!'
        });
        // Clear the parameter after showing the message
        navigation.setParams({ productUpdated: undefined });
      }
      loadData();
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories and products in parallel
      const [fetchedCategories, fetchedProducts] = await Promise.all([
        fetchCategories(),
        fetchProducts()
      ]);
      
      // Create a map of categories for easy lookup
      const categoryMap = {};
      fetchedCategories.forEach(cat => {
        categoryMap[cat.id] = cat;
      });
      
      setCategories(categoryMap);
      
      // Group products by category
      const productsByCategory = {};
      fetchedProducts.forEach(product => {
        const categoryId = product.categoryId || 'uncategorized';
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = [];
        }
        productsByCategory[categoryId].push(product);
      });
      
      // Sort products within each category by displayOrder
      Object.keys(productsByCategory).forEach(categoryId => {
        productsByCategory[categoryId].sort((a, b) => 
          (a.displayOrder || 0) - (b.displayOrder || 0)
        );
      });
      
      // Sort categories alphabetically
      const sortedCategoryIds = Object.keys(productsByCategory).sort((a, b) => {
        const catNameA = categoryMap[a]?.name || '';
        const catNameB = categoryMap[b]?.name || '';
        return catNameA.localeCompare(catNameB);
      });
      
      // Build the final list with category headers and products
      // Add position index within each category
      const enhancedProducts = [];
      
      sortedCategoryIds.forEach(categoryId => {
        // Skip if category doesn't exist or has no products
        if (!productsByCategory[categoryId] || productsByCategory[categoryId].length === 0) {
          return;
        }
        
        // Add category header
        enhancedProducts.push({
          id: `header-${categoryId}`,
          isHeader: true,
          categoryName: categoryMap[categoryId]?.name || 'Uncategorized',
          categoryId
        });
        
        // Add products with relative position index
        productsByCategory[categoryId].forEach((product, index) => {
          enhancedProducts.push({
            ...product,
            isHeader: false,
            categoryName: categoryMap[product.categoryId]?.name || 'Uncategorized',
            displayIndexInCategory: index // This is the position index within the category
          });
        });
      });
      
      setAllProducts(enhancedProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, categoryId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(productId);
              await loadData(); // Reload all data
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Product deleted successfully!'
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditProduct = (product) => {
    navigation.navigate('AddProduct', {
      editProduct: {
        ...product,
        id: product.id
      },
      isEditing: true,
      onUpdate: () => {
        loadData();
        // Set the flag that product was updated
        navigation.setParams({ productUpdated: true });
      }
    });
  };

  const handleDragEnd = async ({ data }) => {
    try {
      // Extract all items that aren't headers
      const productsOnly = data.filter(item => !item.isHeader);
      
      // Group products by category
      const productsByCategory = {};
      productsOnly.forEach(product => {
        const categoryId = product.categoryId || 'uncategorized';
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = [];
        }
        productsByCategory[categoryId].push(product);
      });
      
      // Update the displayOrder of products within each category
      const updatePromises = [];
      
      Object.keys(productsByCategory).forEach(categoryId => {
        const productsInCategory = productsByCategory[categoryId];
        
        // Find all products in the current category and their new positions
        const currentItems = data.filter(item => 
          !item.isHeader && item.categoryId === categoryId
        );
        
        // Update displayOrder for each product in this category
        currentItems.forEach((product, index) => {
          if (product.displayOrder !== index) {
            updatePromises.push(updateProductDisplayOrder(product.id, index));
          }
        });
      });
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product order updated successfully'
        });
        
        // Reload data to ensure everything is in sync
        await loadData();
      }
    } catch (error) {
      console.error('Error updating product order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update product order'
      });
    }
  };

  const renderItem = ({ item, drag, isActive }) => {
    // Render category header
    if (item.isHeader) {
      return (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{item.categoryName}</Text>
        </View>
      );
    }
    
    // Render product item
    const originalPrice = item.price;
    const discountedPrice = calculateDiscountedPrice(item);
      
    // Use the display index within the category (starting from 1)
    const positionNumber = (item.displayIndexInCategory !== undefined) 
      ? item.displayIndexInCategory + 1 
      : '?';

    return (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[styles.productItem, isActive && styles.draggingItem]}
      >
        <View style={styles.dragHandle}>
          <Icon name="drag-vertical" size={24} color={COLORS.textSecondary} />
        </View>
        <View style={styles.productImageContainer}>
          {(item.mediaItems?.length > 0 || item.images?.length > 0) ? (
            item.mediaItems?.[0]?.type === 'video' ? (
              <Video
                source={{ uri: item.mediaItems[0].url }}
                style={styles.productMedia}
                resizeMode="cover"
                shouldPlay={false}
                isLooping={false}
              />
            ) : (
              <Image 
                source={{ uri: item.mediaItems?.[0]?.url || item.images?.[0] }} 
                style={styles.productMedia}
                defaultSource={require('../assets/placeholder.png')}
              />
            )
          ) : (
            <View>
              <Icon name="image-off" size={40} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name || 'Unnamed Product'}</Text>
          {item.onSale ? (
            <View>
              <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
              <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
              <Text style={styles.discountPercentage}>{item.discount}% Off</Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>₹{originalPrice.toFixed(2)}</Text>
          )}
          <Text style={styles.productStock}>Stock: {item.stock || '0'}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditProduct(item)}
          >
            <Icon name="pencil" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(item.id, item.categoryId)}
          >
            <Icon name="delete" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.orderBadge}>#{positionNumber}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.title}>Manage Products</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <DraggableFlatList
          data={allProducts}
          onDragEnd={handleDragEnd}
          keyExtractor={item => (item.isHeader ? item.id : item.id?.toString())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 1 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="package-variant" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.addFirstButtonText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Icon name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <Toast />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  categoryHeader: {
    backgroundColor: COLORS.backgroundCard,
    padding: 10,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 8,
    elevation: 1,
  },
  categoryTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  productItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: COLORS.backgroundCard,
    marginVertical: 5,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  draggingItem: {
    backgroundColor: COLORS.backgroundSecondary,
    elevation: 5,
  },
  dragHandle: {
    marginRight: 10,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: SIZES.body,
    color: COLORS.success,
    marginBottom: 2,
  },
  productStock: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: SIZES.h5,
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.radiusLarge,
    ...SHADOWS.large,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 80, // Extra padding for FAB
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
  },
  discountedPrice: {
    fontWeight: 'bold',
    color: COLORS.success,
    fontSize: SIZES.body,
  },
  discountPercentage: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.error,
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default ManageProductsScreen; 