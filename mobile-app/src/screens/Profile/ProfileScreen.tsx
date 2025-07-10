import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  List,
  Divider,
  Surface,
  Switch,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { theme, spacing } from '../../utils/theme';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const navigateToEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const navigateToMedicalRecords = () => {
    navigation.navigate('MedicalRecords');
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToHelp = () => {
    navigation.navigate('Help');
  };

  const navigateToAbout = () => {
    navigation.navigate('About');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'patient':
        return 'Patient';
      case 'doctor':
        return 'Doctor';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <Surface style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            <Avatar.Text
              size={80}
              label={`${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`}
              style={styles.avatar}
            />
            <IconButton
              icon="camera"
              mode="contained"
              size={20}
              style={styles.cameraButton}
              onPress={() => Alert.alert('Feature', 'Profile picture update coming soon!')}
            />
          </View>
          <Title style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Title>
          <Paragraph style={styles.userEmail}>
            {user?.email}
          </Paragraph>
          <Paragraph style={styles.userRole}>
            {getRoleDisplayName(user?.role || '')}
          </Paragraph>
        </Surface>

        {/* Profile Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Profile Information</Title>
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={() => <List.Icon icon="account-edit" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={navigateToEditProfile}
            />
            <Divider />
            {user?.role === 'patient' && (
              <>
                <List.Item
                  title="Medical Records"
                  description="View your medical history"
                  left={() => <List.Icon icon="file-document" />}
                  right={() => <List.Icon icon="chevron-right" />}
                  onPress={navigateToMedicalRecords}
                />
                <Divider />
              </>
            )}
            <List.Item
              title="Account Settings"
              description="Manage your account preferences"
              left={() => <List.Icon icon="cog" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={navigateToSettings}
            />
          </Card.Content>
        </Card>

        {/* Quick Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Settings</Title>
            <List.Item
              title="Push Notifications"
              description="Receive appointment reminders"
              left={() => <List.Icon icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Dark Mode"
              description="Toggle dark theme"
              left={() => <List.Icon icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Support */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Support & Information</Title>
            <List.Item
              title="Help & Support"
              description="Get help with the app"
              left={() => <List.Icon icon="help-circle" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={navigateToHelp}
            />
            <Divider />
            <List.Item
              title="About"
              description="App version and information"
              left={() => <List.Icon icon="information" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={navigateToAbout}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={() => <List.Icon icon="shield-account" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Privacy', 'Privacy policy will be shown here')}
            />
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
              buttonColor={theme.colors.error}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Paragraph style={styles.versionText}>
            Telemedicine Mobile v1.0.0
          </Paragraph>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: spacing.medium,
  },
  profileHeader: {
    alignItems: 'center',
    padding: spacing.xlarge,
    marginBottom: spacing.large,
    elevation: 2,
    borderRadius: 16,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: spacing.medium,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: theme.colors.secondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.small,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: spacing.large,
    elevation: 2,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  logoutButton: {
    marginTop: spacing.small,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: spacing.medium,
    marginBottom: spacing.xlarge,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
});

export default ProfileScreen;
