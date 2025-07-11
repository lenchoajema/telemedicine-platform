import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { theme, spacing } from '../../utils/theme';

interface VideoCallScreenProps {
  navigation: any;
  route: {
    params: {
      appointmentId: string;
      meetingLink?: string;
    };
  };
}

const VideoCallScreen: React.FC<VideoCallScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { appointmentId, meetingLink } = route.params;

  const handleEndCall = () => {
    navigation.goBack();
  };

  const showWebRTCInfo = () => {
    Alert.alert(
      'Video Calling',
      'Video calling is optimized for mobile devices. For full video call functionality, please use the mobile app on your phone or tablet.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Surface style={styles.videoPlaceholder}>
          <Title style={styles.title}>Video Consultation</Title>
          <Paragraph style={styles.subtitle}>
            Web Preview Mode
          </Paragraph>
        </Surface>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Video Call Information</Title>
            <Paragraph style={styles.info}>
              • Appointment ID: {appointmentId}
            </Paragraph>
            <Paragraph style={styles.info}>
              • User: {user?.firstName} {user?.lastName}
            </Paragraph>
            <Paragraph style={styles.info}>
              • Role: {user?.role}
            </Paragraph>
            {meetingLink && (
              <Paragraph style={styles.info}>
                • Meeting Link: Available
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.noticeCard}>
          <Card.Content>
            <Title style={styles.noticeTitle}>📱 For Full Video Experience</Title>
            <Paragraph style={styles.notice}>
              Video calling with WebRTC is optimized for mobile devices. 
              To experience full video consultation features including:
            </Paragraph>
            <Paragraph style={styles.featureList}>
              • HD video and audio calling
              • Screen sharing capabilities
              • Real-time chat messaging
              • Camera and microphone controls
              • Mobile-optimized interface
            </Paragraph>
            <Paragraph style={styles.notice}>
              Please use the mobile app on your smartphone or tablet.
            </Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={showWebRTCInfo}
            style={styles.button}
            icon="information"
          >
            Learn More
          </Button>
          <Button
            mode="contained"
            onPress={handleEndCall}
            style={styles.button}
            icon="arrow-left"
          >
            Back to Appointments
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.large,
  },
  videoPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
    backgroundColor: '#000',
    borderRadius: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: spacing.small,
  },
  infoCard: {
    marginBottom: spacing.large,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  info: {
    fontSize: 14,
    marginBottom: spacing.small,
    color: theme.colors.onSurfaceVariant,
  },
  noticeCard: {
    marginBottom: spacing.large,
    elevation: 2,
    backgroundColor: theme.colors.primaryContainer,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
    color: theme.colors.primary,
  },
  notice: {
    fontSize: 14,
    marginBottom: spacing.small,
    color: theme.colors.onPrimaryContainer,
  },
  featureList: {
    fontSize: 14,
    marginBottom: spacing.small,
    marginLeft: spacing.medium,
    color: theme.colors.onPrimaryContainer,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.medium,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.small,
  },
});

export default VideoCallScreen;
