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
  createUser,
  updateUser,
  fetchUserById,
} from '../api/apiClient';

const AddUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const userId = (route.params as any)?.userId;
  const isEdit = !!userId;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  }>({});

  // Fetch user nếu đang edit
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
    enabled: isEdit,
  });

  // Xử lý data khi fetch thành công
  useEffect(() => {
    if (userData?.success && userData?.data) {
      const user = userData.data;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Không hiển thị password cũ
        phone: user.phone || '',
        role: user.role || 'USER',
      });
    }
  }, [userData]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!isEdit && !formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert('Thành công', 'Người dùng đã được tạo thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo người dùng');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      Alert.alert('Thành công', 'Người dùng đã được cập nhật', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật người dùng');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      role: formData.role,
    };

    // Chỉ thêm password nếu có (khi tạo mới hoặc khi sửa có nhập password mới)
    if (formData.password) {
      submitData.password = formData.password;
    }

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEdit && isLoadingUser) {
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
            Tên <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập tên người dùng"
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

        {/* Email */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Email <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập email"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(text) => {
              setFormData({ ...formData, email: text });
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isEdit} // Không cho sửa email khi edit
          />
          {errors.email && <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>}
          {isEdit && (
            <Text className="text-gray-500 text-xs mt-1">Email không thể thay đổi</Text>
          )}
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Mật khẩu {!isEdit && <Text className="text-red-500">*</Text>}
            {isEdit && <Text className="text-gray-500 text-xs">(để trống nếu không đổi)</Text>}
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder={isEdit ? "Nhập mật khẩu mới (tùy chọn)" : "Nhập mật khẩu"}
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(text) => {
              setFormData({ ...formData, password: text });
              if (errors.password) {
                setErrors({ ...errors, password: undefined });
              }
            }}
            secureTextEntry
          />
          {errors.password && (
            <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
          )}
        </View>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Số điện thoại</Text>
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

        {/* Role */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Vai trò</Text>
          <View className="flex-row gap-2 flex-wrap">
            {['USER', 'ADMIN', 'DRIVER'].map((role) => (
              <TouchableOpacity
                key={role}
                className={`px-4 py-2 rounded-full ${
                  formData.role === role ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                onPress={() => setFormData({ ...formData, role })}
              >
                <Text
                  className={`font-semibold ${
                    formData.role === role ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
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

export default AddUserScreen;

