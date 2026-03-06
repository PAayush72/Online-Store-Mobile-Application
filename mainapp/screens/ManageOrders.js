import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import CalendarPicker from 'react-native-calendar-picker';
import { Searchbar } from 'react-native-paper';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const ManageOrders = ({ navigation }) => {
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState({});
  const scrollViewRef = useRef();

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let ordersData = {};
      let revenue = 0;
      let orderCount = 0;

      querySnapshot.forEach((doc) => {
        const order = doc.data();
        const date = new Date(order.createdAt.toDate()).toLocaleDateString();
        
        if (!ordersData[date]) {
          ordersData[date] = {
            orders: [],
            dailyTotal: 0,
            orderCount: 0
          };
        }
        
        ordersData[date].orders.push({
          id: doc.id,
          ...order
        });
        ordersData[date].dailyTotal += order.total || 0;
        ordersData[date].orderCount += 1;
        
        revenue += order.total || 0;
        orderCount += 1;
      });

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setTotalRevenue(revenue);
      setTotalOrders(orderCount);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
      return;
    }

    const filtered = {};
    Object.entries(orders).forEach(([date, dateData]) => {
      const matchingOrders = dateData.orders.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingOrders.length > 0) {
        filtered[date] = {
          ...dateData,
          orders: matchingOrders,
          orderCount: matchingOrders.length,
          dailyTotal: matchingOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        };
      }
    });

    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#757575';
      case 'accepted': return '#2196F3';
      case 'confirmed': return '#4CAF50';
      case 'processing': return '#2196F3';
      case 'shipped': return '#FF9800';
      case 'delivered': return '#4CAF50';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const scrollToDate = (date) => {
    const formattedDate = new Date(date).toLocaleDateString();
    if (orders[formattedDate]) {
      // Get all section refs to calculate exact scroll position
      const dateElements = Object.keys(orders);
      const index = dateElements.indexOf(formattedDate);
      
      if (index !== -1) {
        // Calculate more accurate scroll position based on content
        let yOffset = 0;
        
        // Add height of date selection container
        yOffset += 120; // Height of date selection container
        
        // Add height of summary card
        yOffset += 100; // Height of summary card
        
        // Add heights of previous date sections
        for (let i = 0; i < index; i++) {
          const previousDate = dateElements[i];
          const orderCount = orders[previousDate].orders.length;
          // Each date header: 80px
          // Each order card: ~120px
          yOffset += 80 + (orderCount * 120);
        }

        // Scroll with offset
        scrollViewRef.current?.scrollTo({
          y: yOffset,
          animated: true
        });

        // Highlight the section briefly
        setTimeout(() => {
          // You can add animation or highlight effect here if needed
        }, 100);
      }
    } else {
      Toast.show({
        type: 'info',
        text1: 'No Orders',
        text2: 'No orders found for selected date'
      });
    }
  };

  const handleCalendarDateSelect = (date) => {
    const selectedDate = new Date(date);
    setSelectedDate(selectedDate);
    setShowCalendar(false);
    scrollToDate(selectedDate);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search Order ID"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#4CAF50"
        />
      </View>

      <View style={styles.dateSelectionContainer}>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setShowCalendar(true)}
        >
          <MaterialIcons name="calendar-today" size={24} color="#4CAF50" />
          <Text style={styles.calendarButtonText}>
            {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <CalendarPicker
              onDateChange={handleCalendarDateSelect}
              selectedDayColor="#4CAF50"
              selectedDayTextColor="#FFFFFF"
              todayBackgroundColor="#f0f0f0"
              width={300}
            />
          </View>
        </View>
      </Modal>

      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(
                Object.values(filteredOrders).reduce(
                  (sum, dateData) => sum + dateData.dailyTotal, 
                  0
                )
              )}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>
              {Object.values(filteredOrders).reduce(
                (sum, dateData) => sum + dateData.orderCount, 
                0
              )}
            </Text>
          </View>
        </View>

        {Object.entries(filteredOrders).map(([date, dateData]) => (
          <View key={date} style={[
            styles.dateSection,
            date === selectedDate.toLocaleDateString() && styles.selectedDateSection
          ]}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>{date}</Text>
              <View style={styles.dateStats}>
                <Text style={styles.dateOrders}>Orders: {dateData.orderCount}</Text>
                <Text style={styles.dateTotal}>
                  Total: {formatCurrency(dateData.dailyTotal)}
                </Text>
              </View>
            </View>

            {dateData.orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { order })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
                  <Text style={[
                    styles.paymentStatus,
                    { color: getStatusColor(order.paymentStatus) }
                  ]}>
                    {order.paymentStatus}
                  </Text>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.paymentMethod}>
                    {order.paymentMethod === 'Cash On Delivery' ? 'Cash On Delivery' : 'Online Payment'}
                  </Text>
                  <Text style={styles.orderTotal}>
                    {formatCurrency(order.total)}
                  </Text>
                </View>

                <View style={styles.itemsList}>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>

                {order.deliveryAddress && (
                  <View style={styles.deliveryInfo}>
                    <Icon name="map-marker" size={16} color="#666" />
                    <Text style={styles.deliveryAddress} numberOfLines={1}>
                      Delivery: {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      {order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {Object.keys(filteredOrders).length === 0 && searchQuery !== '' && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No orders found matching "{searchQuery}"</Text>
          </View>
        )}
      </ScrollView>
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  dateSection: {
    marginBottom: 15,
  },
  dateHeader: {
    backgroundColor: COLORS.primary,
    padding: 10,
    marginHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dateTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  dateOrders: {
    color: 'white',
    fontSize: 14,
  },
  dateTotal: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  paymentMethod: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
  },
  orderTotal: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  itemsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    marginBottom: 2,
  },
  dateSelectionContainer: {
    backgroundColor: 'white',
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center', // Center the content
  },
  calendarButtonText: {
    marginLeft: 10,
    fontSize: SIZES.h5,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 360,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  selectedDateSection: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundCard,
  },
  scrollContainer: {
    flex: 1,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius,
  },
  searchInput: {
    fontSize: 16,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: SIZES.h5,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deliveryAddress: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
});

export default ManageOrders; 