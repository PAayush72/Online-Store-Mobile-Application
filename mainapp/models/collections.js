// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  CARTS: 'carts',
  FOOD_COUNTERS: 'food_counters',
};

// These comments serve as documentation for the expected object structures
/**
 * @typedef {Object} Product
 * @property {string} [id]
 * @property {string} name
 * @property {number} price
 * @property {string} description
 * @property {string} image
 * @property {string} categoryId
 * @property {boolean} isAvailable
 * @property {boolean} featured
 * @property {boolean} trending
 * @property {boolean} isNewArrival
 * @property {boolean} onSale
 * @property {number} [discountPercentage]
 * @property {string} brand
 * @property {Object} specifications
 * @property {number} stock
 * @property {number} rating
 * @property {number} reviewCount
 */

/**
 * @typedef {Object} Category
 * @property {string} [id]
 * @property {string} name
 * @property {string} icon
 * @property {string} image
 * @property {boolean} isActive
 * @property {number} displayOrder
 */

/**
 * @typedef {Object} CartItem
 * @property {string} productId
 * @property {number} quantity
 * @property {number} price
 * @property {string} name
 * @property {string} image
 */

/**
 * @typedef {Object} Cart
 * @property {string} [id]
 * @property {string} userId
 * @property {CartItem[]} items
 * @property {number} total
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Order
 * @property {string} [id]
 * @property {string} userId
 * @property {CartItem[]} items
 * @property {number} total
 * @property {('pending'|'confirmed'|'shipped'|'delivered'|'cancelled')} status
 * @property {Date} createdAt
 * @property {Date} [deliveredAt]
 * @property {string} paymentMethod
 * @property {string} paymentStatus
 * @property {Object} shippingAddress
 */

/**
 * @typedef {Object} User
 * @property {string} [id]
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} phoneNumber
 * @property {Object[]} addresses
 * @property {string} addresses.type
 * @property {string} addresses.address
 * @property {string} addresses.area
 * @property {string} [addresses.landmark]
 * @property {string} addresses.city
 * @property {string} addresses.state
 * @property {string} addresses.pincode
 * @property {boolean} addresses.isDefault
 * @property {string[]} wishlist
 * @property {Date} createdAt
 * @property {string} [profileImage]
 */ 