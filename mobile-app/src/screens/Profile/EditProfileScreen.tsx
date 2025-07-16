import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { 
  Title, 
  Card, 
  Button, 
  TextInput, 
  Surface,
  Portal,
  Dialog,
  Paragraph,
  Divider
} from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await ApiClient.put('/patients/profile', {
        firstName,
        lastName,
        phone
      });

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigation.goBack();
        }, 2000);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface}>
        <Title style={styles.title}>Edit Profile</Title>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Personal Information</Title>
            
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <TextInput
              label="Email"
              value={user?.email || ''}
              mode="outlined"
              disabled
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>

        <Portal>
          <Dialog visible={showSuccess} onDismiss={() => setShowSuccess(false)}>
            <Dialog.Content>
              <Paragraph>Profile updated successfully!</Paragraph>
            </Dialog.Content>
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
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 8,
  },
});

export default EditProfileScreen;
