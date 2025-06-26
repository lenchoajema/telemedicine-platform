import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import './ConnectionTest.css';

const ConnectionTest = ({ onTestComplete }) => {
  const [testResults, setTestResults] = useState([]);
  const [isTestingComplete, setIsTestingComplete] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    runConnectionTests();
  }, []);

  const runConnectionTests = async () => {
    const tests = [
      { name: 'Internet Connection', test: testInternetConnection },
      { name: 'WebRTC Support', test: testWebRTCSupport },
      { name: 'Camera Access', test: testCameraAccess },
      { name: 'Microphone Access', test: testMicrophoneAccess },
      { name: 'Audio/Video Quality', test: testMediaQuality },
      { name: 'Network Speed', test: testNetworkSpeed },
      { name: 'Server Connectivity', test: testServerConnectivity }
    ];

    const results = [];
    let passedTests = 0;

    for (const testItem of tests) {
      try {
        setTestResults(prev => [...prev, {
          name: testItem.name,
          status: 'running',
          message: 'Testing...',
          details: ''
        }]);

        const result = await testItem.test();
        
        if (result.passed) passedTests++;
        
        setTestResults(prev => prev.map(test => 
          test.name === testItem.name ? {
            ...test,
            status: result.passed ? 'pass' : 'fail',
            message: result.message,
            details: result.details || '',
            recommendations: result.recommendations || []
          } : test
        ));

        results.push({
          name: testItem.name,
          ...result
        });

        // Small delay between tests for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Test ${testItem.name} failed:`, error);
        
        setTestResults(prev => prev.map(test => 
          test.name === testItem.name ? {
            ...test,
            status: 'fail',
            message: 'Test failed',
            details: error.message,
            recommendations: ['Try refreshing the page and running the test again']
          } : test
        ));
      }
    }

    const score = Math.round((passedTests / tests.length) * 100);
    setOverallScore(score);
    setIsTestingComplete(true);
    
    if (onTestComplete) {
      onTestComplete({
        score,
        results,
        canProceed: score >= 70 // Require at least 70% of tests to pass
      });
    }
  };

  const testInternetConnection = async () => {
    try {
      const start = Date.now();
      await fetch('https://httpbin.org/get', { mode: 'cors' });
      const latency = Date.now() - start;
      
      return {
        passed: latency < 5000,
        message: latency < 1000 ? 'Excellent connection' : 
                latency < 3000 ? 'Good connection' : 'Slow connection',
        details: `Latency: ${latency}ms`,
        recommendations: latency > 3000 ? ['Consider switching to a faster internet connection'] : []
      };
    } catch (error) {
      return {
        passed: false,
        message: 'No internet connection',
        details: 'Unable to reach external servers',
        recommendations: ['Check your internet connection', 'Disable VPN if active']
      };
    }
  };

  const testWebRTCSupport = async () => {
    const hasRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    return {
      passed: hasRTC && hasGetUserMedia,
      message: hasRTC && hasGetUserMedia ? 'Browser supports WebRTC' : 'Browser does not support WebRTC',
      details: `RTCPeerConnection: ${hasRTC ? 'Yes' : 'No'}, getUserMedia: ${hasGetUserMedia ? 'Yes' : 'No'}`,
      recommendations: !hasRTC || !hasGetUserMedia ? [
        'Use a modern browser like Chrome, Firefox, Safari, or Edge',
        'Update your browser to the latest version'
      ] : []
    };
  };

  const testCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTracks = stream.getVideoTracks();
      
      // Stop the stream immediately after testing
      stream.getTracks().forEach(track => track.stop());
      
      return {
        passed: videoTracks.length > 0,
        message: 'Camera access granted',
        details: `Found ${videoTracks.length} video source(s)`,
        recommendations: []
      };
    } catch (error) {
      let message = 'Camera access denied';
      let recommendations = ['Allow camera access when prompted', 'Check browser permissions'];
      
      if (error.name === 'NotFoundError') {
        message = 'No camera found';
        recommendations = ['Connect a camera to your device', 'Check camera drivers'];
      } else if (error.name === 'NotAllowedError') {
        message = 'Camera permission denied';
        recommendations = ['Click allow when prompted for camera access', 'Check browser permission settings'];
      }
      
      return {
        passed: false,
        message,
        details: error.message,
        recommendations
      };
    }
  };

  const testMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();
      
      // Stop the stream immediately after testing
      stream.getTracks().forEach(track => track.stop());
      
      return {
        passed: audioTracks.length > 0,
        message: 'Microphone access granted',
        details: `Found ${audioTracks.length} audio source(s)`,
        recommendations: []
      };
    } catch (error) {
      let message = 'Microphone access denied';
      let recommendations = ['Allow microphone access when prompted', 'Check browser permissions'];
      
      if (error.name === 'NotFoundError') {
        message = 'No microphone found';
        recommendations = ['Connect a microphone to your device', 'Check audio drivers'];
      } else if (error.name === 'NotAllowedError') {
        message = 'Microphone permission denied';
        recommendations = ['Click allow when prompted for microphone access', 'Check browser permission settings'];
      }
      
      return {
        passed: false,
        message,
        details: error.message,
        recommendations
      };
    }
  };

  const testMediaQuality = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      const videoSettings = videoTrack.getSettings();
      const audioSettings = audioTrack.getSettings();
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      const videoQuality = videoSettings.width >= 720 ? 'HD' : 'SD';
      const hasAudio = audioSettings.sampleRate > 0;
      
      return {
        passed: videoSettings.width >= 480 && hasAudio,
        message: `${videoQuality} video quality available`,
        details: `Video: ${videoSettings.width}x${videoSettings.height}, Audio: ${audioSettings.sampleRate}Hz`,
        recommendations: videoSettings.width < 720 ? [
          'Ensure good lighting for better video quality',
          'Close other applications using the camera'
        ] : []
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Unable to test media quality',
        details: error.message,
        recommendations: ['Grant camera and microphone permissions first']
      };
    }
  };

  const testNetworkSpeed = async () => {
    try {
      // Simple download speed test
      const start = Date.now();
      const response = await fetch('https://httpbin.org/bytes/1048576', { // 1MB
        cache: 'no-cache'
      });
      await response.blob();
      const duration = (Date.now() - start) / 1000;
      const speedMbps = (1 / duration) * 8; // Convert to Mbps
      
      const isGoodSpeed = speedMbps >= 2; // Minimum 2 Mbps for good video calls
      
      return {
        passed: isGoodSpeed,
        message: isGoodSpeed ? 'Good network speed' : 'Slow network speed',
        details: `Download speed: ${speedMbps.toFixed(2)} Mbps`,
        recommendations: !isGoodSpeed ? [
          'Close bandwidth-intensive applications',
          'Switch to a wired connection if possible',
          'Contact your ISP if speed is consistently slow'
        ] : []
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Unable to test network speed',
        details: 'Network test failed',
        recommendations: ['Check your internet connection']
      };
    }
  };

  const testServerConnectivity = async () => {
    try {
      const response = await apiClient.get('/video-calls/connection-test');
      
      return {
        passed: response.status === 200,
        message: 'Connected to video call servers',
        details: 'All systems operational',
        recommendations: []
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Cannot connect to video call servers',
        details: error.response?.data?.message || error.message,
        recommendations: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the problem persists'
        ]
      };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return '⏳';
      case 'pass': return '✅';
      case 'fail': return '❌';
      default: return '⏳';
    }
  };

  const getOverallMessage = () => {
    if (overallScore >= 90) return 'Excellent - You\'re ready for video calls!';
    if (overallScore >= 70) return 'Good - Video calls should work well';
    if (overallScore >= 50) return 'Fair - You may experience some issues';
    return 'Poor - Please address the issues before starting a video call';
  };

  return (
    <div className="connection-test">
      <div className="test-header">
        <h2>Video Call Connection Test</h2>
        <p>We're checking your device and connection to ensure the best video call experience.</p>
      </div>

      <div className="test-results">
        {testResults.map((test, index) => (
          <div key={index} className={`test-item ${test.status}`}>
            <div className="test-main">
              <span className="test-icon">{getStatusIcon(test.status)}</span>
              <div className="test-info">
                <h3>{test.name}</h3>
                <p>{test.message}</p>
                {test.details && <small>{test.details}</small>}
              </div>
            </div>
            
            {test.recommendations && test.recommendations.length > 0 && (
              <div className="test-recommendations">
                <h4>Recommendations:</h4>
                <ul>
                  {test.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {isTestingComplete && (
        <div className="test-summary">
          <div className={`overall-score ${overallScore >= 70 ? 'good' : 'poor'}`}>
            <h3>Overall Score: {overallScore}%</h3>
            <p>{getOverallMessage()}</p>
          </div>
          
          {overallScore < 70 && (
            <div className="test-warning">
              <h4>⚠️ Issues Detected</h4>
              <p>Some tests failed. Please address the recommendations above before starting your video call.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
