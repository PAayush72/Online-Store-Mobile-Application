# ThapaStore - E-Commerce Application

A comprehensive React Native e-commerce application built with Expo, featuring customer, admin, and delivery partner apps.

## 📱 Project Structure

```
aayushsend2/
├── mainapp/          # Main application (customer & admin)
│   ├── screens/      # App screens
│   ├── components/   # Reusable components
│   ├── context/      # State management
│   ├── services/     # API services
│   ├── utils/        # Utility functions
│   └── constants/    # App constants
│
└── delivery/         # Delivery partner application
    ├── screens/      # Delivery screens
    ├── components/   # Delivery components
    └── services/     # API services
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aayushsend2
   ```

2. **Set up environment variables**
   ```bash
   # Copy .env.example to .env in both mainapp and delivery directories
   cp .env.example mainapp/.env
   cp .env.example delivery/.env
   ```

3. **Install dependencies**
   ```bash
   cd mainapp
   npm install
   
   cd ../delivery
   npm install
   ```

### Running the App

**Main App:**
```bash
cd mainapp
npm start          # Start Expo
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on Web
```

**Delivery App:**
```bash
cd delivery
npm start
npm run android
```

## 🔐 Security

### Environment Variables
- **Never commit `.env` files** to git
- Always use `.env.example` as a template
- All sensitive data (Firebase keys, API URLs) must be in `.env`
- See `.env.example` for the complete list of required variables

### Firebase Setup
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Get your Firebase credentials
3. Add them to `.env` file (not in source code)
4. Enable: Authentication, Firestore, Storage, Cloud Functions

## 📦 Tech Stack

### Frontend
- **React Native** 0.76.9
- **Expo** 52.0+
- **React Navigation** (Stack, Tabs)
- **React Native Paper** - UI Components
- **Axios** - HTTP Client

### Backend & Services
- **Firebase**
  - Authentication (Email/Password)
  - Firestore (Database)
  - Storage (File uploads)
- **Cloudinary** - Image hosting
- **Razorpay** - Payment processing

### State Management
- React Context API
  - CartContext
  - NotificationContext
  - AppContext

## 🎨 Features

### Main App
- ✅ User Authentication (Login/Signup)
- ✅ Product Browsing & Search
- ✅ Shopping Cart
- ✅ Wishlist
- ✅ Order Management
- ✅ Payment Integration (Razorpay)
- ✅ Order History & Tracking
- ✅ Address Management
- ✅ Admin Panel
  - Product Management
  - Category Management
  - Order Management
  - Dashboard with Analytics

### Delivery App
- ✅ Delivery Order Management
- ✅ Real-time Order Status
- ✅ Notification System

## 📝 Scripts

```bash
# Development
npm start           # Start Expo dev server

# Mobile
npm run android     # Run on Android
npm run ios         # Run on iOS

# Web
npm run web         # Run on Web

# Build (when ready for production)
npm run build       # Build the app
```

## 📂 Key Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (ignored in git) |
| `.env.example` | Template for environment variables |
| `firebaseConfig.js` | Firebase initialization |
| `server.js` | Firebase API functions |
| `models/collections.js` | Firestore collection schemas |

## 🔧 Configuration

### Firebase Configuration
Update `.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// ... other Firebase variables
```

### API Configuration
Update `.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://your-api.com
```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Native Docs](https://reactnative.dev)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📄 License

This project is proprietary. Unauthorized copying is not permitted.

## 👥 Team

- Aayush (Lead Developer)

## 📞 Support

For issues and support, please open an issue on this repository.

## ⚠️ Important Notes

1. **Never share `.env` files publicly**
2. **Regenerate Firebase keys if accidentally exposed**
3. **Keep dependencies updated**: `npm update`
4. **Test on multiple devices** before production
5. **Review security** before deploying to App Store/Play Store

---

**Last Updated:** March 6, 2026
