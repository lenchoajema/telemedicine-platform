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
  List,
  Divider,
  Chip,
  FAB,
  SegmentedButtons,
  ActivityIndicator,
  Surface,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';
import { theme, spacing } from '../../utils/theme';
import { format } from 'date-fns';

interface MedicalRecordsScreenProps {
  navigation: any;
}

interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'prescription' | 'lab-result' | 'vaccination' | 'allergy' | 'diagnosis';
  title: string;
  description: string;
  doctor?: {
    firstName: string;
    lastName: string;
    specialization: string;
  };
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  labResults?: {
    testName: string;
    value: string;
    unit: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
  };
}

const MedicalRecordsScreen: React.FC<MedicalRecordsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchMedicalRecords = async () => {
    try {
      const response = await ApiClient.get('/medical-records');
      if (response.success && response.data) {
        const recordsData = Array.isArray(response.data) ? response.data : [];
        setMedicalRecords(recordsData);
        filterRecords(recordsData, filter);
      } else {
        console.error('Failed to fetch medical records:', response.error);
        setMedicalRecords([]);
        filterRecords([], filter);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      Alert.alert('Error', 'Failed to load medical records');
      setMedicalRecords([]);
      filterRecords([], filter);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterRecords = (records: MedicalRecord[], currentFilter: string) => {
    let filtered = records;
    
    if (currentFilter !== 'all') {
      filtered = records.filter(record => record.type === currentFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredRecords(filtered);
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  useEffect(() => {
    filterRecords(medicalRecords, filter);
  }, [filter, medicalRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicalRecords();
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return theme.colors.primary;
      case 'prescription':
        return '#4CAF50';
      case 'lab-result':
        return '#FF9800';
      case 'vaccination':
        return '#9C27B0';
      case 'allergy':
        return '#f44336';
      case 'diagnosis':
        return '#2196F3';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'doctor';
      case 'prescription':
        return 'pill';
      case 'lab-result':
        return 'test-tube';
      case 'vaccination':
        return 'needle';
      case 'allergy':
        return 'alert';
      case 'diagnosis':
        return 'medical-bag';
      default:
        return 'file-document';
    }
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation';
      case 'prescription':
        return 'Prescription';
      case 'lab-result':
        return 'Lab Result';
      case 'vaccination':
        return 'Vaccination';
      case 'allergy':
        return 'Allergy';
      case 'diagnosis':
        return 'Diagnosis';
      default:
        return type;
    }
  };

  const handleRecordPress = (record: MedicalRecord) => {
    navigation.navigate('MedicalRecordDetail', { record });
  };

  const downloadAttachment = async (attachment: any) => {
    try {
      Alert.alert('Download', `Downloading ${attachment.name}...`);
      // Implementation for downloading attachment
    } catch (error) {
      Alert.alert('Error', 'Failed to download attachment');
    }
  };

  const renderMedicalRecord = (record: MedicalRecord) => {
    return (
      <Card key={record.id} style={styles.recordCard}>
        <Card.Content>
          <View style={styles.recordHeader}>
            <View style={styles.recordInfo}>
              <View style={styles.recordTitleRow}>
                <Chip
                  icon={getRecordTypeIcon(record.type)}
                  style={[
                    styles.typeChip,
                    { backgroundColor: getRecordTypeColor(record.type) }
                  ]}
                  textStyle={styles.typeChipText}
                >
                  {getRecordTypeLabel(record.type)}
                </Chip>
                <Paragraph style={styles.recordDate}>
                  {format(new Date(record.date), 'MMM dd, yyyy')}
                </Paragraph>
              </View>
              <Title style={styles.recordTitle}>{record.title}</Title>
              <Paragraph style={styles.recordDescription} numberOfLines={2}>
                {record.description}
              </Paragraph>
            </View>
            <IconButton
              icon="chevron-right"
              onPress={() => handleRecordPress(record)}
            />
          </View>

          {record.doctor && (
            <View style={styles.doctorInfo}>
              <Paragraph style={styles.doctorName}>
                Dr. {record.doctor.firstName} {record.doctor.lastName}
              </Paragraph>
              <Paragraph style={styles.doctorSpecialization}>
                {record.doctor.specialization}
              </Paragraph>
            </View>
          )}

          {record.medications && record.medications.length > 0 && (
            <View style={styles.medicationsContainer}>
              <Title style={styles.sectionTitle}>Medications</Title>
              {record.medications.slice(0, 2).map((med, index) => (
                <View key={index} style={styles.medicationItem}>
                  <Paragraph style={styles.medicationName}>{med.name}</Paragraph>
                  <Paragraph style={styles.medicationDetails}>
                    {med.dosage} - {med.frequency}
                  </Paragraph>
                </View>
              ))}
              {record.medications.length > 2 && (
                <Paragraph style={styles.moreText}>
                  +{record.medications.length - 2} more medications
                </Paragraph>
              )}
            </View>
          )}

          {record.labResults && record.labResults.length > 0 && (
            <View style={styles.labResultsContainer}>
              <Title style={styles.sectionTitle}>Lab Results</Title>
              {record.labResults.slice(0, 2).map((result, index) => (
                <View key={index} style={styles.labResultItem}>
                  <View style={styles.labResultHeader}>
                    <Paragraph style={styles.labTestName}>{result.testName}</Paragraph>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: result.status === 'normal' ? '#4CAF50' : '#f44336' }
                      ]}
                      textStyle={styles.statusChipText}
                    >
                      {result.status}
                    </Chip>
                  </View>
                  <Paragraph style={styles.labResultValue}>
                    {result.value} {result.unit}
                  </Paragraph>
                </View>
              ))}
            </View>
          )}

          {record.vitals && (
            <View style={styles.vitalsContainer}>
              <Title style={styles.sectionTitle}>Vitals</Title>
              <View style={styles.vitalsGrid}>
                {record.vitals.bloodPressure && (
                  <View style={styles.vitalItem}>
                    <Paragraph style={styles.vitalLabel}>BP</Paragraph>
                    <Paragraph style={styles.vitalValue}>{record.vitals.bloodPressure}</Paragraph>
                  </View>
                )}
                {record.vitals.heartRate && (
                  <View style={styles.vitalItem}>
                    <Paragraph style={styles.vitalLabel}>HR</Paragraph>
                    <Paragraph style={styles.vitalValue}>{record.vitals.heartRate}</Paragraph>
                  </View>
                )}
                {record.vitals.temperature && (
                  <View style={styles.vitalItem}>
                    <Paragraph style={styles.vitalLabel}>Temp</Paragraph>
                    <Paragraph style={styles.vitalValue}>{record.vitals.temperature}</Paragraph>
                  </View>
                )}
              </View>
            </View>
          )}

          {record.attachments && record.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              <Title style={styles.sectionTitle}>Attachments</Title>
              {record.attachments.map((attachment, index) => (
                <Button
                  key={index}
                  mode="outlined"
                  onPress={() => downloadAttachment(attachment)}
                  style={styles.attachmentButton}
                  icon="download"
                >
                  {attachment.name}
                </Button>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Title style={styles.loadingText}>Loading medical records...</Title>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Medical Records</Title>
        <SegmentedButtons
          value={filter}
          onValueChange={handleFilterChange}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'consultation', label: 'Visits' },
            { value: 'prescription', label: 'Rx' },
            { value: 'lab-result', label: 'Labs' },
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
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Surface style={styles.emptyIcon}>
              <IconButton icon="file-document" size={60} />
            </Surface>
            <Title style={styles.emptyTitle}>No records found</Title>
            <Paragraph style={styles.emptyMessage}>
              {filter === 'all' 
                ? 'You have no medical records yet.'
                : `You have no ${getRecordTypeLabel(filter).toLowerCase()} records.`}
            </Paragraph>
          </View>
        ) : (
          filteredRecords.map(renderMedicalRecord)
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicalRecord')}
      />
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
  recordCard: {
    marginBottom: spacing.medium,
    elevation: 2,
    borderRadius: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  typeChipText: {
    color: '#fff',
    fontSize: 12,
  },
  recordDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  recordDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  doctorInfo: {
    marginBottom: spacing.medium,
    padding: spacing.small,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  doctorSpecialization: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  medicationsContainer: {
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  medicationItem: {
    marginBottom: spacing.small,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '500',
  },
  medicationDetails: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  moreText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  labResultsContainer: {
    marginBottom: spacing.medium,
  },
  labResultItem: {
    marginBottom: spacing.small,
  },
  labResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labTestName: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusChip: {
    height: 24,
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: '#fff',
    fontSize: 10,
  },
  labResultValue: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  vitalsContainer: {
    marginBottom: spacing.medium,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vitalItem: {
    marginRight: spacing.large,
    marginBottom: spacing.small,
  },
  vitalLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentsContainer: {
    marginBottom: spacing.medium,
  },
  attachmentButton: {
    marginBottom: spacing.small,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xlarge,
    minHeight: 400,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  emptyTitle: {
    marginBottom: spacing.small,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: theme.colors.primary,
  },
});

export default MedicalRecordsScreen;
