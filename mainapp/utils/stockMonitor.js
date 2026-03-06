import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const setupStockMonitoring = async (productId, onStockChange) => {
  const productRef = doc(db, 'products', productId);
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(productRef, async (snapshot) => {
    if (!snapshot.exists()) return;
    
    const productData = snapshot.data();
    const stockKey = `product_stock_${productId}`;
    
    try {
      // Get previous stock value
      const prevStockJson = await AsyncStorage.getItem(stockKey);
      const prevStock = prevStockJson ? JSON.parse(prevStockJson) : null;
      
      // If previously out of stock and now in stock
      if (prevStock === 0 && productData.stock > 0) {
        onStockChange(productData);
      }
      
      // Save current stock status
      await AsyncStorage.setItem(stockKey, JSON.stringify(productData.stock));
    } catch (error) {
      console.error('Error monitoring stock:', error);
    }
  });
  
  return unsubscribe;
};