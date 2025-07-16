import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Help: undefined;
};

type HelpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Help'>;

interface Props {
  navigation: HelpScreenNavigationProp;
}

const HelpScreen: React.FC<Props> = ({ navigation }) => {
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact our support team:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email', 
          onPress: () => Linking.openURL('mailto:support@telemedicine.com')
        },
        { 
          text: 'Phone', 
          onPress: () => Linking.openURL('tel:+1234567890')
        }
      ]
    );
  };

  const handleOpenFAQ = () => {
    // In a real app, this would navigate to an FAQ page or open a web browser
    Alert.alert('FAQ', 'Frequently Asked Questions would be displayed here.');
  };

  const handleUserGuide = () => {
    // In a real app, this would navigate to a user guide or tutorial
    Alert.alert('User Guide', 'User guide and tutorials would be displayed here.');
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Issue reporting form would be displayed here.');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="help-circle" size={64} color="#2a70e0" />
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>
          We're here to help you get the most out of our telemedicine platform
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.helpItem} onPress={handleContactSupport}>
          <View style={styles.helpItemLeft}>
            <Ionicons name="headset" size={24} color="#2a70e0" />
            <View style={styles.helpItemText}>
              <Text style={styles.helpItemTitle}>Contact Support</Text>
              <Text style={styles.helpItemDescription}>
                Get in touch with our support team
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpItem} onPress={handleOpenFAQ}>
          <View style={styles.helpItemLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#2a70e0" />
            <View style={styles.helpItemText}>
              <Text style={styles.helpItemTitle}>Frequently Asked Questions</Text>
              <Text style={styles.helpItemDescription}>
                Find answers to common questions
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpItem} onPress={handleUserGuide}>
          <View style={styles.helpItemLeft}>
            <Ionicons name="book-outline" size={24} color="#2a70e0" />
            <View style={styles.helpItemText}>
              <Text style={styles.helpItemTitle}>User Guide</Text>
              <Text style={styles.helpItemDescription}>
                Learn how to use the app effectively
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpItem} onPress={handleReportIssue}>
          <View style={styles.helpItemLeft}>
            <Ionicons name="bug-outline" size={24} color="#2a70e0" />
            <View style={styles.helpItemText}>
              <Text style={styles.helpItemTitle}>Report an Issue</Text>
              <Text style={styles.helpItemDescription}>
                Let us know about any problems you encounter
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Common Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common Topics</Text>
        
        <View style={styles.topicItem}>
          <Text style={styles.topicTitle}>How to book an appointment?</Text>
          <Text style={styles.topicText}>
            Go to the Doctors tab, select a doctor, and choose an available time slot.
          </Text>
        </View>

        <View style={styles.topicItem}>
          <Text style={styles.topicTitle}>How to join a video consultation?</Text>
          <Text style={styles.topicText}>
            When it's time for your appointment, you'll see a "Join Video Call" button in your appointments.
          </Text>
        </View>

        <View style={styles.topicItem}>
          <Text style={styles.topicTitle}>How to cancel an appointment?</Text>
          <Text style={styles.topicText}>
            Go to your appointments, select the appointment you want to cancel, and tap "Cancel Appointment".
          </Text>
        </View>

        <View style={styles.topicItem}>
          <Text style={styles.topicTitle}>How to update my profile?</Text>
          <Text style={styles.topicText}>
            Go to the Profile tab and tap "Edit Profile" to update your information.
          </Text>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.contactItem}>
          <Ionicons name="mail" size={20} color="#666" />
          <Text style={styles.contactText}>support@telemedicine.com</Text>
        </View>

        <View style={styles.contactItem}>
          <Ionicons name="call" size={20} color="#666" />
          <Text style={styles.contactText}>+1 (555) 123-4567</Text>
        </View>

        <View style={styles.contactItem}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.contactText}>Support Hours: 24/7</Text>
        </View>
      </View>

      {/* Emergency Notice */}
      <View style={styles.emergencySection}>
        <Ionicons name="warning" size={24} color="#dc3545" />
        <Text style={styles.emergencyTitle}>Medical Emergency</Text>
        <Text style={styles.emergencyText}>
          If you're experiencing a medical emergency, please call 911 or go to your nearest emergency room immediately.
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
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
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpItemText: {
    marginLeft: 16,
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  topicItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  emergencySection: {
    backgroundColor: '#fff5f5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 8,
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HelpScreen;
