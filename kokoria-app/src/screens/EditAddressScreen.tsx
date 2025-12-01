import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchAddressById, updateAddress} from '../../api/apiClient';

const EditAddressScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {addressId} = route.params as {addressId: string};
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadAddress = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetchAddressById(addressId);
      if (response.success && response.data) {
        const addr = response.data;
        setName(addr.name || '');
        setPhone(addr.phone || '');
        setAddress(addr.address || '');
        setWard(addr.ward || '');
        setDistrict(addr.district || '');
        setCity(addr.city || '');
        setIsDefault(addr.isDefault || false);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy địa chỉ');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading address:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin địa chỉ');
      navigation.goBack();
    } finally {
      setIsLoadingData(false);
    }
  }, [addressId, navigation]);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !ward.trim() || !district.trim() || !city.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateAddress(addressId, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
        isDefault,
      });
      if (response.success) {
        Alert.alert('Thành công', 'Đã cập nhật địa chỉ', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể cập nhật địa chỉ');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header */}
        <View className="bg-orange-500 px-4 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">Sửa địa chỉ</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-gray-500 text-xs mb-2">Họ và tên *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ và tên"
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
              />

              <Text className="text-gray-500 text-xs mb-2 mt-4">Số điện thoại *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
              />

              <Text className="text-gray-500 text-xs mb-2 mt-4">Địa chỉ *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Số nhà, tên đường"
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
              />

              <Text className="text-gray-500 text-xs mb-2 mt-4">Phường/Xã *</Text>
              <TextInput
                value={ward}
                onChangeText={setWard}
                placeholder="Nhập phường/xã"
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
              />

              <Text className="text-gray-500 text-xs mb-2 mt-4">Quận/Huyện *</Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder="Nhập quận/huyện"
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
              />

              <Text className="text-gray-500 text-xs mb-2 mt-4">Tỉnh/Thành phố *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Nhập tỉnh/thành phố"
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
              />

              <TouchableOpacity
                onPress={() => setIsDefault(!isDefault)}
                className="flex-row items-center mt-4">
                <View
                  className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                    isDefault ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                  }`}>
                  {isDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text className="text-gray-800">Đặt làm địa chỉ mặc định</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className={`rounded-xl py-4 items-center ${
              isLoading ? 'bg-gray-300' : 'bg-orange-500'
            }`}>
            <Text className="text-white font-bold text-lg">
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditAddressScreen;

