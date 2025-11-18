import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDriver,
  updateDriver,
  fetchDriverById,
} from '../api/apiClient';

const AddDriverScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const driverId = (route.params as any)?.driverId;
  const isEdit = !!driverId;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    isOnline: false,
    deviceToken: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  // Fetch driver nếu đang edit
  const { data: driverData, isLoading: isLoadingDriver } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => fetchDriverById(driverId),
    enabled: isEdit,
  });

  // Xử lý data khi fetch thành công
  useEffect(() => {
    if (driverData?.success && driverData?.data) {
      const driver = driverData.data;
      setFormData({
        name: driver.name || '',
        phone: driver.phone || '',
        avatar: driver.avatar || '',
        isOnline: driver.isOnline || false,
        deviceToken: driver.deviceToken || '',
      });
    }
  }, [driverData]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên tài xế không được để trống';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      Alert.alert('Thành công', 'Tài xế đã được tạo thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo tài xế');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDriver(driverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
      Alert.alert('Thành công', 'Tài xế đã được cập nhật', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật tài xế');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      avatar: formData.avatar.trim() || undefined,
      isOnline: formData.isOnline,
      deviceToken: formData.deviceToken.trim() || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEdit && isLoadingDriver) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Name */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Tên tài xế <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập tên tài xế"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
          />
          {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>}
        </View>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Số điện thoại <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#9CA3AF"
            value={formData.phone}
            onChangeText={(text) => {
              setFormData({ ...formData, phone: text.replace(/[^0-9]/g, '') });
              if (errors.phone) {
                setErrors({ ...errors, phone: undefined });
              }
            }}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text className="text-red-500 text-sm mt-1">{errors.phone}</Text>}
        </View>

        {/* Avatar URL */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">URL ảnh đại diện</Text>
          <TextInput
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-base"
            placeholder="Nhập URL ảnh (tùy chọn)"
            placeholderTextColor="#9CA3AF"
            value={formData.avatar}
            onChangeText={(text) => setFormData({ ...formData, avatar: text })}
            autoCapitalize="none"
          />
        </View>

        {/* Device Token */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Device Token</Text>
          <TextInput
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-base"
            placeholder="Nhập device token (tùy chọn)"
            placeholderTextColor="#9CA3AF"
            value={formData.deviceToken}
            onChangeText={(text) => setFormData({ ...formData, deviceToken: text })}
            autoCapitalize="none"
          />
        </View>

        {/* Status */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Trạng thái</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border-2 ${
                formData.isOnline
                  ? 'bg-green-50 border-green-500'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => setFormData({ ...formData, isOnline: true })}
            >
              <Ionicons
                name={formData.isOnline ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={formData.isOnline ? '#10B981' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  formData.isOnline ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border-2 ${
                !formData.isOnline
                  ? 'bg-gray-50 border-gray-500'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => setFormData({ ...formData, isOnline: false })}
            >
              <Ionicons
                name={!formData.isOnline ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={!formData.isOnline ? '#6B7280' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  !formData.isOnline ? 'text-gray-700' : 'text-gray-600'
                }`}
              >
                Offline
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded-lg py-3 items-center justify-center"
            onPress={() => navigation.goBack()}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Text className="text-gray-700 font-semibold text-base">Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-blue-500 rounded-lg py-3 items-center justify-center flex-row"
            onPress={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text className="text-white font-semibold ml-2 text-base">
                  {isEdit ? 'Cập nhật' : 'Lưu'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default AddDriverScreen;

