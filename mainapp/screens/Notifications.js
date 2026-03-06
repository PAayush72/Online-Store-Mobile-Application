import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Notifications = ({ navigation }) => {
  const { notifications, clearAllNotifications } = useNotifications();

  // Deduplicate and sort notifications
  const deduplicateNotifications = (notifs) => {
    const seen = new Set();
    return notifs.filter(notification => {
      const uniqueKey = `${notification.type}_${notification.productId}_${notification.title}_${notification.message}`;
      if (seen.has(uniqueKey)) {
        return false;
      }
      seen.add(uniqueKey);
      return true;
    });
  };

  const allNotifications = deduplicateNotifications(notifications)
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleNotificationPress = async (notification) => {
    try {
      if (notification.type === 'restock' && notification.productId) {
        const productRef = doc(db, 'products', notification.productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = {
            id: productSnap.id,
            ...productSnap.data(),
            price: productSnap.data().price || 0,
            stock: productSnap.data().stock || 0,
            mainImage: productSnap.data().mainImage || notification.productImage,
            name: productSnap.data().name || notification.productName
          };
          
          navigation.navigate('ItemDetails', { item: productData });
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={styles.notificationItem}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <MaterialIcons 
          name={item.type === 'restock' ? 'inventory' : 'notifications'} 
          size={24} 
          color="green" 
        />
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (allNotifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={allNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.clearButtonContainer}>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAllNotifications}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  clearButtonContainer: {
    padding: 10,
    alignItems: 'flex-end',
    backgroundColor: 'white',
    elevation: 2,
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationText: {
    marginLeft: 10,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  clearButton: {
    padding: 10,
    marginRight: 10,
  },
  clearButtonText: {
    color: 'green',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default Notifications; 