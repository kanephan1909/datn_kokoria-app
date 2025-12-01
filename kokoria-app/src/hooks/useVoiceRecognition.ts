import {useState, useEffect} from 'react';
import {Alert, Platform, PermissionsAndroid, Linking} from 'react-native';
import Voice from '@react-native-voice/voice';

// Get package name from app config
const getPackageName = () => {
  // Package name from android/app/build.gradle (applicationId)
  return 'com.kokoriaapp';
};

interface UseVoiceRecognitionReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
}

export const useVoiceRecognition = (
  onResult: (text: string) => void,
): UseVoiceRecognitionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setup event listeners
    Voice.onSpeechStart = () => {
      setIsRecording(true);
      setError(null);
    };

    Voice.onSpeechEnd = () => {
      setIsRecording(false);
    };

    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        onResult(e.value[0]);
      }
      setIsRecording(false);
    };

    Voice.onSpeechError = (e) => {
      setError(e.error?.message || 'Speech recognition error');
      setIsRecording(false);
      if (e.error?.message) {
        Alert.alert('Speech Recognition Error', e.error.message);
      }
    };

    Voice.onSpeechPartialResults = () => {
      // Optional: handle partial results
    };

    // Cleanup on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onResult]);

  const stopRecording = async () => {
    try {
      await Voice.stop();
      await Voice.cancel();
      setIsRecording(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      setIsRecording(false);
      Alert.alert('Error', err.message || 'Failed to stop recording');
    }
  };

  const checkPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        return result;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // iOS permissions are handled in Info.plist
    return true;
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Check if permission is already granted
        const hasPermission = await checkPermission();
        if (hasPermission) {
          return true;
        }

        // Request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone for voice search',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        // Permission was denied
        // Show dialog with option to open settings
        Alert.alert(
          'Permission Denied',
          'Microphone permission is required for voice search.\n\nPlease:\n1. Go to App permissions\n2. Find "Microphone" in the list\n3. Enable it\n\nNote: If you don\'t see Microphone, try using voice search once first, then check again.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                try {
                  // Try to open app-specific settings first
                  const packageName = getPackageName();
                  const settingsUrl = `package:${packageName}`;

                  // Try opening app settings
                  const canOpen = await Linking.canOpenURL(settingsUrl);
                  if (canOpen) {
                    await Linking.openURL(settingsUrl);
                  } else {
                    // Fallback to general settings
                    await Linking.openSettings();
                  }
                } catch (err) {
                  // Fallback to general settings
                  Linking.openSettings();
                }
              },
            },
          ],
        );
        return false;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // iOS permissions are handled in Info.plist
    return true;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        // Alert is already shown in requestPermissions
        return;
      }

      // Start voice recognition
      await Voice.start('vi-VN'); // Vietnamese language
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
      Alert.alert('Error', err.message || 'Failed to start voice recognition');
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
};
