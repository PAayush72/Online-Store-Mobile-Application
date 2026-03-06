import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
  Alert,
  LogBox
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Title, SegmentedButtons, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '../models/collections';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { Asset } from 'expo-asset';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const ItemRow = React.memo(({ item }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
      {item.name}
    </Text>
    <Text style={styles.tableCell}>{item.quantity}</Text>
    <Text style={styles.tableCell}>{item.sales}</Text>
    <Text style={[styles.tableCell, styles.revenueCell]}>
      ₹{item.revenue.toFixed(2)}
    </Text>
  </View>
));

const DashboardScreen = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [sortOrder, setSortOrder] = useState('highToLow');
  const [salesData, setSalesData] = useState(null);
  const [itemSalesData, setItemSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalProducts: 0
  });
  const [chartType, setChartType] = useState('quantity');
  const [showChartModal, setShowChartModal] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  const [sortField, setSortField] = useState('revenue');
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [chartViewType, setChartViewType] = useState('bar');

  const timePeriods = [
    { value: 'daily', label: 'Daily' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateDaysInMonth = (month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const CustomDatePicker = () => {
    const [tempDate, setTempDate] = useState(new Date(selectedDate));
    const currentYear = tempDate.getFullYear();
    const currentMonth = tempDate.getMonth();
    const days = generateDaysInMonth(currentMonth, currentYear);

    const changeMonth = (increment) => {
      const newDate = new Date(tempDate);
      newDate.setMonth(tempDate.getMonth() + increment);
      setTempDate(newDate);
    };

    const selectDay = (day) => {
      const newDate = new Date(tempDate);
      newDate.setDate(day);
      setSelectedDate(newDate);
      setShowDateModal(false);
      fetchDashboardData(newDate);
    };

    return (
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Icon name="chevron-left" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {months[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Icon name="chevron-right" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysContainer}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
              
              {/* Empty spaces for correct day alignment */}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.dayCell} />
              ))}
              
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    tempDate.getDate() === day && styles.selectedDay
                  ]}
                  onPress={() => selectDay(day)}
                >
                  <Text style={[
                    styles.dayText,
                    tempDate.getDate() === day && styles.selectedDayText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const getDateRange = () => {
    let start, end;

    switch (timeFilter) {
      case 'daily':
        // For daily, use the selected date
        start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        // For monthly, use the selected month
        start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        break;
      case 'yearly':
        // For yearly, use the selected year
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31);
        break;
    }

    return { start, end };
  };

  const fetchDashboardData = async (date = selectedDate, endDate = null) => {
    try {
      setLoading(true);
      let startDate, queryEndDate;

      switch (timeFilter) {
        case 'daily':
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          queryEndDate = new Date(date);
          queryEndDate.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
          queryEndDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'yearly':
          startDate = new Date(selectedYear, 0, 1);
          queryEndDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          if (endDate) {
            startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            queryEndDate = new Date(endDate);
            queryEndDate.setHours(23, 59, 59, 999);
          } else {
            startDate = new Date(customDateRange.startDate);
            startDate.setHours(0, 0, 0, 0);
            queryEndDate = new Date(customDateRange.endDate);
            queryEndDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      console.log('Fetching data for period:', startDate, 'to', queryEndDate);

      // Query orders collection
      const ordersRef = collection(db, COLLECTIONS.ORDERS);
      const ordersQuery = query(
        ordersRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', queryEndDate),
        orderBy('createdAt', 'asc')
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Process orders data
      const orders = [];
      let totalRevenue = 0;
      const itemSales = {};

      // Debug log
      console.log('Number of orders found:', ordersSnapshot.size);

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        orders.push({
          ...order,
          id: doc.id
        });

        // Calculate total revenue
        totalRevenue += order.total;

        // Make sure items exist in the order
        if (order.items && Array.isArray(order.items)) {
          // Debug log
          console.log('Processing order:', doc.id, 'with items:', order.items.length);

          order.items.forEach(item => {
            const itemId = item.productId || item.id; // Handle both possible ID fields
            if (!itemSales[itemId]) {
              itemSales[itemId] = {
                id: itemId,
                name: item.name,
                quantity: 0,
                sales: 0,
                revenue: 0
              };
            }
            itemSales[itemId].quantity += Number(item.quantity) || 0;
            itemSales[itemId].revenue += Number(item.price * item.quantity) || 0;
            itemSales[itemId].sales += 1;

            // Debug log
            console.log('Updated item:', itemId, itemSales[itemId]);
          });
        }
      });

      // Convert itemSales object to array
      const itemSalesArray = Object.values(itemSales);
      
      // Debug log
      console.log('Total items processed:', itemSalesArray.length);
      console.log('Items data:', itemSalesArray);

      // Sort items based on current sort order
      const sortedItems = itemSalesArray.sort((a, b) => {
        if (sortOrder === 'highToLow') {
          return b.revenue - a.revenue;
        }
        return a.revenue - b.revenue;
      });

      setItemSalesData(sortedItems);

      // Set dashboard stats
      setDashboardStats({
        totalRevenue,
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalProducts: itemSalesArray.length
      });

      // Prepare chart data
      const sortedForChart = [...itemSalesArray].sort((a, b) => 
        chartType === 'revenue' 
          ? b.revenue - a.revenue 
          : b.quantity - b.quantity
      ).slice(0, 10); // Limit to top 10 or whatever number you prefer

      const barChartData = {
        labels: sortedForChart.map(item => item.name),
        datasets: [{
          data: chartType === 'quantity' 
            ? sortedForChart.map(item => item.quantity)
            : sortedForChart.map(item => item.revenue)
        }]
      };
      setSalesData(barChartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const preparePieChartData = () => {
    if (!itemSalesData || itemSalesData.length === 0) return [];

    const topItems = [...itemSalesData]
      .sort((a, b) => chartType === 'revenue' 
        ? b.revenue - a.revenue 
        : b.quantity - a.quantity)
      .slice(0, 5);
      
    const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];
    
    const pieData = topItems.map((item, index) => ({
      name: item.name,
      value: chartType === 'revenue' ? item.revenue : item.quantity,
      color: colors[index % colors.length],
      legendFontColor: COLORS.textPrimary,
      legendFontSize: 9
    }));
    
    return pieData;
  };

  const prepareChartData = (orders) => {
    const groupedData = {};
    const labels = [];
    const datasets = [];

    orders.forEach(order => {
      let key;
      const orderDate = order.createdAt.toDate();
      
      switch (timeFilter) {
        case 'daily':
          key = orderDate.getHours().toString().padStart(2, '0') + ':00';
          break;
        case 'weekly':
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          key = days[orderDate.getDay()];
          break;
        case 'monthly':
          key = orderDate.getDate().toString().padStart(2, '0');
          break;
        case 'yearly':
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          key = months[orderDate.getMonth()];
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += order.total;
    });

    // Sort the keys based on time period
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
      if (timeFilter === 'daily') {
        return parseInt(a) - parseInt(b);
      } else if (timeFilter === 'weekly') {
        const days = {'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6};
        return days[a] - days[b];
      } else if (timeFilter === 'monthly') {
        return parseInt(a) - parseInt(b);
      } else { // yearly
        const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                       'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
        return months[a] - months[b];
      }
    });

    sortedKeys.forEach(key => {
      labels.push(key);
      datasets.push(groupedData[key]);
    });

    return {
      labels,
      datasets: [{
        data: datasets
      }]
    };
  };

  useEffect(() => {
    if (timeFilter === 'custom') {
      fetchDashboardData(customDateRange.startDate, customDateRange.endDate);
    } else {
      fetchDashboardData();
    }
  }, [timeFilter, customDateRange]);

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      const multiplier = sortOrder === 'highToLow' ? -1 : 1;
      if (sortField === 'revenue') {
        return multiplier * (a.revenue - b.revenue);
      } else {
        return multiplier * (a.quantity - b.quantity);
      }
    });
  };

  // Month Picker Modal
  const MonthPicker = () => {
    const [tempYear, setTempYear] = useState(selectedMonth.getFullYear());

    const selectMonth = (monthIndex) => {
      const newDate = new Date(tempYear, monthIndex);
      setSelectedMonth(newDate);
      setShowMonthModal(false);
      fetchDashboardData(newDate);
    };

    return (
      <Modal
        visible={showMonthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.yearSelector}>
              <TouchableOpacity onPress={() => setTempYear(tempYear - 1)}>
                <Icon name="chevron-left" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{tempYear}</Text>
              <TouchableOpacity onPress={() => setTempYear(tempYear + 1)}>
                <Icon name="chevron-right" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthCell,
                    selectedMonth.getMonth() === index && 
                    selectedMonth.getFullYear() === tempYear && 
                    styles.selectedCell
                  ]}
                  onPress={() => selectMonth(index)}
                >
                  <Text style={[
                    styles.monthText,
                    selectedMonth.getMonth() === index && 
                    selectedMonth.getFullYear() === tempYear && 
                    styles.selectedText
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowMonthModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Year Picker Modal
  const YearPicker = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
      <Modal
        visible={showYearModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Year</Text>
            <View style={styles.yearGrid}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearCell,
                    selectedYear === year && styles.selectedCell
                  ]}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearModal(false);
                    fetchDashboardData(new Date(year, 0, 1));
                  }}
                >
                  <Text style={[
                    styles.yearCellText,
                    selectedYear === year && styles.selectedText
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowYearModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render time period selector
  const renderTimeSelector = () => {
    switch (timeFilter) {
      case 'daily':
        return (
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowDateModal(true)}
          >
            <Icon name="calendar" size={24} color={COLORS.primary} />
            <Text style={styles.selectorText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        );
      case 'monthly':
        return (
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowMonthModal(true)}
          >
            <Icon name="calendar-month" size={24} color={COLORS.primary} />
            <Text style={styles.selectorText}>
              {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </Text>
          </TouchableOpacity>
        );
      case 'yearly':
        return (
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowYearModal(true)}
          >
            <Icon name="calendar-text" size={24} color={COLORS.primary} />
            <Text style={styles.selectorText}>{selectedYear}</Text>
          </TouchableOpacity>
        );
      case 'custom':
        return (
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowCustomDateModal(true)}
          >
            <Icon name="calendar-range" size={24} color={COLORS.primary} />
            <Text style={styles.selectorText}>
              {customDateRange.startDate.toLocaleDateString()} - {customDateRange.endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        );
    }
  };

  const renderChart = () => {
    if (!salesData || salesData.labels.length === 0) return null;

    const barChartData = {
      labels: salesData.labels,
      datasets: [{
        data: chartType === 'quantity' 
          ? itemSalesData.map(item => item.quantity)
          : itemSalesData.map(item => item.revenue)
      }]
    };
    
    const pieChartData = preparePieChartData();

    const ChartContent = ({ containerWidth = Dimensions.get('window').width - 40, containerHeight = 300 }) => (
      <>
        {chartViewType === 'bar' ? (
          <BarChart
            data={barChartData}
            width={Math.max(containerWidth, salesData.labels.length * 120)}
            height={containerHeight}
            chartConfig={{
              backgroundColor: COLORS.backgroundCard,
              backgroundGradientFrom: COLORS.backgroundCard,
              backgroundGradientTo: COLORS.backgroundCard,
              decimalPlaces: chartType === 'quantity' ? 0 : 2,
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
                paddingLeft: 0,
              },
              barPercentage: 0.6,
              propsForLabels: {
                fontSize: showChartModal ? 10 : 8,
                rotation: -45,
                textAnchor: 'end'
              },
              formatYLabel: (value) => {
                if (value >= 1000000) {
                  return `   ${(chartType === 'revenue' ? '₹' : '')}${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `   ${(chartType === 'revenue' ? '₹' : '')}${(value / 1000).toFixed(1)}K`;
                }
                return `   ${(chartType === 'revenue' ? '₹' : '')}${value}`;
              },
              yAxisWidth: chartType === 'revenue' ? 80 : 50,
              yAxisLabelWidth: chartType === 'revenue' ? 80 : 50,
              yAxisInterval: 1,
            }}
            verticalLabelRotation={45}
            showValuesOnTopOfBars={true}
            fromZero={true}
            style={[
              styles.chart,
              { 
                paddingLeft: 20,
                marginLeft: showChartModal ? 20 : 0 
              }
            ]}
            yAxisLabel=""
            yAxisSuffix=""
          />
        ) : (
          <PieChart
            data={pieChartData}
            width={Math.max(containerWidth * 1.5, 400)}
            height={Math.min(containerHeight * 0.7, 200)}
            chartConfig={{
              backgroundColor: COLORS.backgroundCard,
              backgroundGradientFrom: COLORS.backgroundCard,
              backgroundGradientTo: COLORS.backgroundCard,
              decimalPlaces: chartType === 'quantity' ? 0 : 2,
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor={chartType === 'revenue' ? "value" : "value"}
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
            hasLegend={true}
            center={[containerWidth * 0.05, 0]}
            legendPosition="right"
            legendOffset={120}
            avoidFalseZero
            legendStyle={{fontSize: 9}}
          />
        )}
      </>
    );

    return (
      <>
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderRow}>
              <Title>Sales Analysis</Title>
                <View style={styles.chartViewSelector}>
                  <TouchableOpacity
                    style={[
                      styles.chartViewButton,
                      chartViewType === 'bar' && styles.chartViewButtonActive
                    ]}
                    onPress={() => setChartViewType('bar')}
                  >
                    <Icon name="chart-bar" size={20} color={chartViewType === 'bar' ? 'white' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chartViewButton,
                      chartViewType === 'pie' && styles.chartViewButtonActive
                    ]}
                    onPress={() => setChartViewType('pie')}
                  >
                    <Icon name="chart-pie" size={20} color={chartViewType === 'pie' ? 'white' : '#666'} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.chartTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.chartTypeButton,
                    chartType === 'quantity' && styles.chartTypeButtonActive
                  ]}
                  onPress={() => setChartType('quantity')}
                >
                  <Text style={[
                    styles.chartTypeText,
                    chartType === 'quantity' && styles.chartTypeTextActive
                  ]}>
                    Quantity
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chartTypeButton,
                    chartType === 'revenue' && styles.chartTypeButtonActive
                  ]}
                  onPress={() => setChartType('revenue')}
                >
                  <Text style={[
                    styles.chartTypeText,
                    chartType === 'revenue' && styles.chartTypeTextActive
                  ]}>
                    Revenue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => setShowChartModal(true)}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={styles.chartScrollView}
              >
                <ChartContent 
                  containerWidth={Dimensions.get('window').width - 40}
                  containerHeight={chartViewType === 'pie' ? 
                    Math.min(Dimensions.get('window').height * 0.45, 300) : 
                    Dimensions.get('window').height * 0.6}
                />
              </ScrollView>
              <Text style={styles.expandChartText}>Tap to view full screen</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Fullscreen Chart Modal */}
        <Modal
          visible={showChartModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChartModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.chartModalContent}>
              <View style={styles.chartModalHeader}>
                <Title>Sales Analysis</Title>
                <TouchableOpacity 
                  onPress={() => setShowChartModal(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalChartControls}>
                <View style={styles.chartViewSelector}>
                  <TouchableOpacity
                    style={[
                      styles.chartViewButton,
                      chartViewType === 'bar' && styles.chartViewButtonActive
                    ]}
                    onPress={() => setChartViewType('bar')}
                  >
                    <Icon name="chart-bar" size={20} color={chartViewType === 'bar' ? 'white' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chartViewButton,
                      chartViewType === 'pie' && styles.chartViewButtonActive
                    ]}
                    onPress={() => setChartViewType('pie')}
                  >
                    <Icon name="chart-pie" size={20} color={chartViewType === 'pie' ? 'white' : '#666'} />
                </TouchableOpacity>
              </View>
              <View style={styles.chartTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.chartTypeButton,
                    chartType === 'quantity' && styles.chartTypeButtonActive
                  ]}
                  onPress={() => setChartType('quantity')}
                >
                  <Text style={[
                    styles.chartTypeText,
                    chartType === 'quantity' && styles.chartTypeTextActive
                  ]}>
                    Quantity
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chartTypeButton,
                    chartType === 'revenue' && styles.chartTypeButtonActive
                  ]}
                  onPress={() => setChartType('revenue')}
                >
                  <Text style={[
                    styles.chartTypeText,
                    chartType === 'revenue' && styles.chartTypeTextActive
                  ]}>
                    Revenue
                  </Text>
                </TouchableOpacity>
                </View>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={styles.modalChartScrollView}
              >
                <ChartContent 
                  containerWidth={Dimensions.get('window').width - 40}
                  containerHeight={chartViewType === 'pie' ? 
                    Math.min(Dimensions.get('window').height * 0.45, 300) : 
                    Dimensions.get('window').height * 0.6}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  // Add this component alongside other components
  const CustomRangePicker = () => {
    const [tempRange, setTempRange] = useState({
      startDate: new Date(customDateRange.startDate),
      endDate: new Date(customDateRange.endDate),
      selecting: 'start'
    });
    const [currentMonth, setCurrentMonth] = useState(new Date(customDateRange.startDate));

    const days = generateDaysInMonth(currentMonth.getMonth(), currentMonth.getFullYear());

    const changeMonth = (increment) => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(currentMonth.getMonth() + increment);
      setCurrentMonth(newDate);
    };

    const selectDay = (day) => {
      const selectedDate = new Date(currentMonth);
      selectedDate.setDate(day);

      if (tempRange.selecting === 'start') {
        setTempRange({
          ...tempRange,
          startDate: selectedDate,
          selecting: 'end'
        });
      } else {
        if (selectedDate < tempRange.startDate) {
          setTempRange({
            ...tempRange,
            startDate: selectedDate,
            selecting: 'end'
          });
        } else {
          setTempRange({
            ...tempRange,
            endDate: selectedDate,
          });
        }
      }
    };

    const handleConfirm = async () => {
      setCustomDateRange({
        startDate: tempRange.startDate,
        endDate: tempRange.endDate
      });
      setShowCustomDateModal(false);
      await fetchDashboardData(tempRange.startDate, tempRange.endDate);
    };

    const isDayInRange = (day) => {
      const date = new Date(currentMonth);
      date.setDate(day);
      return date >= tempRange.startDate && date <= tempRange.endDate;
    };

    const isDaySelected = (day) => {
      const date = new Date(currentMonth);
      date.setDate(day);
      return (
        date.getTime() === tempRange.startDate.getTime() ||
        date.getTime() === tempRange.endDate.getTime()
      );
    };

    return (
      <Modal
        visible={showCustomDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.datePickerContainer, { maxHeight: '80%' }]}>
            <View style={styles.customRangeHeader}>
              <Title>Select Date Range</Title>
              <View style={styles.rangeInfo}>
                <Text style={styles.rangeText}>
                  From: {tempRange.startDate.toLocaleDateString()}
                </Text>
                <Text style={styles.rangeText}>
                  To: {tempRange.endDate.toLocaleDateString()}
                </Text>
                <Text style={styles.rangeInstructions}>
                  {tempRange.selecting === 'start' ? 'Select start date' : 'Select end date'}
                </Text>
              </View>
            </View>

            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Icon name="chevron-left" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Icon name="chevron-right" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysContainer}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
              
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.dayCell} />
              ))}
              
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isDaySelected(day) && styles.selectedDay,
                    isDayInRange(day) && styles.rangeDay
                  ]}
                  onPress={() => selectDay(day)}
                >
                  <Text style={[
                    styles.dayText,
                    isDaySelected(day) && styles.selectedDayText,
                    isDayInRange(day) && styles.rangeDayText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowCustomDateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const getLogoBase64 = async () => {
    try {
      // Create a simple HTML logo instead of loading an image file
      const logoHtml = `
        <div class="logo-container">
          <span class="thapa-part">THAPA</span>
          <span class="store-part">STORE</span>
        </div>
      `;
      return logoHtml;
    } catch (error) {
      console.error('Error with logo:', error);
      return null;
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      // Format the date range for the title
      let dateRangeText = '';
      switch (timeFilter) {
        case 'daily':
          dateRangeText = selectedDate.toLocaleDateString();
          break;
        case 'monthly':
          dateRangeText = `${months[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;
          break;
        case 'yearly':
          dateRangeText = selectedYear.toString();
          break;
        case 'custom':
          dateRangeText = `${customDateRange.startDate.toLocaleDateString()} - ${customDateRange.endDate.toLocaleDateString()}`;
          break;
      }

      // Create HTML content for the PDF
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: white; text-align: center; margin: 0; }
              h2 { color: #333; margin-top: 20px; }
              .header { 
                background-color: #66BB6A; /* Lighter green */
                padding: 20px; 
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                margin-bottom: 20px;
              }
              .logo-container {
                display: inline-flex;
                align-items: center;
                padding: 2px;
                border: 1px solid #000;
                margin-right: 20px;
                background: white;
              }
              .thapa-part {
                background: #42A5F5;
                color: white;
                padding: 8px 12px;
                font-size: 20px;
                font-weight: bold;
                font-family: Arial, sans-serif;
              }
              .store-part {
                color: #42A5F5;
                padding: 8px 12px;
                font-size: 20px;
                font-weight: bold;
                font-family: Arial, sans-serif;
              }
              .header-content {
                flex-grow: 1;
                text-align: center;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin: 20px 0;
              }
              .stat-card {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
              }
              .stat-value {
                color: #4CAF50;
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
              }
              .stat-label {
                color: #666;
                font-size: 14px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .chart-section {
                margin: 30px 0;
                text-align: center;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <span class="thapa-part">THAPA</span>
                <span class="store-part">STORE</span>
              </div>
              <div class="header-content">
                <h1>Sales Summary Report</h1>
                <p style="color: white; margin: 5px 0 0 0;">Period: ${dateRangeText}</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">₹${dashboardStats.totalRevenue.toFixed(2)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Orders</div>
                <div class="stat-value">${dashboardStats.totalOrders}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Average Order Value</div>
                <div class="stat-value">₹${dashboardStats.averageOrderValue.toFixed(2)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Products</div>
                <div class="stat-value">${dashboardStats.totalProducts}</div>
              </div>
            </div>

            <h2>Items Sales Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style="text-align: center">Quantity</th>
                  <th style="text-align: center">Sales</th>
                  <th style="text-align: right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${sortItems(itemSalesData).map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td style="text-align: center">${item.quantity}</td>
                    <td style="text-align: center">${item.sales}</td>
                    <td style="text-align: right">₹${item.revenue.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF file using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const downloadPath = FileSystem.documentDirectory + `Sales_Summary_${dateRangeText.replace(/[/\s]/g, '_')}.pdf`;
        await FileSystem.moveAsync({
          from: uri,
          to: downloadPath
        });
        await Sharing.shareAsync(downloadPath);
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Sales summary report generated successfully'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to generate sales report'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Time Period Filter */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Title>Time Period</Title>
          <View style={styles.timeFilterContainer}>
            {timePeriods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.timeFilterButton,
                  timeFilter === period.value && styles.timeFilterButtonActive
                ]}
                onPress={() => setTimeFilter(period.value)}
              >
                <Text style={[
                  styles.timeFilterText,
                  timeFilter === period.value && styles.timeFilterTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {renderTimeSelector()}
        </Card.Content>
      </Card>

      <CustomDatePicker />

      {/* New Month and Year pickers */}
      <MonthPicker />
      <YearPicker />

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title>Total Revenue</Title>
            <Text style={styles.statValue}>₹{dashboardStats.totalRevenue.toFixed(2)}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title>Total Orders</Title>
            <Text style={styles.statValue}>{dashboardStats.totalOrders}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title>Avg. Order Value</Title>
            <Text style={styles.statValue}>₹{dashboardStats.averageOrderValue.toFixed(2)}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title>Total Products</Title>
            <Text style={styles.statValue}>{dashboardStats.totalProducts}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Chart Section */}
      {renderChart()}

      {/* Items List */}
      <Card style={styles.itemsCard}>
        <Card.Content>
          <View style={styles.itemsHeader}>
            <Title style={{ color: COLORS.textPrimary }}>Items Sales Details</Title>
            <View style={styles.itemsHeaderButtons}>
              <TouchableOpacity
                onPress={() => setShowItemsModal(true)}
                style={styles.fullscreenButton}
              >
                <Icon name="fullscreen" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }, styles.smallerHeaderText]}>Item Name</Text>
            <View style={[styles.headerCell, styles.headerCellContent]}>
              <Text style={[styles.smallerHeaderText]}>Qty</Text>
              <TouchableOpacity 
                onPress={() => {
                  if (sortField === 'quantity') {
                    setSortOrder(sortOrder === 'highToLow' ? 'lowToHigh' : 'highToLow');
                  } else {
                    setSortField('quantity');
                    setSortOrder('highToLow');
                  }
                }}
              >
                <Icon 
                  name={sortField === 'quantity' ? 
                    (sortOrder === 'highToLow' ? 'sort-descending' : 'sort-ascending') 
                    : 'sort'} 
                  size={14} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerCell, styles.smallerHeaderText]}>Sales</Text>
            <View style={[styles.headerCell, styles.headerCellContent]}>
              <Text style={[styles.smallerHeaderText]}>Revenue</Text>
              <TouchableOpacity 
                onPress={() => {
                  if (sortField === 'revenue') {
                    setSortOrder(sortOrder === 'highToLow' ? 'lowToHigh' : 'highToLow');
                  } else {
                    setSortField('revenue');
                    setSortOrder('highToLow');
                  }
                }}
              >
                <Icon 
                  name={sortField === 'revenue' ? 
                    (sortOrder === 'highToLow' ? 'sort-descending' : 'sort-ascending') 
                    : 'sort'} 
                  size={14} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={sortItems(itemSalesData)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ItemRow item={item} />}
            ListEmptyComponent={() => (
              <Text style={styles.noDataText}>No sales data for this period</Text>
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 40,
              offset: 40 * index,
              index,
            })}
          />

          <View style={styles.downloadContainer}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={generatePDF}
            >
              <Icon name="file-pdf-box" size={20} color="white" />
              <Text style={styles.downloadButtonText}>Download Summary PDF</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <CustomRangePicker />

      {/* Fullscreen Items Modal */}
      <Modal
        visible={showItemsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowItemsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.itemsModalContent}>
            <View style={styles.itemsModalHeader}>
              <Title>Items Sales Details</Title>
              <TouchableOpacity 
                onPress={() => setShowItemsModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 2 }, styles.smallerHeaderText]}>Item Name</Text>
              <View style={[styles.headerCell, styles.headerCellContent]}>
                <Text style={[styles.smallerHeaderText]}>Qty</Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (sortField === 'quantity') {
                      setSortOrder(sortOrder === 'highToLow' ? 'lowToHigh' : 'highToLow');
                    } else {
                      setSortField('quantity');
                      setSortOrder('highToLow');
                    }
                  }}
                >
                  <Icon 
                    name={sortField === 'quantity' ? 
                      (sortOrder === 'highToLow' ? 'sort-descending' : 'sort-ascending') 
                      : 'sort'} 
                    size={14} 
                    color={COLORS.primary} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.headerCell, styles.smallerHeaderText]}>Sales</Text>
              <View style={[styles.headerCell, styles.headerCellContent]}>
                <Text style={[styles.smallerHeaderText]}>Revenue</Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (sortField === 'revenue') {
                      setSortOrder(sortOrder === 'highToLow' ? 'lowToHigh' : 'highToLow');
                    } else {
                      setSortField('revenue');
                      setSortOrder('highToLow');
                    }
                  }}
                >
                  <Icon 
                    name={sortField === 'revenue' ? 
                      (sortOrder === 'highToLow' ? 'sort-descending' : 'sort-ascending') 
                      : 'sort'} 
                    size={14} 
                    color={COLORS.primary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={sortItems(itemSalesData)}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ItemRow item={item} />}
              ListEmptyComponent={() => (
                <Text style={styles.noDataText}>No sales data for this period</Text>
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              getItemLayout={(data, index) => ({
                length: 40,
                offset: 40 * index,
                index,
              })}
            />

            <View style={styles.downloadContainer}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={generatePDF}
              >
                <Icon name="file-pdf-box" size={20} color="white" />
                <Text style={styles.downloadButtonText}>Download Summary PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCard: {
    marginBottom: 10,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.medium,
  },
  statValue: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  chartHeader: {
    flexDirection: 'column',
    marginBottom: 15,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartViewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 25,
    padding: 4,
  },
  chartViewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  chartViewButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modalChartControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 25,
    padding: 4,
  },
  chartTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  chartTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  chartTypeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  chartTypeTextActive: {
    color: 'white',
  },
  chartScrollView: {
    marginTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 20,
    paddingBottom: 20,
  },
  chartCard: {
    margin: 10,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.medium,
  },
  itemsCard: {
    margin: 10,
    elevation: 2,
    backgroundColor: COLORS.background,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  headerCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerCellText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timeFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeFilterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  timeFilterTextActive: {
    color: 'white',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    elevation: 2,
  },
  dateSelectorText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
  },
  modalButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '30%',
    padding: 15,
    marginVertical: 5,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  yearCell: {
    width: '30%',
    padding: 15,
    marginVertical: 5,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  monthText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  yearCellText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedText: {
    color: 'white',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    elevation: 2,
  },
  selectorText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  revenueCell: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 10,
  },
  expandChartText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  chartModalContent: {
    backgroundColor: COLORS.backgroundCard,
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingLeft: 10,
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  modalChartScrollView: {
    flex: 1,
    marginTop: 20,
    marginLeft: -10,
  },
  customRangeHeader: {
    marginBottom: 20,
  },
  rangeInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 8,
  },
  rangeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  rangeInstructions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
    fontStyle: 'italic',
  },
  rangeDay: {
    backgroundColor: COLORS.primaryLight,
  },
  rangeDayText: {
    color: COLORS.primary,
  },
  confirmButton: {
    marginLeft: 10,
  },
  smallerHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  itemsHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullscreenButton: {
    marginLeft: 8,
    padding: 4,
  },
  itemsModalContent: {
    backgroundColor: 'white',
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  itemsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  downloadContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieChartContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 30,
    paddingLeft: 0,
    marginHorizontal: 0,
    marginVertical: 15,
    width: '100%',
  },
});

export default DashboardScreen; 