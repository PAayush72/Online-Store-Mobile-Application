import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchCategories, deleteCategory, updateCategoryDisplayOrder } from '../server';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const ManageCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadCategories();
    });

    return unsubscribe;
  }, [navigation]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await fetchCategories();
      // Sort by displayOrder if it exists
      const sortedCategories = Array.isArray(fetchedCategories) 
        ? fetchedCategories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        : [];
      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteCategory(categoryId);
              await loadCategories();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Category deleted successfully!'
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete category'
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditCategory = (category) => {
    navigation.navigate('AddCategory', {
      editCategory: {
        ...category,
        id: category.id
      },
      isEditing: true,
      onUpdate: loadCategories
    });
  };

  const handleDragEnd = async ({ data }) => {
    try {
      // Update categories with new order
      const updatedCategories = data.map((category, index) => ({
        ...category,
        displayOrder: index
      }));
      
      setCategories(updatedCategories);
      
      // Update in database
      const updatePromises = updatedCategories.map(category => 
        updateCategoryDisplayOrder(category.id, category.displayOrder)
      );
      
      await Promise.all(updatePromises);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category order updated successfully'
      });
    } catch (error) {
      console.error('Error updating category order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update category order'
      });
    }
  };

  const renderCategoryItem = ({ item, drag, isActive }) => (
    <TouchableOpacity
      onLongPress={drag}
      disabled={isActive}
      style={[styles.categoryItem, isActive && styles.draggingItem]}
    >
      <View style={styles.dragHandle}>
        <Icon name="drag-vertical" size={24} color="#666" />
      </View>
      <View style={styles.categoryDetails}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryIcon}>Icon: {item.icon}</Text>
        <Text style={styles.categoryId}>ID: {item.id}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditCategory(item)}
        >
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCategory(item.id)}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.orderBadge}>#{item.displayOrder !== undefined ? item.displayOrder + 1 : '?'}</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.title}>Manage Categories</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <DraggableFlatList
          data={categories}
          onDragEnd={handleDragEnd}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 1 }}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No categories found</Text>
          )}
        />
      )}
      <Toast />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  categoryItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  draggingItem: {
    backgroundColor: '#f5f5f5',
    elevation: 5,
  },
  dragHandle: {
    marginRight: 10,
  },
  categoryDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 14,
    color: '#666',
  },
  categoryId: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    padding: 10,
  },
  orderBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ccc',
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
});

export default ManageCategoriesScreen; 