import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Button,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchCategories, addProduct, updateProduct, fetchProductsByCategory } from '../server';
import { uploadToCloudinary } from '../utils/cloudinaryConfig';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Toast from 'react-native-toast-message';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

const AddProductScreen = ({ route }) => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [specifications, setSpecifications] = useState({});
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(0);

  const editProduct = route.params?.editProduct;
  const isEditing = !!editProduct;

  useEffect(() => {
    loadCategories();
    if (editProduct) {
      setName(editProduct.name);
      setPrice(editProduct.price.toString());
      setDescription(editProduct.description);
      setCategoryId(editProduct.categoryId);
      setBrand(editProduct.brand);
      setStock(editProduct.stock.toString());
      setFeatured(editProduct.featured || false);
      setTrending(editProduct.trending || false);
      setIsNewArrival(editProduct.isNewArrival || false);
      setOnSale(editProduct.onSale || false);
      setDiscountPercentage(editProduct.discountPercentage?.toString() || '');
      setIsFeatured(editProduct.isFeatured || false);
      
      if (editProduct.mediaItems) {
        setMediaItems(editProduct.mediaItems);
      } else if (editProduct.images) {
        const convertedMediaItems = editProduct.images.map(url => ({
          url,
          type: 'image'
        }));
        setMediaItems(convertedMediaItems);
      }
    }
  }, [editProduct]);

  useEffect(() => {
    if (categoryId) {
      loadProductsInCategory();
    }
  }, [categoryId]);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories'
      });
    }
  };

  const loadProductsInCategory = async () => {
    try {
      const productsInCategory = await fetchProductsByCategory(categoryId);
      
      const sortedProducts = productsInCategory.sort(
        (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
      );
      
      setCategoryProducts(sortedProducts);
      
      if (!isEditing) {
        setSelectedPosition(sortedProducts.length);
      } else if (editProduct.categoryId === categoryId) {
        setSelectedPosition(editProduct.displayOrder || 0);
      }
    } catch (error) {
      console.error('Error loading products in category:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load products in category'
      });
    }
  };

  const handleMediaPicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission needed',
          text2: 'Please grant media library permissions'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled) {
        setUploading(true);
        Toast.show({
          type: 'info',
          text1: 'Uploading',
          text2: 'Please wait while we upload your media...'
        });

        const uploadPromises = result.assets.map(async (asset) => {
          const isVideo = asset.uri.endsWith('.mp4') || asset.uri.endsWith('.mov');
          const isGif = asset.uri.endsWith('.gif');
          
          const uploadedUrl = await uploadToCloudinary(asset.uri, {
            resource_type: isVideo ? 'video' : 'image',
            folder: isVideo ? 'videos' : isGif ? 'gifs' : 'images'
          });

          return {
            url: uploadedUrl,
            type: isVideo ? 'video' : isGif ? 'gif' : 'image'
          };
        });

        const uploadedMedia = await Promise.all(uploadPromises);
        setMediaItems(prev => [...prev, ...uploadedMedia]);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Media uploaded successfully!'
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

  const removeMedia = (index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!name || !price || !description || !categoryId || !brand || !stock || mediaItems.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fill all required fields and add at least one media item'
        });
        return;
      }

      const formattedMediaItems = mediaItems.map(item => ({
        url: item.url,
        type: item.type || 'image'
      }));

      const productData = {
        name,
        price: parseFloat(price),
        description,
        categoryId,
        brand,
        stock: parseInt(stock),
        specifications,
        featured,
        trending,
        isNewArrival,
        onSale,
        discountPercentage: onSale ? parseFloat(discountPercentage) : null,
        mediaItems: formattedMediaItems,
        images: formattedMediaItems.map(item => item.url),
        mainImage: formattedMediaItems[0].url,
        isAvailable: true,
        isFeatured,
        discount: onSale ? parseFloat(discount) || 0 : 0,
        displayOrder: selectedPosition,
      };

      console.log('Saving product with media:', productData.mediaItems);

      if (isEditing) {
        await updateProduct(editProduct.id, productData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product updated successfully!'
        });
        if (route.params?.onUpdate) {
          route.params.onUpdate(productData);
        }
      } else {
        await addProduct(productData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product added successfully!'
        });
      }

      setName('');
      setPrice('');
      setDescription('');
      setCategoryId('');
      setBrand('');
      setStock('');
      setMediaItems([]);
      setOnSale(false);
      setDiscount('');
      setIsFeatured(false);
      setSelectedPosition(0);
      
    } catch (error) {
      console.error('Error saving product:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMediaItem = ({ item, index }) => (
    <View style={styles.mediaContainer}>
      {item.type === 'video' ? (
        <Video
          source={{ uri: item.url }}
          style={styles.mediaPreview}
          resizeMode="cover"
          shouldPlay={false}
          isLooping={false}
        />
      ) : (
        <Image 
          source={{ uri: item.url }} 
          style={styles.mediaPreview} 
        />
      )}
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeMedia(index)}
      >
        <Icon name="close-circle" size={24} color="red" />
      </TouchableOpacity>
      <View style={styles.mediaTypeIndicator}>
        <Icon 
          name={item.type === 'video' ? 'video' : item.type === 'gif' ? 'gif' : 'image'} 
          size={16} 
          color="#fff" 
        />
      </View>
    </View>
  );

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Admin')}
          style={{ marginLeft: 15 }}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Edit Product' : 'Add Product'}
      </Text>

      <View style={styles.mediaSection}>
      
        <Text style={styles.helperText}>
          Upload up to 5 media items for your product
        </Text>
        
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleMediaPicker}
          disabled={uploading || mediaItems.length >= 5}
        >
          <Icon name="camera-plus" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Add Media'}
          </Text>
        </TouchableOpacity>

        {uploading && (
          <ActivityIndicator 
            size="large" 
            color="#0000ff" 
            style={styles.loader}
          />
        )}

        <FlatList
          horizontal
          data={mediaItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderMediaItem}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No media items added yet</Text>
          )}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Product Name"
        placeholderTextColor={COLORS.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        placeholderTextColor={COLORS.textSecondary}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        placeholderTextColor={COLORS.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={categoryId}
          onValueChange={(itemValue) => {
            setCategoryId(itemValue);
            if (itemValue !== categoryId) {
              setSelectedPosition(0);
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Select Category" value="" />
          {categories.map((category) => (
            <Picker.Item 
              key={category.id} 
              label={category.name} 
              value={category.id} 
            />
          ))}
        </Picker>
      </View>

      {categoryId && (
        <View style={styles.pickerContainer}>
          <Text style={styles.positionLabel}>Position in Category</Text>
          <Picker
            selectedValue={selectedPosition}
            onValueChange={setSelectedPosition}
            style={styles.picker}
          >
            {[...Array(categoryProducts.length + (isEditing ? 0 : 1))].map((_, index) => (
              <Picker.Item
                key={index}
                label={`Position ${index + 1}${index === categoryProducts.length ? ' (End)' : ''}`}
                value={index}
              />
            ))}
          </Picker>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Brand"
        placeholderTextColor={COLORS.textSecondary}
        value={brand}
        onChangeText={setBrand}
      />

      <TextInput
        style={styles.input}
        placeholder="Stock"
        placeholderTextColor={COLORS.textSecondary}
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />

      <View style={styles.flagsContainer}>
        <TouchableOpacity 
          style={[styles.flagButton, featured && styles.flagButtonActive]}
          onPress={() => setFeatured(!featured)}
        >
          <Text style={[styles.flagText, featured && styles.flagTextActive]}>
            Featured
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.flagButton, trending && styles.flagButtonActive]}
          onPress={() => setTrending(!trending)}
        >
          <Text style={[styles.flagText, trending && styles.flagTextActive]}>
            Trending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.flagButton, isNewArrival && styles.flagButtonActive]}
          onPress={() => setIsNewArrival(!isNewArrival)}
        >
          <Text style={[styles.flagText, isNewArrival && styles.flagTextActive]}>
            New Arrival
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>On Sale</Text>
        <Switch
          value={onSale}
          onValueChange={setOnSale}
          trackColor={{ false: "#767577", true: COLORS.primaryLight }}
          thumbColor={onSale ? COLORS.primary : "#f4f3f4"}
        />
      </View>

      {onSale && (
        <TextInput
          style={styles.input}
          placeholder="Discount (%)"
          placeholderTextColor={COLORS.textSecondary}
          value={discount}
          onChangeText={setDiscount}
          keyboardType="numeric"
        />
      )}

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Feature in Home Slider</Text>
        <Switch
          value={isFeatured}
          onValueChange={setIsFeatured}
          trackColor={{ false: "#767577", true: COLORS.primaryLight }}
          thumbColor={isFeatured ? COLORS.primary : "#f4f3f4"}
        />
      </View>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update Product' : 'Add Product'}
          </Text>
        )}
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
  mediaSection: {
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  mediaContainer: {
    width: 120,
    height: 120,
    marginRight: 10,
    position: 'relative',
  },
  mediaPreview: {
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  flagButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundCard,
  },
  flagButtonActive: {
    backgroundColor: COLORS.primary,
  },
  flagText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  flagTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: COLORS.success,
    padding: 18,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    ...SHADOWS.large,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  loader: {
    marginVertical: 10,
  },
  mediaTypeIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  switchLabel: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  positionLabel: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 10,
  },
});

export default AddProductScreen; 