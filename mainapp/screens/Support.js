import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Support = () => {
  const handleContact = (type, value) => {
    let url = '';
    switch(type) {
      case 'phone':
        url = `tel:${value}`;
        break;
      case 'email':
        url = `mailto:${value}`;
        break;
      case 'whatsapp':
        url = `whatsapp://send?phone=${value}`;
        break;
    }

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: `Can't open ${type} right now`
          });
        }
      })
      .catch(err => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message
        });
      });
  };

  const supportItems = [
    {
      title: 'Customer Service',
      icon: 'headphones',
      value: '+91 9876543210',
      type: 'phone',
      description: 'Available 24/7 for your queries'
    },
    {
      title: 'WhatsApp Support',
      icon: 'whatsapp',
      value: '+919876543210',
      type: 'whatsapp',
      description: 'Chat with us on WhatsApp'
    },
    {
      title: 'Email Support',
      icon: 'email',
      value: 'support@thapastore.com',
      type: 'email',
      description: 'We usually respond within 24 hours'
    }
  ];

  const faqItems = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order in the "My Orders" section of your account.'
    },
    {
      question: 'What are your delivery timings?',
      answer: 'We deliver from 10 AM to 8 PM, seven days a week.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer refunds within 7 days of delivery if the product is unused and in original packaging.'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <Icon name="help-circle" size={48} color={COLORS.white} />
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>We're here to help you 24/7</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        
        {supportItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.supportItem}
            onPress={() => handleContact(item.type, item.value)}
          >
            <LinearGradient
              colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
              style={styles.supportItemGradient}
            >
              <View style={styles.supportItemHeader}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  style={styles.iconContainer}
                >
                  <Icon name={item.icon} size={24} color={COLORS.white} />
                </LinearGradient>
                <View style={styles.supportItemText}>
                  <Text style={styles.supportItemTitle}>{item.title}</Text>
                  <Text style={styles.supportItemValue}>{item.value}</Text>
                </View>
                <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.supportItemDescription}>{item.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="frequently-asked-questions" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>
        {faqItems.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <LinearGradient
              colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
              style={styles.faqItemGradient}
            >
              <View style={styles.faqQuestionContainer}>
                <Icon name="help-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="map-marker" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Store Address</Text>
        </View>
        <View style={styles.addressCard}>
          <LinearGradient
            colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
            style={styles.addressCardGradient}
          >
            <Icon name="store" size={32} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.storeName}>The Apex Store Headquarters</Text>
            <Text style={styles.addressText}>
              123 Tech Park, Silicon Valley{'\n'}
              Bangalore, Karnataka 560001{'\n'}
              India
            </Text>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginTop: 8,
    opacity: 0.9,
  },
  section: {
    padding: SIZES.padding,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  supportItem: {
    borderRadius: SIZES.radius,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  supportItemGradient: {
    padding: SIZES.padding,
  },
  supportItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  supportItemText: {
    marginLeft: 12,
    flex: 1,
  },
  supportItemTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  supportItemValue: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginTop: 2,
  },
  supportItemDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 60,
  },
  faqItem: {
    borderRadius: SIZES.radius,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  faqItemGradient: {
    padding: SIZES.padding,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  faqAnswer: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginLeft: 28,
  },
  addressCard: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  addressCardGradient: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  storeName: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  addressText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  }
});

export default Support; 