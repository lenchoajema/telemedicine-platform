import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  DoctorProfile: {
    doctor: {
      _id: string;
      user: {
        profile: {
          firstName: string;
          lastName: string;
          fullName: string;
          photo?: string;
        };
        email: string;
      };
      specialization: string;
      licenseNumber: string;
      verificationStatus: string;
      rating: number;
      reviewCount: number;
      education: Array<{
        degree: string;
        institution: string;
        year: number;
      }>;
      experience: Array<{
        position: string;
        hospital: string;
        years: string;
      }>;
      bio?: string;
    };
  };
};

type DoctorProfileScreenRouteProp = RouteProp<RootStackParamList, 'DoctorProfile'>;
type DoctorProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DoctorProfile'>;

interface Props {
  route: DoctorProfileScreenRouteProp;
  navigation: DoctorProfileScreenNavigationProp;
}

const DoctorProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { doctor } = route.params;

  const handleBookAppointment = () => {
    navigation.navigate('BookAppointment' as any, { doctor });
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={20}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={{ 
            uri: doctor.user.profile.photo || 'https://via.placeholder.com/150x150/cccccc/ffffff?text=Dr'
          }}
          style={styles.profileImage}
        />
        <Text style={styles.doctorName}>
          Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName}
        </Text>
        <Text style={styles.specialization}>{doctor.specialization}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {renderStarRating(doctor.rating)}
          </View>
          <Text style={styles.ratingText}>
            {doctor.rating}/5 ({doctor.reviewCount} reviews)
          </Text>
        </View>

        <View style={styles.verificationBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#28a745" />
          <Text style={styles.verificationText}>Verified Doctor</Text>
        </View>
      </View>

      {/* About Section */}
      {doctor.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{doctor.bio}</Text>
        </View>
      )}

      {/* Education Section */}
      {doctor.education && doctor.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {doctor.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Text style={styles.educationDegree}>{edu.degree}</Text>
              <Text style={styles.educationInstitution}>{edu.institution}</Text>
              <Text style={styles.educationYear}>{edu.year}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Experience Section */}
      {doctor.experience && doctor.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {doctor.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <Text style={styles.experiencePosition}>{exp.position}</Text>
              <Text style={styles.experienceHospital}>{exp.hospital}</Text>
              <Text style={styles.experienceYears}>{exp.years}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactItem}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.contactText}>{doctor.user.email}</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          <Text style={styles.contactText}>License: {doctor.licenseNumber}</Text>
        </View>
      </View>

      {/* Book Appointment Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
          <Ionicons name="calendar" size={24} color="#ffffff" />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
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
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verificationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
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
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  educationItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
  },
  educationInstitution: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  educationYear: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  experienceItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
  },
  experienceHospital: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  experienceYears: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  bookButton: {
    backgroundColor: '#2a70e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DoctorProfileScreen;
