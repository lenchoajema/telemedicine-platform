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
  Chip,
  Searchbar,
  ActivityIndicator,
  FAB,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';
import { theme, spacing } from '../../utils/theme';

interface DoctorsScreenProps {
  navigation: any;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  experience: string;
  rating: number;
  totalReviews: number;
  availability: string[];
  profileImage?: string;
  bio?: string;
  location?: string;
  consultationFee?: number;
}

const DoctorsScreen: React.FC<DoctorsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);

  const fetchDoctors = async () => {
    try {
      const response = await ApiClient.get('/api/doctors');
      setDoctors(response.data);
      setFilteredDoctors(response.data);
      
      // Extract unique specializations
      const specs = [...new Set(response.data.map((doc: Doctor) => doc.specialization))];
      setSpecializations(specs);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by specialization
    if (selectedSpecialization) {
      filtered = filtered.filter(
        (doctor) => doctor.specialization === selectedSpecialization
      );
    }

    setFilteredDoctors(filtered);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, selectedSpecialization, doctors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const handleDoctorPress = (doctor: Doctor) => {
    navigation.navigate('DoctorProfile', { doctor });
  };

  const handleBookAppointment = (doctor: Doctor) => {
    navigation.navigate('BookAppointment', { doctor });
  };

  const clearSpecializationFilter = () => {
    setSelectedSpecialization('');
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Chip
          key={i}
          style={[
            styles.starChip,
            { backgroundColor: i <= rating ? '#FFD700' : '#E0E0E0' }
          ]}
          textStyle={{ fontSize: 12 }}
        >
          ★
        </Chip>
      );
    }
    return stars;
  };

  const renderDoctorCard = (doctor: Doctor) => {
    return (
      <Card key={doctor.id} style={styles.doctorCard}>
        <Card.Content>
          <View style={styles.doctorHeader}>
            <Avatar.Text
              size={60}
              label={`${doctor.firstName[0]}${doctor.lastName[0]}`}
              style={styles.avatar}
            />
            <View style={styles.doctorInfo}>
              <Title style={styles.doctorName}>
                Dr. {doctor.firstName} {doctor.lastName}
              </Title>
              <Paragraph style={styles.specialization}>
                {doctor.specialization}
              </Paragraph>
              <Paragraph style={styles.experience}>
                {doctor.experience} years experience
              </Paragraph>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {renderRatingStars(doctor.rating)}
            </View>
            <Paragraph style={styles.ratingText}>
              {doctor.rating}/5 ({doctor.totalReviews} reviews)
            </Paragraph>
          </View>

          {doctor.bio && (
            <Paragraph style={styles.bio} numberOfLines={2}>
              {doctor.bio}
            </Paragraph>
          )}

          <View style={styles.doctorDetails}>
            {doctor.location && (
              <Chip icon="map-marker" style={styles.detailChip}>
                {doctor.location}
              </Chip>
            )}
            {doctor.consultationFee && (
              <Chip icon="currency-usd" style={styles.detailChip}>
                ${doctor.consultationFee}
              </Chip>
            )}
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleDoctorPress(doctor)}
              style={styles.actionButton}
              icon="account"
            >
              View Profile
            </Button>
            <Button
              mode="contained"
              onPress={() => handleBookAppointment(doctor)}
              style={styles.actionButton}
              icon="calendar-plus"
            >
              Book Appointment
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSpecializationFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        <Title style={styles.filtersTitle}>Filter by Specialization</Title>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.specializationFilters}
        >
          {selectedSpecialization ? (
            <Chip
              mode="flat"
              onPress={clearSpecializationFilter}
              style={styles.filterChip}
              icon="close"
            >
              {selectedSpecialization}
            </Chip>
          ) : null}
          {specializations.map((spec) => (
            <Chip
              key={spec}
              mode={selectedSpecialization === spec ? 'flat' : 'outlined'}
              onPress={() => setSelectedSpecialization(spec)}
              style={styles.filterChip}
            >
              {spec}
            </Chip>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Title style={styles.loadingText}>Loading doctors...</Title>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Find a Doctor</Title>
        <Searchbar
          placeholder="Search doctors..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSpecializationFilters()}

        {filteredDoctors.length === 0 ? (
          <View style={styles.emptyState}>
            <Avatar.Icon size={80} icon="doctor" />
            <Title style={styles.emptyTitle}>No doctors found</Title>
            <Paragraph style={styles.emptyMessage}>
              Try adjusting your search or filter criteria.
            </Paragraph>
          </View>
        ) : (
          filteredDoctors.map(renderDoctorCard)
        )}
      </ScrollView>
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
  searchBar: {
    marginBottom: spacing.small,
  },
  scrollContainer: {
    padding: spacing.medium,
  },
  filtersContainer: {
    marginBottom: spacing.large,
  },
  filtersTitle: {
    fontSize: 16,
    marginBottom: spacing.small,
  },
  specializationFilters: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: spacing.small,
    marginBottom: spacing.small,
  },
  doctorCard: {
    marginBottom: spacing.medium,
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  avatar: {
    marginRight: spacing.medium,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  specialization: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  experience: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: spacing.small,
  },
  starChip: {
    marginRight: 2,
    height: 20,
    width: 20,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  bio: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.medium,
  },
  doctorDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.medium,
  },
  detailChip: {
    marginRight: spacing.small,
    marginBottom: spacing.small,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.small,
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
  },
});

export default DoctorsScreen;
