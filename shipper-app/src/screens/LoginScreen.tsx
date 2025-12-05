import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const { login: setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (data) => {
      if (data.success && data.data?.user) {
        // Kiểm tra role phải là DRIVER
        if (data.data.user.role !== 'DRIVER') {
          Alert.alert(
            'Lỗi',
            'Tài khoản này không phải là tài khoản shipper. Vui lòng đăng nhập bằng tài khoản shipper.'
          );
          return;
        }
        setUser(data.data.user);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi đăng nhập', message);
    },
  });

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validateForm()) {
      return;
    }

    loginMutation.mutate({
      email: formData.email.trim(),
      password: formData.password,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <View 
            className="bg-blue-500 rounded-full p-6 mb-6"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="bicycle" size={56} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Shipper App</Text>
          <Text className="text-gray-600 text-center text-base">Đăng nhập để nhận và giao đơn hàng</Text>
        </View>

        <View className="space-y-4">
          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2.5 text-base">Email</Text>
            <View
              className={`flex-row items-center bg-white rounded-xl px-4 py-2.5 border ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Nhập email của bạn"
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
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text className="text-red-500 text-sm mt-1.5">{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2.5 text-base">Mật khẩu</Text>
            <View
              className={`flex-row items-center bg-white rounded-xl px-4 py-2.5 border ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1.5">{errors.password}</Text>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="bg-blue-500 rounded-xl py-4 items-center justify-center mt-2"
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text className="text-center text-gray-500 text-sm mt-4">
            Sử dụng tài khoản shipper để đăng nhập
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
