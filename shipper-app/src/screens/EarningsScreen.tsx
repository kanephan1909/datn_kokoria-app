import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EarningsScreen = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#F0F9FF' }}>
      {/* Header với gradient */}
      <View 
        className="px-5 pt-12 pb-6"
        style={{
          backgroundColor: '#3B82F6',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-2xl font-bold text-white">Thu nhập</Text>
            <Text className="text-blue-100 text-sm mt-1">
              Theo dõi thu nhập của bạn
            </Text>
          </View>
          <View 
            className="rounded-full p-3"
            style={{ 
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Ionicons name="cash" size={24} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="items-center justify-center flex-1 px-6 py-20">
          <View 
            className="bg-white rounded-full p-10 mb-6"
            style={{
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name="cash-outline" size={80} color="#10B981" />
          </View>
          <Text className="text-gray-800 text-2xl font-bold mt-4 text-center">
            Tính năng đang phát triển
          </Text>
          <Text className="text-gray-500 text-center mt-3 text-base leading-6">
            Tính năng xem thu nhập sẽ sớm được cập nhật{'\n'}
            Bạn sẽ có thể xem thống kê thu nhập, lịch sử giao hàng và nhiều hơn nữa
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default EarningsScreen;
