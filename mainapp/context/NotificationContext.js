import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Setting up notifications listener for user:', user.uid);
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const notificationsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt instanceof Timestamp 
              ? doc.data().createdAt.toDate().toISOString() 
              : new Date().toISOString()
          }));
          console.log('Received notifications:', notificationsList);
          setNotifications(notificationsList);
          const unread = notificationsList.filter(n => !n.read).length;
          setUnreadCount(unread);
        }, (error) => {
          console.error("Error listening to notifications:", error);
        });
      } else {
        setNotifications([]);
        setUnreadCount(0);
        unsubscribe();
      }
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const addNotification = async (productData) => {
    try {
      const user = auth.currentUser;
      if (!user || isProcessing) return;

      setIsProcessing(true);

      const notificationsRef = collection(db, 'notifications');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        where('productId', '==', productData.id),
        where('type', '==', 'restock')
      );

      const existingNotifications = await getDocs(q);
      const recentNotification = existingNotifications.docs.find(doc => {
        const createdAt = doc.data().createdAt?.toDate() || new Date();
        return createdAt > fiveMinutesAgo;
      });

      if (recentNotification) {
        console.log('Recent notification exists, skipping');
        return;
      }

      const notificationData = {
        userId: user.uid,
        title: 'Item Back in Stock!',
        message: `${productData.name} is now available!`,
        type: 'restock',
        productId: productData.id,
        productName: productData.name,
        productImage: productData.mainImage || productData.image,
        productPrice: productData.price,
        productStock: productData.stock,
        productDiscount: productData.discount,
        productOnSale: productData.onSale,
        createdAt: serverTimestamp(),
        read: false
      };

      console.log('Adding new notification:', notificationData);
      await addDoc(notificationsRef, notificationData);

      Toast.show({
        type: 'success',
        text1: 'Item Back in Stock!',
        text2: `${productData.name} is now available!`,
        visibilityTime: 3000,
        position: 'top'
      });
    } catch (error) {
      console.error('Error adding notification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create notification'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};