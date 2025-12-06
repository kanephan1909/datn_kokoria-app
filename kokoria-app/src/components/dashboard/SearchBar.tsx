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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
      }}>
      <Ionicons name="search-outline" size={24} color="#6B7280" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Tìm kiếm gà rán, combo, đồ uống..."
        placeholderTextColor="#9CA3AF"
        style={{
          marginLeft: 12,
          flex: 1,
          fontSize: 16,
          color: '#1F2937',
          fontWeight: '500',
        }}
        editable={!isRecording}
      />
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {value.length > 0 && !isRecording && (
          <TouchableOpacity
            onPress={() => onChange('')}
            activeOpacity={0.7}
            style={{marginRight: 8}}>
            <Ionicons name="close-circle" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleVoicePress}
          activeOpacity={0.7}
          style={{marginLeft: 4}}
          disabled={isRecording}>
          {isRecording ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons
              name="mic-outline"
              size={24}
              color={isRecording ? '#EF4444' : '#6B7280'}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
