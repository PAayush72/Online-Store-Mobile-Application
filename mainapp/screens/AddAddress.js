import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const AddAddress = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const isEditing = route.params?.address !== undefined;
  const [address, setAddress] = useState(
    route.params?.address || {
      id: '',
      apartment: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      type: 'Home',
      isDefault: false
    }
  );

  const validateForm = () => {
    if (!address.apartment || !address.area || !address.city || 
        !address.state || !address.pincode) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields Missing',
        text2: 'Please fill all required fields'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      let currentAddresses = userData.addresses || [];

      if (isEditing) {
        // Handle editing existing address
        currentAddresses = currentAddresses.map(addr => 
          addr.id === address.id 
            ? { ...address }
            : addr
        );
      } else {
        // Handle adding new address
        const newAddress = {
          ...address,
          id: Date.now().toString(),
          isDefault: false // New addresses are not default by default
        };
        currentAddresses.push(newAddress);
      }

      // Update the addresses in database
      await updateDoc(userRef, {
        addresses: currentAddresses
      });

      Toast.show({
        type: 'success',
        text1: isEditing ? 'Address Updated Successfully' : 'Address Added Successfully'
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: isEditing ? 'Error Updating Address' : 'Error Adding Address',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Apartment/House No. *</Text>
        <TextInput
          style={styles.input}
          value={address.apartment}
          onChangeText={(text) => setAddress({...address, apartment: text})}
          placeholder="Enter apartment/house no."
        />

        <Text style={styles.label}>Area *</Text>
        <TextInput
          style={styles.input}
          value={address.area}
          onChangeText={(text) => setAddress({...address, area: text})}
          placeholder="Enter area"
        />

        <Text style={styles.label}>Landmark</Text>
        <TextInput
          style={styles.input}
          value={address.landmark}
          onChangeText={(text) => setAddress({...address, landmark: text})}
          placeholder="Enter landmark (optional)"
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={address.city}
          onChangeText={(text) => setAddress({...address, city: text})}
          placeholder="Enter city"
        />

        <Text style={styles.label}>State *</Text>
        <TextInput
          style={styles.input}
          value={address.state}
          onChangeText={(text) => setAddress({...address, state: text})}
          placeholder="Enter state"
        />

        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          style={styles.input}
          value={address.pincode}
          onChangeText={(text) => setAddress({...address, pincode: text})}
          placeholder="Enter pincode"
          keyboardType="numeric"
          maxLength={6}
        />

        <Text style={styles.label}>Address Type</Text>
        <View style={styles.typeContainer}>
          {['Home', 'Work', 'Other'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                address.type === type && styles.selectedType
              ]}
              onPress={() => setAddress({...address, type})}
            >
              <Text style={[
                styles.typeText,
                address.type === type && styles.selectedTypeText
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update Address' : 'Add Address'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  selectedType: {
    backgroundColor: 'green',
    borderColor: 'green',
  },
  typeText: {
    color: '#333',
  },
  selectedTypeText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: 'green',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddAddress; 