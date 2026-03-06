import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image,
  TouchableOpacity,
  Linking 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AboutUs = () => {
  const developers = [
    {
      name: 'Deev Patel',
      role: 'Lead Developer',
      description: 'Full-stack developer specializing in React Native and Firebase integration.',
      linkedin: 'https://www.linkedin.com/in/deev-patel',
      github: 'https://github.com/deev-patel',
      email: 'deev.patel@example.com'
    },
    {
      name: 'Aayush Panchal',
      role: 'Lead Developer',
      description: 'UI/UX specialist with expertise in mobile app development and user experience design.',
      linkedin: 'https://www.linkedin.com/in/aayush-panchal',
      github: 'https://github.com/aayush-panchal',
      email: 'aayush.panchal@example.com'
    }
  ];

  const handleLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <Icon name="information" size={40} color={COLORS.white} />
        <Text style={styles.headerTitle}>About Us</Text>
        <Text style={styles.headerSubtitle}>
          Meet the team behind The Apex Store
        </Text>
      </LinearGradient>

      <View style={styles.appInfo}>
        <LinearGradient
          colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
          style={styles.appInfoGradient}
        >
          <Icon name="store" size={32} color={COLORS.primary} style={{ marginBottom: 10 }} />
          <Text style={styles.appTitle}>The Apex Store</Text>
          <Text style={styles.appDescription}>
            A comprehensive solution for managing your shopping needs efficiently and safely.
            Built with modern technologies to provide the best user experience.
          </Text>
        </LinearGradient>
      </View>

      <Text style={styles.teamTitle}>Development Team</Text>

      {developers.map((developer, index) => (
        <View key={index} style={styles.developerCard}>
          <LinearGradient
            colors={[COLORS.backgroundCard, COLORS.backgroundSecondary]}
            style={styles.developerCardGradient}
          >
            <View style={styles.developerHeader}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.avatarContainer}
              >
                <Text style={styles.avatarText}>
                  {developer.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </LinearGradient>
              <View style={styles.developerInfo}>
                <Text style={styles.developerName}>{developer.name}</Text>
                <Text style={styles.developerRole}>{developer.role}</Text>
              </View>
            </View>
            
            <Text style={styles.developerDescription}>
              {developer.description}
            </Text>

            <View style={styles.socialLinks}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleLink(developer.linkedin)}
              >
                <Icon name="linkedin" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleLink(developer.github)}
              >
                <Icon name="github" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleLink(`mailto:${developer.email}`)}
              >
                <Icon name="email" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      ))}

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 All rights reserved</Text>
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
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginTop: 5,
    opacity: 0.9,
  },
  appInfo: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  appInfoGradient: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  appDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  teamTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    margin: SIZES.margin,
    marginTop: 20,
  },
  developerCard: {
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  developerCardGradient: {
    padding: SIZES.padding,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  developerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  developerName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  developerRole: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginTop: 2,
  },
  developerDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 15,
  },
  socialButton: {
    padding: 10,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 25,
    ...SHADOWS.small,
  },
  versionInfo: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  copyrightText: {
    fontSize: SIZES.small,
    color: COLORS.textTertiary,
    marginTop: 5,
  },
});

export default AboutUs; 