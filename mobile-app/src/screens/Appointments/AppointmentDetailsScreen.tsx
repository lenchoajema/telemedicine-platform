import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type RootStackParamList = {
  AppointmentDetails: {
    appointment: {
      _id: string;
      patient: {
        profile: {
          firstName: string;
          lastName: string;
          fullName: string;
        };
        email: string;
      };
      doctor: {
        user: {
          profile: {
            firstName: string;
            lastName: string;
            fullName: string;
          };
        };
        specialization: string;
      } | null;
      date: string;
      duration: number;
      status: string;
      reason: string;
      symptoms: string[];
    };
  };
};

type AppointmentDetailsScreenRouteProp = RouteProp<RootStackParamList, 'AppointmentDetails'>;
type AppointmentDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AppointmentDetails'>;

interface Props {
  route: AppointmentDetailsScreenRouteProp;
  navigation: AppointmentDetailsScreenNavigationProp;
}

const AppointmentDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { appointment } = route.params;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return '#2a70e0';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'calendar';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cancel appointment API call
            Alert.alert('Success', 'Appointment cancelled successfully');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM do, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(appointment.status)} 
            size={32} 
            color={getStatusColor(appointment.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
            {appointment.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Appointment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment Details</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(appointment.date)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{formatTime(appointment.date)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="hourglass-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{appointment.duration} minutes</Text>
          </View>
        </View>
      </View>

      {/* Doctor Info */}
      {appointment.doctor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor Information</Text>
          
          <View style={styles.doctorCard}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                Dr. {appointment.doctor.user.profile.firstName} {appointment.doctor.user.profile.lastName}
              </Text>
              <Text style={styles.specialization}>{appointment.doctor.specialization}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Patient Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {appointment.patient.profile.firstName} {appointment.patient.profile.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{appointment.patient.email}</Text>
          </View>
        </View>
      </View>

      {/* Reason & Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Reason for Visit</Text>
            <Text style={styles.infoValue}>{appointment.reason}</Text>
          </View>
        </View>

        {appointment.symptoms && appointment.symptoms.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="medical-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Symptoms</Text>
              <Text style={styles.infoValue}>{appointment.symptoms.join(', ')}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {appointment.status === 'scheduled' && (
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.joinButton}>
            <Ionicons name="videocam" size={24} color="#ffffff" />
            <Text style={styles.joinButtonText}>Join Video Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAppointment}>
            <Ionicons name="close-circle" size={24} color="#dc3545" />
            <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
          </TouchableOpacity>
        </View>
      )}
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
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2d4150',
    fontWeight: '500',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  specialization: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  joinButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AppointmentDetailsScreen;
