import React, { createContext, useState, useContext, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig'; // Import Firebase auth
import { onAuthStateChanged } from 'firebase/auth'; // Import this

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadUserCart(user.uid); // Use Firebase UID
      } else {
        setCartItems([]); // Clear cart when user logs out
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const loadUserCart = async (userId) => {
    try {
      const savedCart = await AsyncStorage.getItem(`cart_${userId}`);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveUserCart = async (userId, items) => {
    try {
      await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product, quantity = 1) => {
    if (!currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Please login',
        text2: 'You need to be logged in to add items to cart'
      });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      let newItems;
      
      if (existingItem) {
        Toast.show({
          type: 'success',
          text1: 'Cart Updated',
          text2: `Quantity updated for ${product.name}`
        });
        
        newItems = prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        Toast.show({
          type: 'success',
          text1: 'Added to Cart',
          text2: `${product.name} added to your cart`
        });
        
        newItems = [...prevItems, { ...product, quantity }];
      }
      
      saveUserCart(currentUser.uid, newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId) => {
    if (!currentUser) return;

    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== productId);
      saveUserCart(currentUser.uid, newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId, change) => {
    if (!currentUser) return;

    setCartItems(prevItems => {
      const newItems = prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity < 1) return null;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean);
      
      saveUserCart(currentUser.uid, newItems);
      return newItems;
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((acc, item) => {
      const originalPrice = item.price;
      const discountedPrice = item.onSale && typeof item.discount === 'number' 
        ? originalPrice - (originalPrice * item.discount / 100) 
        : originalPrice;
      return acc + discountedPrice * item.quantity; // Calculate total based on discounted price
    }, 0);
  };

  const clearCart = () => {
    if (!currentUser) return;
    setCartItems([]);
    saveUserCart(currentUser.uid, []);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      clearCart,
      isAuthenticated: !!currentUser
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 