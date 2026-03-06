import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    state: "",
    city: "",
    apartment: "",
    area: "",
    landmark: "",
    pincode: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Enhanced Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/;
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password = 'Password must contain at least:\n' +
        '- 6 characters\n' +
        '- One uppercase letter\n' +
        '- One number\n' +
        '- One special character (!@#$%^&*)';
    }
    
    // Confirm Password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Name validation with no numbers or special characters
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!nameRegex.test(form.firstName)) {
      newErrors.firstName = 'First name should only contain letters';
    }
    
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!nameRegex.test(form.lastName)) {
      newErrors.lastName = 'Last name should only contain letters';
    }

    // Location validation with no numbers or special characters
    if (!form.area.trim()) {
      newErrors.area = 'Area is required';
    } else if (!nameRegex.test(form.area)) {
      newErrors.area = 'Area should only contain letters';
    }

    if (form.landmark.trim() && !nameRegex.test(form.landmark)) {
      newErrors.landmark = 'Landmark should only contain letters';
    }

    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    } else if (!nameRegex.test(form.city)) {
      newErrors.city = 'City should only contain letters';
    }
    
    // Phone validation
    if (!form.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = 'Enter valid 10-digit phone number';
    }
    
    // Address validation
    if (!form.apartment.trim()) newErrors.apartment = 'Apartment/House no. is required';
    if (!form.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }
    
    // Add state validation with letters only
    if (!form.state.trim()) {
      newErrors.state = 'State is required';
    } else if (!nameRegex.test(form.state)) {
      newErrors.state = 'State should only contain letters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPasswordStrength = (password) => {
    const validations = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    
    const messages = [];
    if (!validations.length) messages.push('At least 6 characters');
    if (!validations.uppercase) messages.push('One uppercase letter');
    if (!validations.number) messages.push('One number');
    if (!validations.special) messages.push('One special character (!@#$%^&*)');
    
    return {
      isValid: messages.length === 0,
      messages
    };
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    
    if (key === 'password') {
      const { messages } = checkPasswordStrength(value);
      if (messages.length > 0) {
        setErrors(prev => ({
          ...prev,
          password: 'Still needed:\n- ' + messages.join('\n- ')
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          password: 'Password meets all requirements! ✓'
        }));
      }
      
      // Also update confirm password validation if it exists
      if (form.confirmPassword) {
        if (form.confirmPassword !== value) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords match!'
          }));
        }
      }
    }
    
    // Existing confirm password logic
    if (key === 'confirmPassword') {
      if (!value) {
        setErrors(prev => ({ ...prev, confirmPassword: null }));
      } else if (value !== form.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords match!' }));
      }
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      Toast.show({ type: "error", text1: "Please fix the errors in the form" });
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      
      // Create the initial address object with proper structure
      const initialAddress = {
        id: 'signup-address', // Special ID for signup address
        type: 'Home', // Default type
        isDefault: true, // Mark as default address
        apartment: form.apartment,
        area: form.area,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        pincode: form.pincode
      };

      // Create user document with both address fields and addresses array
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...form,
        addresses: [initialAddress] // Add the address to the addresses array
      });

      Toast.show({ type: "success", text1: "Account Created Successfully!" });
      navigation.replace("MainApp");
    } catch (error) {
      Toast.show({ type: "error", text1: "Signup Failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (key, placeholder, keyboardType = 'default', isPassword = false, iconName = null) => (
    <View style={styles.inputContainer} key={key}>
      <View style={styles.inputWrapper}>
        {iconName && (
          <Icon name={iconName} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
        )}
        {isPassword ? (
          <>
            <TextInput
              placeholder={`Enter ${placeholder}`}
              placeholderTextColor={COLORS.textTertiary}
              style={[
                styles.passwordInput,
                errors[key] && 
                key === 'password' && 
                errors[key] !== 'Password meets all requirements! ✓' && 
                styles.inputError
              ]}
              value={form[key]}
              onChangeText={(text) => handleChange(key, text)}
              secureTextEntry={!showPassword}
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
          </>
        ) : (
          <TextInput
            placeholder={`Enter ${placeholder}`}
            placeholderTextColor={COLORS.textTertiary}
            style={[styles.input, errors[key] && styles.inputError]}
            value={form[key]}
            onChangeText={(text) => handleChange(key, text)}
            keyboardType={keyboardType}
          />
        )}
      </View>
      {errors[key] && (
        <Text style={[
          styles.errorText,
          (key === 'confirmPassword' && errors[key] === 'Passwords match!') ||
          (key === 'password' && errors[key] === 'Password meets all requirements! ✓')
            ? styles.successText
            : styles.errorText
        ]}>
          {errors[key]}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join The Apex Store today</Text>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
        
        {renderInput('email', 'Email', 'email-address', false, 'email')}
        {renderInput('password', 'Password', 'default', true, 'lock')}
        {renderInput('confirmPassword', 'Confirm Password', 'default', true, 'lock-check')}
        {renderInput('firstName', 'First Name', 'default', false, 'account')}
        {renderInput('lastName', 'Last Name', 'default', false, 'account-outline')}
        {renderInput('phoneNumber', 'Phone Number', 'numeric', false, 'phone')}
        {renderInput('state', 'State', 'default', false, 'map-marker')}
        {renderInput('city', 'City', 'default', false, 'city')}
        {renderInput('apartment', 'Apartment/House No.', 'default', false, 'home')}
        {renderInput('area', 'Area', 'default', false, 'map')}
        {renderInput('landmark', 'Landmark', 'default', false, 'map-marker-outline')}
        {renderInput('pincode', 'Pincode', 'numeric', false, 'mailbox')}

        <TouchableOpacity 
          onPress={handleSignup} 
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? [COLORS.textTertiary, COLORS.textTertiary] : [COLORS.primary, COLORS.primaryLight]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{loading ? 'SIGNING UP...' : 'SIGN UP'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
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
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
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
  successText: {
    color: COLORS.success,
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
  loginLink: {
    textAlign: 'center',
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 40,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
