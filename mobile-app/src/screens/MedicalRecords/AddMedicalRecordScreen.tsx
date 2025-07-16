import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';

type RootStackParamList = {
  AddMedicalRecord: undefined;
};

type AddMedicalRecordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddMedicalRecord'>;

interface Props {
  navigation: AddMedicalRecordScreenNavigationProp;
}

const AddMedicalRecordScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    doctorName: '',
    hospitalName: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the medical record');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Please select a date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const recordData = {
        ...formData,
        patientId: user?.id,
        type: 'general',
        attachments: [], // Can be extended to support file uploads
      };

      const response = await ApiClient.post('/medical-records', recordData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Medical record added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to add medical record');
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
      Alert.alert('Error', 'Failed to add medical record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={32} color="#2a70e0" />
        <Text style={styles.headerTitle}>Add Medical Record</Text>
        <Text style={styles.headerSubtitle}>Add a new medical record to your health history</Text>
      </View>

      <View style={styles.form}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="e.g., Annual Checkup, Blood Test Results"
            placeholderTextColor="#999"
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe the medical visit or procedure"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Diagnosis */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Diagnosis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis}
            onChangeText={(value) => handleInputChange('diagnosis', value)}
            placeholder="Medical diagnosis (if applicable)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Treatment */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Treatment</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.treatment}
            onChangeText={(value) => handleInputChange('treatment', value)}
            placeholder="Treatment received or recommended"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Medications */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medications</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.medications}
            onChangeText={(value) => handleInputChange('medications', value)}
            placeholder="Medications prescribed or taken"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Doctor Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doctor Name</Text>
          <TextInput
            style={styles.input}
            value={formData.doctorName}
            onChangeText={(value) => handleInputChange('doctorName', value)}
            placeholder="Name of the attending doctor"
            placeholderTextColor="#999"
          />
        </View>

        {/* Hospital/Clinic Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hospital/Clinic</Text>
          <TextInput
            style={styles.input}
            value={formData.hospitalName}
            onChangeText={(value) => handleInputChange('hospitalName', value)}
            placeholder="Name of the hospital or clinic"
            placeholderTextColor="#999"
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            placeholder="Any additional notes or observations"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#ffffff" />
              <Text style={styles.submitButtonText}>Add Medical Record</Text>
            </>
          )}
        </TouchableOpacity>
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
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d4150',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2a70e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddMedicalRecordScreen;
