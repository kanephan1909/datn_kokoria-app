import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MainRoutes, MainStackParamList} from '../../navigation/Routes';
import {Ionicons} from '@react-native-vector-icons/ionicons';

const Header = () => {
  const nav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return (
    <View className="flex px-4 pt-2 pb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-white/90 text-sm mb-1">Đơn hàng đã bắt đầu từ</Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-white text-3xl font-extrabold mr-2">
              15 Phút
            </Text>
            <Ionicons name="flash" size={24} color="#FFE66D" />
          </View>
          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center">
            <Text className="text-white/90 font-medium">560024 - Kane Phan</Text>
            <Ionicons
              name="chevron-down-outline"
              size={16}
              color="#fff"
              style={{marginLeft: 4}}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => nav.navigate(MainRoutes.Profile)}
          activeOpacity={0.7}
          className="bg-white/20 p-2 rounded-full">
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

// const styles = StyleSheet.create({})
