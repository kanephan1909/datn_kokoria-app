import {TextInput, View, TouchableOpacity, ActivityIndicator} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useVoiceRecognition} from '../../hooks/useVoiceRecognition';

export default function SearchBar({
  value,
  onChange,
  onVoicePress,
}: {
  value: string;
  onChange: (text: string) => void;
  onVoicePress?: () => void;
}) {
  const {isRecording, startRecording, stopRecording} = useVoiceRecognition(
    (text) => {
      onChange(text);
    },
  );

  const handleVoicePress = () => {
    if (onVoicePress) {
      onVoicePress();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View className="flex-row items-center bg-white rounded-full px-4 py-1 shadow-md" style={{elevation: 3}}>
      <Ionicons name="search-outline" size={22} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Tìm kiếm gà rán, combo, đồ uống..."
        placeholderTextColor="#9CA3AF"
        className="ml-3 flex-1 text-base text-gray-800"
        editable={!isRecording}
      />
      <View className="flex-row items-center">
        {value.length > 0 && !isRecording && (
          <TouchableOpacity
            onPress={() => onChange('')}
            activeOpacity={0.7}
            className="mr-2">
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleVoicePress}
          activeOpacity={0.7}
          className="ml-2"
          disabled={isRecording}>
          {isRecording ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons
              name="mic-outline"
              size={22}
              color={isRecording ? '#EF4444' : '#9CA3AF'}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
