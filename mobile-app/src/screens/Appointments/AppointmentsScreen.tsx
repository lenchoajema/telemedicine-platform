import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
  Chip,
  FAB,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';
import { theme, spacing } from '../../utils/theme';
import { format } from 'date-fns';

interface AppointmentsScreenProps {
  navigation: any;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  type: 'consultation' | 'follow-up' | 'emergency';
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  notes?: string;
  meetingLink?: string;
}

const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchAppointments = async () => {
    try {
      const response = await ApiClient.get('/appointments/');
      if (response.success && response.data) {
        const appointmentsData = Array.isArray(response.data) ? response.data : [];
        setAppointments(appointmentsData);
        filterAppointments(appointmentsData, filter);
      } else {
        console.error('Failed to fetch appointments:', response.error);
        setAppointments([]);
        filterAppointments([], filter);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
      setAppointments([]);
      filterAppointments([], filter);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = (appointmentList: Appointment[], currentFilter: string) => {
    let filtered = appointmentList;
    
    switch (currentFilter) {
      case 'upcoming':
        filtered = appointmentList.filter(
          (apt) => apt.status === 'scheduled' && new Date(apt.date) >= new Date()
        );
        break;
      case 'completed':
        filtered = appointmentList.filter((apt) => apt.status === 'completed');
        break;
      case 'cancelled':
        filtered = appointmentList.filter((apt) => apt.status === 'cancelled');
        break;
      default:
        filtered = appointmentList;
    }
    
    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments(appointments, filter);
  }, [filter, appointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      case 'pending':
        return '#FF9800';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };

  const handleVideoCall = (appointment: Appointment) => {
    if (appointment.meetingLink) {
      navigation.navigate('VideoCall', { 
        meetingLink: appointment.meetingLink,
        appointmentId: appointment.id 
      });
    } else {
      Alert.alert('Error', 'No meeting link available for this appointment');
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await ApiClient.put(`/appointments/${appointmentId}/cancel`);
              fetchAppointments();
              Alert.alert('Success', 'Appointment cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const isPatient = user?.role === 'patient';
    const otherPerson = isPatient ? appointment.doctor : appointment.patient;
    const canStartCall = appointment.status === 'scheduled' && 
                         new Date(appointment.date) <= new Date();

    return (
      <Card key={appointment.id} style={styles.appointmentCard}>
        <Card.Content>
          <View style={styles.appointmentHeader}>
            <View style={styles.personInfo}>
              <Avatar.Text
                size={40}
                label={otherPerson?.firstName?.[0] || 'U'}
                style={styles.avatar}
              />
              <View style={styles.personDetails}>
                <Title style={styles.personName}>
                  {isPatient ? 'Dr. ' : ''}
                  {otherPerson?.firstName} {otherPerson?.lastName}
                </Title>
                {isPatient && appointment.doctor?.specialization && (
                  <Paragraph style={styles.specialization}>
                    {appointment.doctor.specialization}
                  </Paragraph>
                )}
              </View>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(appointment.status) }]}
              textStyle={styles.statusText}
            >
              {getStatusText(appointment.status)}
            </Chip>
          </View>

          <View style={styles.appointmentInfo}>
            <Paragraph style={styles.dateTime}>
              {format(new Date(appointment.date), 'MMM dd, yyyy')} at {appointment.time}
            </Paragraph>
            <Paragraph style={styles.type}>
              Type: {appointment.type}
            </Paragraph>
            {appointment.notes && (
              <Paragraph style={styles.notes}>
                Notes: {appointment.notes}
              </Paragraph>
            )}
          </View>

          <View style={styles.actionButtons}>
            {canStartCall && (
              <Button
                mode="contained"
                onPress={() => handleVideoCall(appointment)}
                style={styles.actionButton}
                icon="video"
              >
                Start Call
              </Button>
            )}
            {appointment.status === 'scheduled' && (
              <Button
                mode="outlined"
                onPress={() => cancelAppointment(appointment.id)}
                style={styles.actionButton}
                icon="cancel"
              >
                Cancel
              </Button>
            )}
            <Button
              mode="text"
              onPress={() => handleAppointmentPress(appointment)}
              style={styles.actionButton}
              icon="information"
            >
              Details
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Title style={styles.loadingText}>Loading appointments...</Title>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>My Appointments</Title>
        <SegmentedButtons
          value={filter}
          onValueChange={handleFilterChange}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Avatar.Icon size={80} icon="calendar-blank" />
            <Title style={styles.emptyTitle}>No appointments found</Title>
            <Paragraph style={styles.emptyMessage}>
              {filter === 'all' 
                ? 'You have no appointments scheduled.'
                : `You have no ${filter} appointments.`}
            </Paragraph>
            {user?.role === 'patient' && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Doctors')}
                style={styles.bookButton}
                icon="calendar-plus"
              >
                Book New Appointment
              </Button>
            )}
          </View>
        ) : (
          filteredAppointments.map(renderAppointmentCard)
        )}
      </ScrollView>

      {user?.role === 'patient' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('Doctors')}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.medium,
  },
  header: {
    padding: spacing.medium,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  filterButtons: {
    marginBottom: spacing.small,
  },
  scrollContainer: {
    padding: spacing.medium,
  },
  appointmentCard: {
    marginBottom: spacing.medium,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.medium,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  specialization: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  appointmentInfo: {
    marginBottom: spacing.medium,
  },
  dateTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.small,
  },
  type: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.small,
  },
  notes: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginHorizontal: spacing.small,
    marginVertical: spacing.small,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xlarge,
    minHeight: 400,
  },
  emptyTitle: {
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.large,
  },
  bookButton: {
    marginTop: spacing.medium,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: theme.colors.primary,
  },
});

export default AppointmentsScreen;
