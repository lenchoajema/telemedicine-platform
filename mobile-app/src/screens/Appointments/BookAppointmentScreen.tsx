import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';

type RootStackParamList = {
  BookAppointment: {
    doctor: {
      _id: string;
      user: {
        profile: {
          firstName: string;
          lastName: string;
          fullName: string;
        };
        email: string;
      };
      specialization: string;
      licenseNumber: string;
      verificationStatus: string;
      rating: number;
    };
  };
};

type BookAppointmentScreenRouteProp = RouteProp<RootStackParamList, 'BookAppointment'>;
type BookAppointmentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookAppointment'>;

interface Props {
  route: BookAppointmentScreenRouteProp;
  navigation: BookAppointmentScreenNavigationProp;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookAppointmentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { doctor } = route.params;
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true);
    try {
      const response = await ApiClient.get(`/doctors/availability?doctorId=${doctor._id}&date=${selectedDate}`);
      
      if (response.success && response.data) {
        setAvailableSlots(response.data);
      } else {
        // Generate default time slots if endpoint doesn't exist
        generateDefaultSlots();
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      generateDefaultSlots();
    } finally {
      setSlotsLoading(false);
    }
  };

  const generateDefaultSlots = () => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3 // Random availability for demo
      });
      if (hour < 17) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          available: Math.random() > 0.3
        });
      }
    }
    setAvailableSlots(slots);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Error', 'Please select a date and time slot');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        doctorId: doctor._id,
        patientId: user?.id,
        date: selectedDate,
        time: selectedSlot,
        reason: reason || 'General consultation',
        status: 'scheduled',
        type: 'consultation'
      };

      const response = await ApiClient.post('/appointments', appointmentData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Appointment booked successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainTabs' as any)
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <ScrollView style={styles.container}>
      {/* Doctor Info */}
      <View style={styles.doctorCard}>
        <Text style={styles.doctorName}>
          Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName}
        </Text>
        <Text style={styles.specialization}>{doctor.specialization}</Text>
        <Text style={styles.rating}>Rating: {doctor.rating}/5 ⭐</Text>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: '#2a70e0'
            }
          }}
          minDate={getMinDate()}
          maxDate={getMaxDate()}
          theme={{
            selectedDayBackgroundColor: '#2a70e0',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2a70e0',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: '#2a70e0',
            monthTextColor: '#2a70e0',
            indicatorColor: '#2a70e0',
          }}
        />
      </View>

      {/* Time Slot Selection */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          {slotsLoading ? (
            <ActivityIndicator size="large" color="#2a70e0" style={styles.loading} />
          ) : (
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.slot,
                    !slot.available && styles.slotDisabled,
                    selectedSlot === slot.time && styles.slotSelected
                  ]}
                  onPress={() => slot.available && setSelectedSlot(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.slotText,
                      !slot.available && styles.slotTextDisabled,
                      selectedSlot === slot.time && styles.slotTextSelected
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Book Button */}
      {selectedDate && selectedSlot && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            )}
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
  doctorCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#2a70e0',
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
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  slotSelected: {
    backgroundColor: '#2a70e0',
    borderColor: '#2a70e0',
  },
  slotDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    opacity: 0.5,
  },
  slotText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  slotTextSelected: {
    color: '#ffffff',
  },
  slotTextDisabled: {
    color: '#adb5bd',
  },
  loading: {
    padding: 20,
  },
  bookButton: {
    backgroundColor: '#2a70e0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookAppointmentScreen;
