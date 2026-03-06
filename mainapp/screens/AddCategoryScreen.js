import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { addCategory, updateCategory, fetchCategories } from '../server';
import { uploadToCloudinary } from '../utils/cloudinaryConfig';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AddCategoryScreen = ({ route, navigation }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(0);

  const editCategory = route.params?.editCategory;
  const isEditing = !!editCategory;

  useEffect(() => {
    loadAllCategories();
    
    if (editCategory) {
      setName(editCategory.name || '');
      setIcon(editCategory.icon || '');
      setImage(editCategory.image || '');
      setSelectedPosition(editCategory.displayOrder || 0);
    }
  }, [editCategory]);

  const loadAllCategories = async () => {
    try {
      const fetchedCategories = await fetchCategories();
      const sortedCategories = fetchedCategories.sort(
        (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
      );
      setAllCategories(sortedCategories);
      
      // For new categories, set position to end by default
      if (!isEditing) {
        setSelectedPosition(sortedCategories.length);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories'
      });
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission needed',
          text2: 'Please grant camera roll permissions'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const uploadedUrl = await uploadToCloudinary(result.assets[0].uri);
        setImage(uploadedUrl);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Image uploaded successfully!'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      setLoading(true);
      if (!name || !icon || !image) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fill all required fields'
        });
        return;
      }

      const categoryData = {
        name,
        icon,
        image,
        displayOrder: selectedPosition,
        isActive: true
      };

      if (isEditing) {
        // Update existing category
        await updateCategory(editCategory.id, categoryData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Category updated successfully!'
        });
      } else {
        // When adding a new category at a specific position, we need to shift other categories
        if (selectedPosition < allCategories.length) {
          // First shift existing categories
          const batch = writeBatch(db);
          
          allCategories.forEach(category => {
            if (category.displayOrder >= selectedPosition) {
              const categoryRef = doc(db, 'categories', category.id);
              batch.update(categoryRef, { 
                displayOrder: (category.displayOrder || 0) + 1 
              });
            }
          });
          
          await batch.commit();
        }

        // Add new category
        await addCategory(categoryData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Category added successfully!'
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving category:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save category'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Edit Category' : 'Add Category'}
      </Text>

      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>Category Image</Text>
        <Text style={styles.helperText}>
          Upload a square image for your category
        </Text>
        
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleImagePicker}
          disabled={uploading}
        >
          <Icon name="camera-plus" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Text>
        </TouchableOpacity>

        {uploading && (
          <ActivityIndicator 
            size="large" 
            color="#0000ff" 
            style={styles.loader}
          />
        )}

        {image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: image }} 
              style={styles.uploadedImage} 
            />
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => setImage('')}
            >
              <Icon name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Category Name"
        placeholderTextColor={COLORS.textSecondary}
        value={name}
        onChangeText={setName}
      />
      
      <TextInput
        placeholder="Icon Name (MaterialCommunityIcons)"
        placeholderTextColor={COLORS.textSecondary}
        value={icon}
        onChangeText={setIcon}
        style={styles.input}
      />
      
      <View style={styles.positionContainer}>
        <Text style={styles.positionLabel}>Position in Category List</Text>
        <Picker
          selectedValue={selectedPosition}
          onValueChange={setSelectedPosition}
          style={styles.picker}
        >
          {[...Array(allCategories.length + (isEditing ? 0 : 1))].map((_, index) => (
            <Picker.Item
              key={index}
              label={`Position ${index + 1}${index === allCategories.length ? ' (End)' : ''}`}
              value={index}
            />
          ))}
        </Picker>
      </View>
      
      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleAddCategory}
      >
        <Text style={styles.submitButtonText}>
          {isEditing ? "Update Category" : "Add Category"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.large,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontSize: SIZES.small,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: SIZES.radiusLarge,
    ...SHADOWS.medium,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: SIZES.h5,
    fontWeight: '500',
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
    padding: 14,
    marginBottom: 16,
    borderRadius: SIZES.radius,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
  },
  loader: {
    marginVertical: 10,
  },
  positionContainer: {
    marginBottom: 20,
  },
  positionLabel: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  picker: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius,
  },
});

export default AddCategoryScreen; 