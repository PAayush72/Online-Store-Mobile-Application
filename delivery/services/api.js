import axios from 'axios';

// Load API URL from environment variables
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

// Product APIs
export const productAPI = {
  addProduct: async (productData) => {
    try {
      const response = await axios.post(`${BASE_URL}/products`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProducts: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/products`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await axios.put(`${BASE_URL}/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Category APIs
export const categoryAPI = {
  addCategory: async (categoryData) => {
    try {
      const response = await axios.post(`${BASE_URL}/categories`, categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/categories`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await axios.put(`${BASE_URL}/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
}; 