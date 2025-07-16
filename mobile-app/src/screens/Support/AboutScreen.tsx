import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  About: undefined;
};

type AboutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

interface Props {
  navigation: AboutScreenNavigationProp;
}

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  const handleOpenWebsite = () => {
    Linking.openURL('https://telemedicine.com');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://telemedicine.com/privacy');
  };

  const handleOpenTermsOfService = () => {
    Linking.openURL('https://telemedicine.com/terms');
  };

  const handleOpenLicenses = () => {
    // In a real app, this would show open source licenses
    navigation.navigate('Help' as any);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={64} color="#2a70e0" />
        </View>
        <Text style={styles.appName}>Telemedicine Platform</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appDescription}>
          Connecting patients with healthcare providers through secure, convenient telemedicine services.
        </Text>
      </View>

      {/* Company Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Our Platform</Text>
        <Text style={styles.sectionText}>
          Our telemedicine platform is designed to make healthcare more accessible and convenient. 
          We connect patients with qualified healthcare providers through secure video consultations, 
          appointment scheduling, and comprehensive health management tools.
        </Text>
        
        <Text style={styles.sectionSubtitle}>Key Features:</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.featureText}>Secure video consultations</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.featureText}>Easy appointment scheduling</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.featureText}>Medical records management</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.featureText}>24/7 healthcare access</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.featureText}>HIPAA compliant security</Text>
          </View>
        </View>
      </View>

      {/* Company Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Founded:</Text>
          <Text style={styles.infoValue}>2023</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Headquarters:</Text>
          <Text style={styles.infoValue}>San Francisco, CA</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Mission:</Text>
          <Text style={styles.infoValue}>
            To democratize healthcare access through innovative telemedicine solutions
          </Text>
        </View>
      </View>

      {/* Contact & Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Links</Text>
        
        <TouchableOpacity style={styles.linkItem} onPress={handleOpenWebsite}>
          <Ionicons name="globe-outline" size={24} color="#2a70e0" />
          <Text style={styles.linkText}>Visit our website</Text>
          <Ionicons name="open-outline" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenPrivacyPolicy}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#2a70e0" />
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenTermsOfService}>
          <Ionicons name="document-text-outline" size={24} color="#2a70e0" />
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="open-outline" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenLicenses}>
          <Ionicons name="code-outline" size={24} color="#2a70e0" />
          <Text style={styles.linkText}>Open Source Licenses</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Technical Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Information</Text>
        
        <View style={styles.techItem}>
          <Text style={styles.techLabel}>Platform:</Text>
          <Text style={styles.techValue}>React Native with Expo</Text>
        </View>
        
        <View style={styles.techItem}>
          <Text style={styles.techLabel}>Backend:</Text>
          <Text style={styles.techValue}>Node.js with Express</Text>
        </View>
        
        <View style={styles.techItem}>
          <Text style={styles.techLabel}>Database:</Text>
          <Text style={styles.techValue}>MongoDB</Text>
        </View>
        
        <View style={styles.techItem}>
          <Text style={styles.techLabel}>Security:</Text>
          <Text style={styles.techValue}>HIPAA Compliant</Text>
        </View>
      </View>

      {/* Credits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credits</Text>
        <Text style={styles.creditsText}>
          Built with care by our development team. Special thanks to all the healthcare 
          professionals who provided guidance and feedback during development.
        </Text>
      </View>

      {/* Copyright */}
      <View style={styles.footer}>
        <Text style={styles.copyrightText}>
          © 2023 Telemedicine Platform. All rights reserved.
        </Text>
        <Text style={styles.buildInfo}>
          Build: 1.0.0 (2023-12-01)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f8ff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 12,
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#2a70e0',
    flex: 1,
  },
  techItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  techLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    width: 80,
  },
  techValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  creditsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  buildInfo: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default AboutScreen;
