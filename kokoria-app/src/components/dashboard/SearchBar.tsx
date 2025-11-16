import {TextInput, View, TouchableOpacity} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-md" style={{elevation: 3}}>
      <Ionicons name="search-outline" size={22} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Tìm kiếm gà rán, combo, đồ uống..."
        placeholderTextColor="#9CA3AF"
        className="ml-3 flex-1 text-base text-gray-800"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
