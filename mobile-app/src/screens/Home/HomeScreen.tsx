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
  IconButton,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';
import { theme, spacing } from '../../utils/theme';

interface HomeScreenProps {
  navigation: any;
}

interface DashboardData {
  upcomingAppointments: any[];
  recentActivities: any[];
  quickStats: {
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
  };
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await ApiClient.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const navigateToAppointments = () => {
    navigation.navigate('Appointments');
  };

  const navigateToBookAppointment = () => {
    navigation.navigate('Doctors');
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const renderQuickActions = () => {
    if (user?.role === 'patient') {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                onPress={navigateToBookAppointment}
                style={styles.actionButton}
                icon="calendar-plus"
              >
                Book Appointment
              </Button>
              <Button
                mode="outlined"
                onPress={navigateToAppointments}
                style={styles.actionButton}
                icon="calendar"
              >
                View Appointments
              </Button>
            </View>
          </Card.Content>
        </Card>
      );
    } else if (user?.role === 'doctor') {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                onPress={navigateToAppointments}
                style={styles.actionButton}
                icon="calendar"
              >
                My Schedule
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Patients')}
                style={styles.actionButton}
                icon="account-group"
              >
                My Patients
              </Button>
            </View>
          </Card.Content>
        </Card>
      );
    }
    return null;
  };

  const renderUpcomingAppointments = () => {
    if (!dashboardData?.upcomingAppointments?.length) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Upcoming Appointments</Title>
          {dashboardData.upcomingAppointments.slice(0, 3).map((appointment, index) => (
            <View key={appointment.id || index}>
              <List.Item
                title={user?.role === 'patient' ? 
                  `Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}` :
                  `${appointment.patient?.firstName} ${appointment.patient?.lastName}`
                }
                description={`${appointment.date} at ${appointment.time}`}
                left={() => (
                  <Avatar.Icon 
                    size={40} 
                    icon={user?.role === 'patient' ? 'doctor' : 'account'} 
                  />
                )}
                right={() => (
                  <IconButton
                    icon="chevron-right"
                    onPress={() => navigation.navigate('Appointments', { appointmentId: appointment.id })}
                  />
                )}
              />
              {index < dashboardData.upcomingAppointments.length - 1 && <Divider />}
            </View>
          ))}
          <Button
            mode="text"
            onPress={navigateToAppointments}
            style={styles.viewAllButton}
          >
            View All Appointments
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderStats = () => {
    if (!dashboardData?.quickStats) return null;

    const stats = dashboardData.quickStats;
    return (
      <View style={styles.statsContainer}>
        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{stats.totalAppointments}</Title>
          <Paragraph style={styles.statLabel}>Total</Paragraph>
        </Surface>
        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{stats.completedAppointments}</Title>
          <Paragraph style={styles.statLabel}>Completed</Paragraph>
        </Surface>
        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{stats.pendingAppointments}</Title>
          <Paragraph style={styles.statLabel}>Pending</Paragraph>
        </Surface>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Avatar.Text
              size={60}
              label={user?.firstName?.[0] || 'U'}
              style={styles.avatar}
            />
            <View style={styles.welcomeText}>
              <Title style={styles.welcomeTitle}>
                Welcome back, {user?.firstName}!
              </Title>
              <Paragraph style={styles.welcomeSubtitle}>
                {user?.role === 'patient' ? 'How can we help you today?' : 'Ready to help your patients?'}
              </Paragraph>
            </View>
          </View>
          <IconButton
            icon="bell"
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationButton}
          />
        </View>

        {renderStats()}
        {renderQuickActions()}
        {renderUpcomingAppointments()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.large,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.medium,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  notificationButton: {
    margin: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.large,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.medium,
    marginHorizontal: spacing.small,
    borderRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    marginBottom: spacing.large,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: spacing.medium,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.small,
  },
  viewAllButton: {
    marginTop: spacing.small,
  },
});

export default HomeScreen;
