import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../models/collections';
import { sampleCategories } from '../data/sampleProducts';

export const uploadProducts = async (selectedProducts = []) => {
  try {
    console.log('Starting data upload...', selectedProducts);

    let results = {
      products: { added: 0, skipped: 0 },
      categories: { added: 0, skipped: 0 }
    };

    // Upload Categories (only unique categories from selected products)
    const uniqueCategories = [...new Set(selectedProducts.map(p => p.categoryId))];
    console.log('Unique categories:', uniqueCategories);

    const relevantCategories = sampleCategories.filter(cat => 
      uniqueCategories.includes(cat.name.toLowerCase().replace(/\s+/g, '-'))
    );
    console.log('Relevant categories:', relevantCategories);

    // Upload Categories
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const existingCategoriesSnapshot = await getDocs(categoriesRef);
    const existingCategoryNames = existingCategoriesSnapshot.docs.map(doc => 
      doc.data().name.toLowerCase().replace(/\s+/g, '-')
    );
    console.log('Existing categories:', existingCategoryNames);

    for (const category of relevantCategories) {
      const categoryId = category.name.toLowerCase().replace(/\s+/g, '-');
      if (existingCategoryNames.includes(categoryId)) {
        console.log('Skipping category (already exists):', category.name);
        results.categories.skipped++;
        continue;
      }
      await addDoc(categoriesRef, {
        ...category,
        id: categoryId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Added category:', category.name);
      results.categories.added++;
    }

    // Upload Selected Products
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    const existingProductsSnapshot = await getDocs(productsRef);
    const existingProductNames = existingProductsSnapshot.docs.map(doc => 
      doc.data().name.toLowerCase().trim()
    );
    console.log('Existing products:', existingProductNames);

    for (const product of selectedProducts) {
      console.log('Processing product:', product.name);
      const normalizedProduct = {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (existingProductNames.includes(normalizedProduct.name.toLowerCase().trim())) {
        console.log('Skipping product (already exists):', product.name);
        results.products.skipped++;
        continue;
      }

      await addDoc(productsRef, normalizedProduct);
      console.log('Added product:', product.name);
      results.products.added++;
    }

    console.log('Upload complete with results:', results);
    return {
      success: true,
      ...results
    };

  } catch (error) {
    console.error('Error uploading data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(productRef);
    console.log('Product deleted:', productId);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}; 