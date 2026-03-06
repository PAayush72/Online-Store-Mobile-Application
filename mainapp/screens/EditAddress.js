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
import { doc, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const EditAddress = ({ route, navigation }) => {
  const { address } = route.params;
  const [loading, setLoading] = useState(false);
  const [editedAddress, setEditedAddress] = useState({
    ...address
  });

  const validateForm = () => {
    if (!editedAddress.streetAddress || !editedAddress.area || !editedAddress.city || 
        !editedAddress.state || !editedAddress.pincode) {
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
      const userRef = doc(db, 'users', user.uid);

      if (editedAddress.id === 'signup-address') {
        // Update signup address
        await updateDoc(userRef, {
          apartment: editedAddress.streetAddress,
          area: editedAddress.area,
          landmark: editedAddress.landmark,
          city: editedAddress.city,
          state: editedAddress.state,
          pincode: editedAddress.pincode,
        });
      } else {
        // Update address in addresses array
        const updatedAddresses = {
          addresses: arrayUnion(editedAddress)
        };
        await updateDoc(userRef, updatedAddresses);
      }

      Toast.show({
        type: 'success',
        text1: 'Address Updated Successfully'
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error Updating Address',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Street Address *</Text>
        <TextInput
          style={styles.input}
          value={editedAddress.streetAddress}
          onChangeText={(text) => setEditedAddress({...editedAddress, streetAddress: text})}
          placeholder="Enter street address"
        />

        <Text style={styles.label}>Area *</Text>
        <TextInput
          style={styles.input}
          value={editedAddress.area}
          onChangeText={(text) => setEditedAddress({...editedAddress, area: text})}
          placeholder="Enter area"
        />

        <Text style={styles.label}>Landmark</Text>
        <TextInput
          style={styles.input}
          value={editedAddress.landmark}
          onChangeText={(text) => setEditedAddress({...editedAddress, landmark: text})}
          placeholder="Enter landmark (optional)"
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={editedAddress.city}
          onChangeText={(text) => setEditedAddress({...editedAddress, city: text})}
          placeholder="Enter city"
        />

        <Text style={styles.label}>State *</Text>
        <TextInput
          style={styles.input}
          value={editedAddress.state}
          onChangeText={(text) => setEditedAddress({...editedAddress, state: text})}
          placeholder="Enter state"
        />

        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          style={styles.input}
          value={editedAddress.pincode}
          onChangeText={(text) => setEditedAddress({...editedAddress, pincode: text})}
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
                editedAddress.type === type && styles.selectedType
              ]}
              onPress={() => setEditedAddress({...editedAddress, type})}
            >
              <Text style={[
                styles.typeText,
                editedAddress.type === type && styles.selectedTypeText
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
            <Text style={styles.submitButtonText}>Update Address</Text>
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

export default EditAddress; 