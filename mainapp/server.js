import { db, auth } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { COLLECTIONS } from './models/collections';

// Add this function
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

// Fetch recommended/featured products
export const fetchRecommendedItems = async () => {
  try {
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    // Simple query without complex ordering
    const q = query(
      productsRef,
      where('isAvailable', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter for products that have a discount
    return products
      .filter(product => product.discount > 0 || product.onSale === true)
      .sort((a, b) => {
        // Sort by discount percentage in descending order
        const discountA = a.discount || 0;
        const discountB = b.discount || 0;
        return discountB - discountA;
      })
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching recommended items:', error);
    throw error;
  }
};

// Fetch categories
export const fetchCategories = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Note: We'll do the sorting in the component to keep this function focused
  } catch (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
};

// Fetch products by category
export const fetchProductsByCategory = async (categoryId) => {
  try {
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const q = query(
      productsRef,
      where('categoryId', '==', categoryId),
      where('isAvailable', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by display order first, then by creation date
    return products.sort((a, b) => {
      // First sort by displayOrder
      if ((a.displayOrder || 0) !== (b.displayOrder || 0)) {
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
      
      // If display orders are equal, sort by creation date
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Fetch trending products
export const fetchTrendingProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef, 
      where('trending', '==', true),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching trending products:', error);
    throw error;
  }
};

// Fetch new arrivals
export const fetchNewArrivals = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('isNewArrival', '==', true),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    throw error;
  }
};

// Fetch deals of the day
export const fetchDealsOfTheDay = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('onSale', '==', true),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

// Fetch all electronics products
export const fetchElectronics = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('category', '==', 'electronics'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching electronics:', error);
    throw error;
  }
};

// Search products
export const searchProducts = async (searchTerm) => {
  try {
    // Convert search term to lowercase for case-insensitive comparison
    const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
    
    // Get all categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Find categories that match the search term
    const matchedCategories = categories.filter(category => 
      category.name.toLowerCase().includes(lowercaseSearchTerm)
    );
    
    // Get all products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const allProducts = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If we found matching categories, search for products in those categories
    if (matchedCategories.length > 0) {
      const categoryIds = matchedCategories.map(category => category.id);
      
      // Get all products matching the category
      let matchedProducts = [];
      
      categoryIds.forEach(categoryId => {
        // Get products from this category
        const productsInCategory = allProducts.filter(product => 
          product.categoryId === categoryId
        );
        
        // Sort by displayOrder - this is the exact order from Manage Products
        productsInCategory.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        // Take only top 5
        matchedProducts.push(...productsInCategory.slice(0, 5));
      });
      
      return matchedProducts;
    } else {
      // Regular product search - if not a category match
      // Filter products based on search term
      let matchedProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowercaseSearchTerm) ||
        product.description?.toLowerCase().includes(lowercaseSearchTerm) ||
        product.brand?.toLowerCase().includes(lowercaseSearchTerm)
      );
      
      // Check if search is for a specific product name
      const isSpecificSearch = allProducts.some(product => 
        product.name.toLowerCase() === lowercaseSearchTerm
      );
      
      if (isSpecificSearch) {
        // For specific product search, return all matches in order
        matchedProducts.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return matchedProducts;
      } else {
        // For general search, group by category and take top 5
        const productsByCategory = {};
        
        // Group products by category
        matchedProducts.forEach(product => {
          const categoryId = product.categoryId || 'uncategorized';
          if (!productsByCategory[categoryId]) {
            productsByCategory[categoryId] = [];
          }
          productsByCategory[categoryId].push(product);
        });
        
        // Sort each category's products by displayOrder and limit to top 5
        const finalResults = [];
        
        Object.keys(productsByCategory).forEach(categoryId => {
          const productsInCategory = productsByCategory[categoryId];
          
          // Sort by displayOrder
          productsInCategory.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          
          // Take top 5
          finalResults.push(...productsInCategory.slice(0, 5));
        });
        
        return finalResults;
      }
    }
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Fetch food counters
export const fetchFoodCounters = async () => {
  try {
    const countersRef = collection(db, COLLECTIONS.FOOD_COUNTERS);
    // Simplified query
    const q = query(
      countersRef,
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const counters = [];
    
    querySnapshot.forEach((doc) => {
      counters.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by rating client-side
    return counters.sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.error('Error fetching food counters:', error);
    throw error;
  }
};

// Add item to cart
export const addToCart = async (userId, itemId, quantity = 1) => {
  try {
    const cartRef = collection(db, COLLECTIONS.CARTS);
    // Implementation for adding to cart
    // This would need to be implemented based on your specific requirements
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Get user order history - Modified to handle missing index
export const fetchOrderHistory = async (userId) => {
  try {
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    // Simplified query to avoid index requirement initially
    const q = query(
      ordersRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort client-side instead of using orderBy
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching order history:', error);
    throw error;
  }
};

export const isUserAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    return userDoc.exists() && userDoc.data().isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Fetch Smart Home products
export const fetchSmartHomeProducts = async () => {
  try {
    const productsRef = collection(db, 'products'); // Ensure this matches your Firestore collection name
    const q = query(
      productsRef,
      where('category', '==', 'smart-home'), // Ensure this matches the exact string in your Firestore
      limit(50) // You can adjust the limit as needed
    );

    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return products;
  } catch (error) {
    console.error('Error fetching Smart Home products:', error);
    throw error; // Rethrow the error to handle it in the calling function
  }
};

// Fetch all products
export const fetchProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('isAvailable', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Category CRUD Operations
export const addCategory = async (categoryData) => {
  try {
    const categoriesRef = collection(db, 'categories');
    const docRef = await addDoc(categoriesRef, categoryData);
    return docRef.id;
  } catch (error) {
    throw new Error(`Error adding category: ${error.message}`);
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    console.log('Updating category with ID:', categoryId); // Debug log
    const categoryRef = doc(db, 'categories', categoryId);
    
    // Check if document exists before updating
    const docSnap = await getDoc(categoryRef);
    if (!docSnap.exists()) {
      throw new Error(`Category with ID ${categoryId} does not exist`);
    }

    await updateDoc(categoryRef, categoryData);
  } catch (error) {
    throw new Error(`Error updating category: ${error.message}`);
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    await deleteDoc(doc(db, "categories", categoryId));
  } catch (error) {
    throw new Error("Error deleting category: " + error.message);
  }
};

// Product CRUD Operations
export const addProduct = async (productData) => {
  try {
    // If a display order is specified, we need to shift other products
    if (productData.categoryId && productData.displayOrder !== undefined) {
      const productsInCategory = await fetchProductsByCategory(productData.categoryId);
      const batch = writeBatch(db);
      
      // Shift products with display order >= the new position
      productsInCategory.forEach(product => {
        if ((product.displayOrder || 0) >= productData.displayOrder) {
          const productRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
          batch.update(productRef, { 
            displayOrder: (product.displayOrder || 0) + 1,
            updatedAt: new Date().toISOString()
          });
        }
      });
      
      await batch.commit();
    }
    
    // Add the new product
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: docRef.id,
      ...productData
    };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: new Date().toISOString()
    });
    return {
      id: productId,
      ...productData
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentResponse) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
    
    // Here you would typically verify the signature with Razorpay's API
    // This should be done on your backend for security
    // For now, we'll just return true
    return true;
  } catch (error) {
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

export const createOrderInDatabase = async (orderData) => {
  try {
    const user = auth.currentUser;
    const orderRef = collection(db, 'orders');
    
    const newOrder = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      status: 'confirmed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deliveryFee: 40,
      shippingAddress: {},
      // Ensure items are stored at both levels
      items: orderData.items || [],
      paymentDetails: {
        ...orderData.paymentDetails,
        items: orderData.items || [] // Ensure items are in payment details
      },
      ...orderData
    };

    const docRef = await addDoc(orderRef, newOrder);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    // This should be implemented on your backend
    // For now, we'll just log the action
    console.log('Sending order confirmation email:', orderData);
    return true;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't throw error as this is not critical
    return false;
  }
};

// Add this function to update product stock
export const updateProductStock = async (productId, quantityChange) => {
  try {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }

    const currentStock = productDoc.data().stock || 0;
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: new Date().toISOString()
    });

    return newStock;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Update product display order
export const updateProductDisplayOrder = async (productId, displayOrder) => {
  try {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await updateDoc(productRef, { 
      displayOrder: displayOrder,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating product display order:', error);
    throw error;
  }
};

// Add this function if it doesn't exist
export const updateCategoryDisplayOrder = async (categoryId, displayOrder) => {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, { 
      displayOrder: displayOrder,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating category display order:', error);
    throw error;
  }
};