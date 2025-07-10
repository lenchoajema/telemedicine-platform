import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  BackHandler,
} from 'react-native';
import {
  Surface,
  IconButton,
  Button,
  Text,
  Title,
  ActivityIndicator,
  Portal,
  Modal,
  Card,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/ApiClient';
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

const { width, height } = Dimensions.get('window');

const VideoCallScreen: React.FC<VideoCallScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { appointmentId, meetingLink } = route.params;
  
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<any>(null);
  const callStartTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    initializeCall();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });

    return () => {
      backHandler.remove();
      cleanupCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Initialize socket connection
      socket.current = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000', {
        query: {
          appointmentId,
          userId: user?.id,
          userRole: user?.role,
        },
      });

      // Socket event handlers
      socket.current.on('user-joined', handleUserJoined);
      socket.current.on('offer', handleReceiveOffer);
      socket.current.on('answer', handleReceiveAnswer);
      socket.current.on('ice-candidate', handleReceiveIceCandidate);
      socket.current.on('user-left', handleUserLeft);
      socket.current.on('chat-message', handleChatMessage);

      // Get local media
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 16, ideal: 30, max: 30 },
        },
      });

      setLocalStream(stream);
      setupPeerConnection(stream);
      
      setIsConnecting(false);
      startCallTimer();
      
    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Error', 'Failed to initialize video call');
      navigation.goBack();
    }
  };

  const setupPeerConnection = (stream: any) => {
    peerConnection.current = new RTCPeerConnection(pcConfig);

    // Add local stream
    stream.getTracks().forEach((track: any) => {
      peerConnection.current?.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setIsConnected(true);
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current?.emit('ice-candidate', {
          appointmentId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      if (state === 'connected') {
        setIsConnected(true);
      } else if (state === 'disconnected' || state === 'failed') {
        setIsConnected(false);
      }
    };
  };

  const handleUserJoined = async () => {
    try {
      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer);
      
      socket.current?.emit('offer', {
        appointmentId,
        offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleReceiveOffer = async (data: any) => {
    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);
      
      socket.current?.emit('answer', {
        appointmentId,
        answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleReceiveAnswer = async (data: any) => {
    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleReceiveIceCandidate = async (data: any) => {
    try {
      await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const handleUserLeft = () => {
    setIsConnected(false);
    setRemoteStream(null);
    Alert.alert('Call Ended', 'The other participant has left the call');
  };

  const handleChatMessage = (data: any) => {
    setChatMessages(prev => [...prev, data]);
  };

  const startCallTimer = () => {
    callStartTime.current = Date.now();
    durationInterval.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleSpeaker = () => {
    // Note: Speaker toggle implementation depends on react-native-webrtc version
    setIsSpeakerEnabled(!isSpeakerEnabled);
  };

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        text: chatMessage,
        sender: `${user?.firstName} ${user?.lastName}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      socket.current?.emit('chat-message', {
        appointmentId,
        message,
      });
      
      setChatMessages(prev => [...prev, message]);
      setChatMessage('');
    }
  };

  const handleEndCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            cleanupCall();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const cleanupCall = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    if (localStream) {
      localStream.getTracks().forEach((track: any) => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    if (socket.current) {
      socket.current.disconnect();
    }
  };

  const formatCallDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleControlsVisibility = () => {
    setShowControls(!showControls);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Remote Video */}
        <View style={styles.remoteVideoContainer}>
          {remoteStream ? (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteVideo}
              objectFit="cover"
            />
          ) : (
            <Surface style={styles.noVideoPlaceholder}>
              <Title style={styles.noVideoText}>
                {isConnecting ? 'Connecting...' : 'Waiting for other participant'}
              </Title>
              {isConnecting && (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              )}
            </Surface>
          )}
        </View>

        {/* Local Video */}
        <View style={styles.localVideoContainer}>
          {localStream && (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
            />
          )}
        </View>

        {/* Call Info */}
        <Surface style={styles.callInfo}>
          <Text style={styles.callDuration}>
            {formatCallDuration(callDuration)}
          </Text>
          {isConnected && (
            <Text style={styles.connectionStatus}>Connected</Text>
          )}
        </Surface>

        {/* Controls */}
        {showControls && (
          <Surface style={styles.controlsContainer}>
            <View style={styles.controls}>
              <IconButton
                icon={isMuted ? 'microphone-off' : 'microphone'}
                mode="contained"
                size={30}
                onPress={toggleMute}
                style={[styles.controlButton, isMuted && styles.mutedButton]}
              />
              
              <IconButton
                icon={isVideoEnabled ? 'video' : 'video-off'}
                mode="contained"
                size={30}
                onPress={toggleVideo}
                style={[styles.controlButton, !isVideoEnabled && styles.mutedButton]}
              />
              
              <IconButton
                icon="chat"
                mode="contained"
                size={30}
                onPress={() => setChatVisible(true)}
                style={styles.controlButton}
              />
              
              <IconButton
                icon={isSpeakerEnabled ? 'volume-high' : 'volume-off'}
                mode="contained"
                size={30}
                onPress={toggleSpeaker}
                style={styles.controlButton}
              />
              
              <IconButton
                icon="phone-hangup"
                mode="contained"
                size={30}
                onPress={handleEndCall}
                style={[styles.controlButton, styles.endCallButton]}
              />
            </View>
          </Surface>
        )}
      </View>

      {/* Chat Modal */}
      <Portal>
        <Modal
          visible={chatVisible}
          onDismiss={() => setChatVisible(false)}
          contentContainerStyle={styles.chatModal}
        >
          <Card>
            <Card.Content>
              <Title>Chat</Title>
              <View style={styles.chatMessages}>
                {chatMessages.map((msg, index) => (
                  <View key={index} style={styles.chatMessage}>
                    <Text style={styles.chatSender}>{msg.sender}</Text>
                    <Text style={styles.chatText}>{msg.text}</Text>
                    <Text style={styles.chatTimestamp}>{msg.timestamp}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chatInputContainer}>
                <TextInput
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Type a message..."
                  style={styles.chatInput}
                  multiline
                />
                <Button
                  mode="contained"
                  onPress={sendChatMessage}
                  style={styles.sendButton}
                >
                  Send
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
  },
  localVideo: {
    flex: 1,
  },
  noVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  noVideoText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  callInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  callDuration: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectionStatus: {
    color: '#4CAF50',
    fontSize: 12,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    paddingVertical: spacing.small,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mutedButton: {
    backgroundColor: theme.colors.error,
  },
  endCallButton: {
    backgroundColor: theme.colors.error,
  },
  chatModal: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    borderRadius: 8,
    maxHeight: height * 0.8,
  },
  chatMessages: {
    maxHeight: 300,
    marginVertical: spacing.medium,
  },
  chatMessage: {
    marginBottom: spacing.small,
    padding: spacing.small,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  chatSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  chatText: {
    fontSize: 14,
    marginVertical: 2,
  },
  chatTimestamp: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    marginRight: spacing.small,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});

export default VideoCallScreen;
