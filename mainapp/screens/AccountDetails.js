import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AccountDetails = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setEditedData(data); // Initialize edit data
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching user data',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      // Validate phone number
      if (editedData.phoneNumber && !/^\d{10}$/.test(editedData.phoneNumber)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid phone number',
          text2: 'Please enter a valid 10-digit phone number'
        });
        return;
      }

      // Validate names
      if (!editedData.firstName || !editedData.lastName) {
        Toast.show({
          type: 'error',
          text1: 'Invalid name',
          text2: 'First name and last name are required'
        });
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        firstName: editedData.firstName,
        lastName: editedData.lastName,
        phoneNumber: editedData.phoneNumber || '',
      });

      setUserData(editedData);
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error updating profile',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Editing",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            setEditedData(userData);
            setIsEditing(false);
          }
        }
      ]
    );
  };

  const renderViewMode = () => (
    <View style={styles.section}>
      <LinearGradient
        colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
        style={styles.sectionGradient}
      >
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoItem}>
          <Icon name="account" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {userData?.firstName} {userData?.lastName}
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Icon name="email" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{userData?.email}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Icon name="phone" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{userData?.phoneNumber || 'Not provided'}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEditMode = () => (
    <View style={styles.section}>
      <LinearGradient
        colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
        style={styles.sectionGradient}
      >
        <Text style={styles.sectionTitle}>Edit Personal Information</Text>
        <View style={styles.editItem}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={editedData.firstName}
            onChangeText={(text) => setEditedData({...editedData, firstName: text})}
            placeholder="Enter first name"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
        <View style={styles.editItem}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={editedData.lastName}
            onChangeText={(text) => setEditedData({...editedData, lastName: text})}
            placeholder="Enter last name"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
        <View style={styles.editItem}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={editedData.phoneNumber}
            onChangeText={(text) => setEditedData({...editedData, phoneNumber: text})}
            placeholder="Enter phone number"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        <View style={styles.editItem}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.disabledInput}>{editedData.email}</Text>
          <Text style={styles.helperText}>Email cannot be changed</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isEditing ? renderEditMode() : renderViewMode()}

      {isEditing ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  section: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  sectionGradient: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  editItem: {
    marginBottom: 15,
  },
  label: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: SIZES.body,
  },
  disabledInput: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  helperText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    margin: SIZES.margin,
  },
  button: {
    flex: 1,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  buttonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  editButton: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  saveButton: {
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    padding: 15,
    textAlign: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AccountDetails; 