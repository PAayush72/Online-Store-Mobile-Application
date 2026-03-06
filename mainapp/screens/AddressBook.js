import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AddressBook = ({ route, navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const onSelect = route.params?.onSelect;
  const fromPayments = route.params?.fromPayments;
  const selectAddress = route.params?.selectAddress;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchAddresses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Just get the addresses array directly
        if (userData.addresses && Array.isArray(userData.addresses)) {
          setAddresses(userData.addresses);
        } else {
          setAddresses([]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: 'error',
        text1: 'Error fetching addresses',
        text2: error.message
      });
      setLoading(false);
    }
  };

  const handleSetDefault = async (selectedAddress) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      // Get current addresses
      const userData = userDoc.data();
      let currentAddresses = userData.addresses || [];

      // Update only the isDefault status without changing order
      currentAddresses = currentAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === selectedAddress.id
      }));

      // Update only the addresses array
      await updateDoc(userRef, {
        addresses: currentAddresses
      });

      // Update main address fields with the new default address
      await updateDoc(userRef, {
        apartment: selectedAddress.apartment,
        area: selectedAddress.area,
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode
      });

      // Refresh addresses without changing order
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === selectedAddress.id
      })));
      
      Toast.show({
        type: 'success',
        text1: 'Default address updated successfully'
      });
    } catch (error) {
      console.error("Error updating default address:", error);
      Toast.show({
        type: 'error',
        text1: 'Error updating default address',
        text2: error.message
      });
    }
  };

  const handleUpdateAddress = async (updatedAddress) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      let currentAddresses = userData.addresses || [];

      // Update the specific address
      currentAddresses = currentAddresses.map(addr => 
        addr.id === updatedAddress.id 
          ? { 
              ...updatedAddress,
              isDefault: addr.isDefault // Preserve default status
            }
          : addr
      );

      // Update in database
      await updateDoc(userRef, {
        addresses: currentAddresses
      });

      // Refresh addresses
      await fetchAddresses();
      
      Toast.show({
        type: 'success',
        text1: 'Address updated successfully'
      });
    } catch (error) {
      console.error("Error updating address:", error);
      Toast.show({
        type: 'error',
        text1: 'Error updating address',
        text2: error.message
      });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    // Prevent deletion of signup address
    if (addressId === 'signup-address') {
      Toast.show({
        type: 'error',
        text1: 'Cannot delete default address',
        text2: 'This is your primary address'
      });
      return;
    }

    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              const userRef = doc(db, 'users', user.uid);
              const updatedAddresses = addresses
                .filter(addr => addr.id !== addressId)
                .filter(addr => addr.id !== 'signup-address');

              await updateDoc(userRef, {
                addresses: updatedAddresses
              });

              // Refresh the addresses list
              fetchAddresses();

              Toast.show({
                type: 'success',
                text1: 'Address deleted successfully'
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error deleting address',
                text2: error.message
              });
            }
          }
        }
      ]
    );
  };

  const handleAddressSelect = (address) => {
    const { fromPayments, onAddressSelect } = route.params || {};
    
    if (fromPayments) {
      // First update the address
      if (onAddressSelect) {
        onAddressSelect(address);
      }
      
      // Navigate back to Payments screen
      navigation.navigate('Payments');
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Address Updated',
        text2: `Delivering to ${address.city}, ${address.state}`
      });
    } else {
      // Handle normal address selection
      // Your existing address selection logic
    }
  };

  const renderAddressCard = (address) => (
    <TouchableOpacity 
      key={address.id} 
      style={[
        styles.addressCard,
        fromPayments && styles.selectableAddressCard
      ]}
      onPress={() => handleAddressSelect(address)}
    >
      <LinearGradient
        colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
        style={styles.addressCardGradient}
      >
        <View style={styles.addressHeader}>
          <View style={styles.addressTypeContainer}>
            <Icon name="map-marker" size={20} color={COLORS.primary} />
            <Text style={styles.addressType}>{address.type}</Text>
            {address.isDefault && (
              <LinearGradient
                colors={[COLORS.success, '#66bb6a']}
                style={styles.defaultBadge}
              >
                <Icon name="star" size={12} color={COLORS.white} />
                <Text style={styles.defaultText}>Default</Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.actionButtons}>
            {!fromPayments && (
              <>
                {!address.isDefault && (
                  <TouchableOpacity 
                    onPress={() => handleSetDefault(address)}
                    style={styles.actionButton}
                  >
                    <Icon name="star-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AddAddress', { 
                    address: address,
                    onUpdate: handleUpdateAddress 
                  })}
                  style={styles.actionButton}
                >
                  <Icon name="pencil" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                {!address.isDefault && (
                  <TouchableOpacity 
                    onPress={() => handleDeleteAddress(address.id)}
                    style={styles.actionButton}
                  >
                    <Icon name="delete" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
        <Text style={styles.addressText}>{address.apartment}</Text>
        <Text style={styles.addressText}>{address.area}</Text>
        {address.landmark && (
          <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text>
        )}
        <Text style={styles.addressText}>
          {address.city}, {address.state} - {address.pincode}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => 
        !fromPayments ? (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddAddress')}
          >
            <Icon name="plus" size={24} color="green" />
          </TouchableOpacity>
        ) : null
    });
  }, [navigation, fromPayments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!fromPayments && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.addButtonGradient}
          >
            <Icon name="plus" size={24} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {addresses.map(renderAddressCard)}

      {addresses.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="map-marker" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No addresses found</Text>
          <Text style={styles.emptySubText}>Add a new address to get started</Text>
        </View>
      )}
    </ScrollView>
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
  addButton: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  addButtonGradient: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  addressCard: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  addressCardGradient: {
    padding: SIZES.padding,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressType: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
  },
  emptySubText: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  headerButton: {
    marginRight: 15,
  },
  selectableAddressCard: {
    borderLeftColor: COLORS.success,
  },
});

export default AddressBook; 