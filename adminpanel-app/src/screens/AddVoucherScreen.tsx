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
  createVoucher,
  updateVoucher,
  fetchVoucherById,
} from '../api/apiClient';

const AddVoucherScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const voucherId = (route.params as any)?.voucherId;
  const isEdit = !!voucherId;

  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    minOrder: '',
    maxDeduct: '',
    expiry: '',
  });
  const [errors, setErrors] = useState<{
    code?: string;
    discount?: string;
    expiry?: string;
  }>({});

  // Fetch voucher nếu đang edit
  const { data: voucherData, isLoading: isLoadingVoucher } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => fetchVoucherById(voucherId),
    enabled: isEdit,
  });

  // Xử lý data khi fetch thành công
  useEffect(() => {
    if (voucherData?.success && voucherData?.data) {
      const voucher = voucherData.data;
      const expiryDate = new Date(voucher.expiry);
      setFormData({
        code: voucher.code || '',
        discount: voucher.discount?.toString() || '',
        minOrder: voucher.minOrder?.toString() || '',
        maxDeduct: voucher.maxDeduct?.toString() || '',
        expiry: expiryDate.toISOString().split('T')[0],
      });
    }
  }, [voucherData]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã voucher không được để trống';
    }

    if (!formData.discount || parseFloat(formData.discount) <= 0) {
      newErrors.discount = 'Giảm giá phải lớn hơn 0';
    } else if (parseFloat(formData.discount) > 100) {
      newErrors.discount = 'Giảm giá không được vượt quá 100%';
    }

    if (!formData.expiry) {
      newErrors.expiry = 'Ngày hết hạn không được để trống';
    } else if (new Date(formData.expiry) < new Date()) {
      newErrors.expiry = 'Ngày hết hạn phải trong tương lai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      Alert.alert('Thành công', 'Voucher đã được tạo thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo voucher');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateVoucher(voucherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucherId] });
      Alert.alert('Thành công', 'Voucher đã được cập nhật', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật voucher');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      code: formData.code.trim().toUpperCase(),
      discount: parseFloat(formData.discount),
      minOrder: formData.minOrder ? parseFloat(formData.minOrder) : undefined,
      maxDeduct: formData.maxDeduct ? parseFloat(formData.maxDeduct) : undefined,
      expiry: new Date(formData.expiry).toISOString(),
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEdit && isLoadingVoucher) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Code */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Mã voucher <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập mã voucher (VD: SALE50)"
            placeholderTextColor="#9CA3AF"
            value={formData.code}
            onChangeText={(text) => {
              setFormData({ ...formData, code: text.toUpperCase() });
              if (errors.code) {
                setErrors({ ...errors, code: undefined });
              }
            }}
            autoCapitalize="characters"
          />
          {errors.code && <Text className="text-red-500 text-sm mt-1">{errors.code}</Text>}
        </View>

        {/* Discount */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Giảm giá (%) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.discount ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập % giảm giá (0-100)"
            placeholderTextColor="#9CA3AF"
            value={formData.discount}
            onChangeText={(text) => {
              setFormData({ ...formData, discount: text.replace(/[^0-9.]/g, '') });
              if (errors.discount) {
                setErrors({ ...errors, discount: undefined });
              }
            }}
            keyboardType="numeric"
          />
          {errors.discount && (
            <Text className="text-red-500 text-sm mt-1">{errors.discount}</Text>
          )}
        </View>

        {/* Min Order */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Đơn tối thiểu (VND)</Text>
          <TextInput
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-base"
            placeholder="Nhập đơn tối thiểu (tùy chọn)"
            placeholderTextColor="#9CA3AF"
            value={formData.minOrder}
            onChangeText={(text) =>
              setFormData({ ...formData, minOrder: text.replace(/[^0-9]/g, '') })
            }
            keyboardType="numeric"
          />
        </View>

        {/* Max Deduct */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Giảm tối đa (VND)</Text>
          <TextInput
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-base"
            placeholder="Nhập giảm tối đa (tùy chọn)"
            placeholderTextColor="#9CA3AF"
            value={formData.maxDeduct}
            onChangeText={(text) =>
              setFormData({ ...formData, maxDeduct: text.replace(/[^0-9]/g, '') })
            }
            keyboardType="numeric"
          />
        </View>

        {/* Expiry */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">
            Ngày hết hạn <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.expiry ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={formData.expiry}
            onChangeText={(text) => {
              setFormData({ ...formData, expiry: text });
              if (errors.expiry) {
                setErrors({ ...errors, expiry: undefined });
              }
            }}
          />
          {errors.expiry && <Text className="text-red-500 text-sm mt-1">{errors.expiry}</Text>}
          <Text className="text-gray-500 text-xs mt-1">
            Định dạng: YYYY-MM-DD (ví dụ: 2024-12-31)
          </Text>
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

export default AddVoucherScreen;

