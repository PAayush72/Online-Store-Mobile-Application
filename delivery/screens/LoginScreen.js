import React, { useState, useRef, useLayoutEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Rate limiting
  const lastAttemptTime = useRef(0);
  const attemptCount = useRef(0);
  const ATTEMPT_LIMIT = 5;
  const COOLDOWN_TIME = 60000; //1 minute

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        try {
          return (
            <Image
              source={require("../assets/theapexlogo.png")}
              style={styles.headerLogo}
              onError={(error) => console.error('Image loading error:', error)}
            />
          );
        } catch (error) {
          console.error('Failed to load logo:', error);
          return <Text>The Apex Store</Text>; // Fallback text
        }
      },
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) {
      setErrors({ ...errors, [key]: null });
    }
  };

  const handleLogin = async () => {
    // Check rate limiting
    const now = Date.now();
    if (attemptCount.current >= ATTEMPT_LIMIT) {
      const timeElapsed = now - lastAttemptTime.current;
      if (timeElapsed < COOLDOWN_TIME) {
        const minutesLeft = Math.ceil((COOLDOWN_TIME - timeElapsed) / 60000);
        Toast.show({
          type: "error",
          text1: "Too many attempts",
          text2: `Please try again in ${minutesLeft} minutes`,
        });
        return;
      } else {
        // Reset attempt count after cooldown
        attemptCount.current = 0;
      }
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // First, authenticate with Firebase Auth
      const response = await signInWithEmailAndPassword(auth, form.email, form.password);
      
      if (response.user) {
        // Check if user is authorized as delivery person
        const userDoc = await getDoc(doc(db, 'users', response.user.uid));
        
        if (!userDoc.exists()) {
          // Sign out if user document doesn't exist
          await signOut(auth);
          Alert.alert(
            "Access Denied",
            "User profile not found. Please contact admin.",
            [{ text: "OK" }]
          );
          return;
        }
        
        const userData = userDoc.data();
        
        // Check if user is a delivery person or admin
        if (!userData.isDeliveryPerson && !userData.isAdmin) {
          // Sign out if not authorized
          await signOut(auth);
          Alert.alert(
            "Unauthorized Access",
            "You are not authorized to access this delivery application. This app is only for delivery personnel.",
            [{ text: "OK" }]
          );
          return;
        }
        
        // User is authorized, navigate to Home
        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: `Welcome ${userData.firstName}!`
        });
        
        navigation.replace('Home');
      }
    } catch (error) {
      attemptCount.current += 1;
      lastAttemptTime.current = now;
      
      console.error("Login error:", error);
      
      let errorMessage = "Invalid email or password";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled";
      }
      
      Alert.alert(
        "Login Failed",
        errorMessage,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Background */}
      <View style={styles.waveContainer}>
        <View style={styles.waveGradient}>
          <View style={styles.logoContainer}>
            <Text style={styles.welcomeText}>Welcome Delivery Partner!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
        </View>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {/* Logo between subtitle and form */}
        <View style={styles.centerLogoContainer}>
          <Image
            source={require("../assets/theapexlogo.png")}
            style={styles.centerLogo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="email" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter Email"
              placeholderTextColor={COLORS.textTertiary}
              style={[styles.input, errors.email && styles.inputError]}
              value={form.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="lock" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter Password"
              placeholderTextColor={COLORS.textTertiary}
              style={[styles.passwordInput, errors.password && styles.inputError]}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon 
                name={showPassword ? "eye-off" : "eye"} 
                size={24} 
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <TouchableOpacity 
          onPress={handleLogin} 
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? [COLORS.textTertiary, COLORS.textTertiary] : [COLORS.primary, COLORS.primaryLight]}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.signupText}>
            New user? <Text style={styles.signupLink}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  waveGradient: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.12,
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: height * 0.38,
  },
  centerLogoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  centerLogo: {
    width: 120,
    height: 120,
  },
  welcomeText: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    height: SIZES.inputHeight,
    ...SHADOWS.small,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
  },
  passwordInput: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.small,
    marginTop: 8,
    marginLeft: 15,
  },
  button: {
    marginTop: 30,
    marginBottom: 20,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  buttonGradient: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
  },
  signupText: {
    textAlign: 'center',
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  signupLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
