import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
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
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigation.replace("MainApp");
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
      });
    } catch (error) {
      attemptCount.current += 1;
      lastAttemptTime.current = now;
      
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Background */}
      <View style={styles.waveContainer}>
        <View style={styles.waveGradient} />
      </View>

      {/* Logo and Welcome Text */}
      <View style={styles.logoContainer}>
        <Image 
          source={require("../assets/theapexlogo.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="email-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
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
            <Icon name="lock-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.passwordInput}
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
                size={22} 
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
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
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
    marginTop: height * 0.1,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 180,
    height: 180,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
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
  eyeIcon: {
    padding: 8,
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
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.small,
    marginTop: 8,
    marginLeft: 15,
  },
});

export default LoginScreen;
