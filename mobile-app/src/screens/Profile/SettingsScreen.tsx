import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { 
  Title, 
  Card, 
  Button, 
  Switch, 
  Surface,
  List,
  Divider,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface}>
        <Title style={styles.title}>Settings</Title>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Notifications</Title>
            
            <List.Item
              title="Push Notifications"
              description="Receive appointment reminders and updates"
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Email Notifications"
              description="Receive email updates for appointments"
              right={() => (
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Security</Title>
            
            <List.Item
              title="Biometric Authentication"
              description="Use fingerprint or face ID to login"
              right={() => (
                <Switch
                  value={biometricAuth}
                  onValueChange={setBiometricAuth}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Change Password"
              description="Update your account password"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>About</Title>
            
            <List.Item
              title="Privacy Policy"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            />
            
            <Divider />
            
            <List.Item
              title="Terms of Service"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon')}
            />
            
            <Divider />
            
            <List.Item
              title="App Version"
              description="1.0.0"
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            buttonColor="#dc3545"
          >
            Logout
          </Button>
        </View>

        <Portal>
          <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
            <Dialog.Title>Confirm Logout</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Are you sure you want to logout?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
              <Button onPress={confirmLogout}>Logout</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
});

export default SettingsScreen;
