export const sampleCategories = [
  {
    name: 'Smartphones',
    icon: 'cellphone',
    image: 'https://example.com/smartphones.jpg',
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Laptops',
    icon: 'laptop',
    image: 'https://example.com/laptops.jpg',
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Accessories',
    icon: 'headphones',
    image: 'https://example.com/accessories.jpg',
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'smarthome',
    icon: 'home-automation',
    image: 'https://example.com/smarthome.jpg',
    isActive: true,
    displayOrder: 4
  }
];

export const sampleProducts = [
  // Smartphones Category
  {
    name: 'iPhone 13 Pro',
    price: 89999,
    description: 'Latest iPhone with Pro camera system',
    image: 'https://example.com/iphone13pro.jpg',
    categoryId: 'smartphones',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: true,
    brand: 'Apple',
    specifications: {
      screen: '6.1 inch',
      processor: 'A15 Bionic',
      storage: '128GB'
    },
    stock: 50,
    rating: 4.5,
    reviewCount: 128
  },
  {
    name: 'Samsung Galaxy S23 Ultra',
    price: 124999,
    description: 'Ultimate Android flagship with S Pen',
    image: 'https://res.cloudinary.com/diqqsuiv5/image/upload/v1739901403/wn3ytymoykmiljwhuctf.jpg',
    categoryId: 'smartphones',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: true,
    brand: 'Samsung',
    specifications: {
      screen: '6.8 inch',
      processor: 'Snapdragon 8 Gen 2',
      storage: '256GB'
    },
    stock: 40,
    rating: 4.6,
    reviewCount: 95
  },
  {
    name: 'Google Pixel 7 Pro',
    price: 84999,
    description: 'Experience Android at its finest',
    image: 'https://example.com/pixel7pro.jpg',
    categoryId: 'smartphones',
    isAvailable: true,
    featured: true,
    trending: false,
    isNewArrival: true,
    brand: 'Google',
    specifications: {
      screen: '6.7 inch',
      processor: 'Google Tensor G2',
      storage: '128GB'
    },
    stock: 35,
    rating: 4.4,
    reviewCount: 78
  },
  {
    name: 'OnePlus 11',
    price: 56999,
    description: 'Never Settle for less',
    image: 'https://example.com/oneplus11.jpg',
    categoryId: 'smartphones',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'OnePlus',
    specifications: {
      screen: '6.7 inch',
      processor: 'Snapdragon 8 Gen 2',
      storage: '128GB'
    },
    stock: 45,
    rating: 4.3,
    reviewCount: 92
  },
  {
    name: 'Nothing Phone 2',
    price: 44999,
    description: 'Unique design with Glyph interface',
    image: 'https://example.com/nothingphone2.jpg',
    categoryId: 'smartphones',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'Nothing',
    specifications: {
      screen: '6.7 inch',
      processor: 'Snapdragon 8+ Gen 1',
      storage: '128GB'
    },
    stock: 30,
    rating: 4.2,
    reviewCount: 65
  },

  // Laptops Category
  {
    name: 'MacBook Air M2',
    price: 114900,
    description: 'Incredibly thin design with M2 power',
    image: 'https://example.com/macbookairm2.jpg',
    categoryId: 'laptops',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: true,
    brand: 'Apple',
    specifications: {
      screen: '13.6 inch',
      processor: 'Apple M2',
      storage: '256GB'
    },
    stock: 25,
    rating: 4.8,
    reviewCount: 86
  },
  {
    name: 'Dell XPS 15',
    price: 179990,
    description: 'Premium powerhouse laptop',
    image: 'https://example.com/xps15.jpg',
    categoryId: 'laptops',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: false,
    brand: 'Dell',
    specifications: {
      screen: '15.6 inch',
      processor: 'Intel i9 13th Gen',
      storage: '1TB'
    },
    stock: 20,
    rating: 4.7,
    reviewCount: 54
  },
  {
    name: 'Lenovo Legion Pro 5',
    price: 139990,
    description: 'Ultimate gaming laptop',
    image: 'https://example.com/legionpro5.jpg',
    categoryId: 'laptops',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'Lenovo',
    specifications: {
      screen: '16 inch',
      processor: 'AMD Ryzen 9',
      storage: '1TB'
    },
    stock: 15,
    rating: 4.5,
    reviewCount: 42
  },
  {
    name: 'HP Spectre x360',
    price: 129990,
    description: 'Premium convertible laptop',
    image: 'https://example.com/spectrex360.jpg',
    categoryId: 'laptops',
    isAvailable: true,
    featured: true,
    trending: false,
    isNewArrival: true,
    brand: 'HP',
    specifications: {
      screen: '14 inch',
      processor: 'Intel i7 13th Gen',
      storage: '512GB'
    },
    stock: 18,
    rating: 4.6,
    reviewCount: 38
  },
  {
    name: 'ASUS ROG Zephyrus G14',
    price: 149990,
    description: 'Compact gaming powerhouse',
    image: 'https://example.com/zephyrusg14.jpg',
    categoryId: 'laptops',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'ASUS',
    specifications: {
      screen: '14 inch',
      processor: 'AMD Ryzen 9',
      storage: '1TB'
    },
    stock: 22,
    rating: 4.4,
    reviewCount: 47
  },

  // Accessories Category
  {
    name: 'AirPods Pro 2',
    price: 26900,
    description: 'Premium wireless earbuds with ANC',
    image: 'https://example.com/airpodspro2.jpg',
    categoryId: 'accessories',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: true,
    brand: 'Apple',
    specifications: {
      battery: '30 hours with case',
      connectivity: 'Bluetooth 5.3',
      features: 'ANC, Transparency mode'
    },
    stock: 100,
    rating: 4.8,
    reviewCount: 156
  },
  {
    name: 'Samsung Galaxy Watch 6',
    price: 34999,
    description: 'Advanced health tracking smartwatch',
    image: 'https://example.com/galaxywatch6.jpg',
    categoryId: 'accessories',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: true,
    brand: 'Samsung',
    specifications: {
      display: '1.4 inch AMOLED',
      battery: '425mAh',
      sensors: 'Heart rate, ECG, BIA'
    },
    stock: 45,
    rating: 4.6,
    reviewCount: 89
  },
  {
    name: 'Sony WH-1000XM5',
    price: 29990,
    description: 'Premium noise-cancelling headphones',
    image: 'https://example.com/wh1000xm5.jpg',
    categoryId: 'accessories',
    isAvailable: true,
    featured: true,
    trending: false,
    isNewArrival: true,
    brand: 'Sony',
    specifications: {
      battery: '30 hours',
      connectivity: 'Bluetooth 5.2',
      features: 'LDAC, ANC'
    },
    stock: 60,
    rating: 4.7,
    reviewCount: 112
  },
  {
    name: 'Apple Watch Ultra',
    price: 89900,
    description: 'Rugged smartwatch for adventurers',
    image: 'https://example.com/watchultra.jpg',
    categoryId: 'accessories',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: false,
    brand: 'Apple',
    specifications: {
      display: '49mm Always-On',
      battery: '36 hours',
      features: 'GPS, Cellular'
    },
    stock: 30,
    rating: 4.9,
    reviewCount: 78
  },
  {
    name: 'Logitech MX Master 3S',
    price: 9995,
    description: 'Premium wireless mouse',
    image: 'https://example.com/mxmaster3s.jpg',
    categoryId: 'accessories',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'Logitech',
    specifications: {
      sensor: '8000 DPI',
      battery: '70 days',
      connectivity: 'Bluetooth/USB'
    },
    stock: 75,
    rating: 4.5,
    reviewCount: 94
  },

  // smarthome Category
  {
    name: 'Amazon Echo Show 10',
    price: 24999,
    description: 'Smart display with motion',
    image: 'https://example.com/echoshow10.jpg',
    categoryId: 'smarthome',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: true,
    brand: 'Amazon',
    specifications: {
      display: '10.1 inch HD',
      speaker: '2x tweeters, woofer',
      features: 'Alexa, Camera'
    },
    stock: 40,
    rating: 4.6,
    reviewCount: 87
  },
  {
    name: 'Philips Hue Starter Kit',
    price: 12999,
    description: 'Smart lighting system with bridge',
    image: 'https://example.com/philipshue.jpg',
    categoryId: 'smarthome',
    isAvailable: true,
    featured: true,
    trending: true,
    isNewArrival: false,
    brand: 'Philips',
    specifications: {
      bulbs: '3x LED Color',
      bridge: 'Hue Bridge v2',
      compatibility: 'Alexa, Google Assistant'
    },
    stock: 35,
    rating: 4.5,
    reviewCount: 92
  },
  {
    name: 'Google Nest Thermostat',
    price: 19999,
    description: 'Smart temperature control',
    image: 'https://example.com/nestthermostat.jpg',
    categoryId: 'smarthome',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'Google',
    specifications: {
      display: 'Mirror-finish',
      sensors: 'Temperature, Humidity',
      features: 'Energy saving'
    },
    stock: 25,
    rating: 4.4,
    reviewCount: 67
  },
  {
    name: 'Ring Video Doorbell Pro',
    price: 18999,
    description: 'Advanced video doorbell',
    image: 'https://example.com/ringpro.jpg',
    categoryId: 'smarthome',
    isAvailable: true,
    featured: true,
    trending: false,
    isNewArrival: true,
    brand: 'Ring',
    specifications: {
      resolution: '1080p HD',
      power: 'Hardwired',
      features: 'Night vision, Two-way talk'
    },
    stock: 30,
    rating: 4.3,
    reviewCount: 76
  },
  {
    name: 'Xiaomi Robot Vacuum',
    price: 29999,
    description: 'Smart robot vacuum and mop',
    image: 'https://example.com/xiaomivacuum.jpg',
    categoryId: 'smarthome',
    isAvailable: true,
    featured: false,
    trending: true,
    isNewArrival: true,
    brand: 'Xiaomi',
    specifications: {
      suction: '2500Pa',
      battery: '5200mAh',
      features: 'LiDAR navigation'
    },
    stock: 20,
    rating: 4.2,
    reviewCount: 58
  }
]; 