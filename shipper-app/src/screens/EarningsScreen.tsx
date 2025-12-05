import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EarningsScreen = () => {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Thu nhập</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="items-center justify-center flex-1 px-6 py-20">
          <Ionicons name="cash-outline" size={80} color="#9CA3AF" />
          <Text className="text-gray-600 text-lg font-semibold mt-4 text-center">
            Tính năng đang phát triển
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Tính năng xem thu nhập sẽ sớm được cập nhật
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default EarningsScreen;
