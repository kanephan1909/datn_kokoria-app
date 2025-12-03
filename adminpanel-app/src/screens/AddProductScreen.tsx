import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  updateProduct,
  fetchCategories,
  fetchProductById,
  uploadImage,
} from '../api/apiClient';
import {ProductVariant, ProductOption} from '../types/product';
import VariantManager from '../components/VariantManager';

const AddProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const productId = (route.params as any)?.productId;
  const isEdit = !!productId;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    imageUri: null as string | null, // Local URI từ image picker
    categoryId: '',
    stock: '',
    isActive: true,
    variants: [] as ProductVariant[],
  });
  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    categoryId?: string;
    stock?: string;
    imageUrl?: string;
  }>({});
  const [uploading, setUploading] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Fetch product nếu đang edit
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
    enabled: isEdit,
  });

  // Xử lý data khi fetch thành công
  useEffect(() => {
    if (productData?.success && productData?.data) {
      const product = productData.data;
      
      // Parse variants nếu là string (MongoDB có thể trả về JSON string)
      let parsedVariants: ProductVariant[] = [];
      if (product.variants) {
        if (typeof product.variants === 'string') {
          try {
            parsedVariants = JSON.parse(product.variants);
          } catch (e) {
            console.error('Error parsing variants:', e);
            parsedVariants = [];
          }
        } else if (Array.isArray(product.variants)) {
          parsedVariants = product.variants;
        } else if (typeof product.variants === 'object' && product.variants !== null) {
          // Nếu là object, convert thành array
          parsedVariants = [product.variants];
        }
      }
      
      // QUAN TRỌNG: Đảm bảo tất cả options có id
      parsedVariants = parsedVariants.map((variant, variantIndex) => ({
        ...variant,
        options: variant.options?.map((option, optionIndex) => ({
          ...option,
          // Nếu option không có id, tạo id mới dựa trên variant type và index
          id: option.id || `variant-${variantIndex}-option-${optionIndex}-${Date.now()}`,
        })) || [],
      }));
      
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        imageUri: null,
        categoryId: product.categoryId || '',
        stock: product.stock?.toString() || '0',
        isActive: product.isActive !== undefined ? product.isActive : true,
        variants: parsedVariants,
      });
    }
  }, [productData]);

  const categories = categoriesData?.data || [];

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Giá phải lớn hơn 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }

    if (formData.stock && parseInt(formData.stock) < 0) {
      newErrors.stock = 'Số lượng tồn kho phải >= 0';
    }

    if (formData.imageUrl && !/^https?:\/\/.+/.test(formData.imageUrl.trim())) {
      newErrors.imageUrl = 'URL ảnh không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        imageUri: result.assets[0].uri,
        imageUrl: '', // Clear URL nếu có
      });
      if (errors.imageUrl) {
        setErrors({ ...errors, imageUrl: undefined });
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        imageUri: result.assets[0].uri,
        imageUrl: '', // Clear URL nếu có
      });
      if (errors.imageUrl) {
        setErrors({ ...errors, imageUrl: undefined });
      }
    }
  };

  const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
    try {
      setUploading(true);
      const response = await uploadImage(imageUri);
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      throw new Error(response.message || 'Upload ảnh thất bại');
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      // Đảm bảo variants luôn có trong data
      const mutationData = {
        ...data,
        variants: data.variants !== undefined ? data.variants : [],
      };
      return createProduct(mutationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Thành công', 'Sản phẩm đã được tạo thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo sản phẩm');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      // Đảm bảo variants luôn có trong data
      const mutationData = {
        ...data,
        variants: data.variants !== undefined ? data.variants : [],
      };
      return updateProduct(productId, mutationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      Alert.alert('Thành công', 'Sản phẩm đã được cập nhật', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật sản phẩm');
    },
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let imageUrl = formData.imageUrl.trim() || undefined;

      // Nếu có ảnh từ image picker, upload lên Cloudinary
      if (formData.imageUri) {
        imageUrl = await uploadImageToCloudinary(formData.imageUri);
      }

      // Chuẩn bị variants để gửi - QUAN TRỌNG: Luôn gửi variants (kể cả empty array)
      // KHÔNG filter - giữ lại TẤT CẢ variants để user có thể chỉnh sửa sau
      let variantsToSend: any[] = [];
      
      if (formData.variants && formData.variants.length > 0) {
        // Map TẤT CẢ variants (kể cả chưa hoàn chỉnh) - KHÔNG filter
        variantsToSend = formData.variants.map((variant, variantIndex) => {
          // Map TẤT CẢ options (kể cả chưa có name) - KHÔNG filter
          const mappedOptions = (variant.options || []).map((option, optionIndex) => ({
            id: option.id || `variant-${variantIndex}-option-${optionIndex}-${Date.now()}`,
            name: (option.name || '').trim(),
            price: typeof option.price === 'number' ? option.price : 0,
          }));

          return {
            type: variant.type || 'other',
            name: (variant.name || '').trim(),
            required: variant.required !== undefined ? variant.required : true,
            options: mappedOptions,
          };
        });
      }
      
      // Đảm bảo variants luôn là array (không phải undefined)
      // Nếu variantsToSend là empty array, vẫn gửi để backend biết là muốn xóa variants
      const finalVariants = Array.isArray(variantsToSend) ? variantsToSend : [];

      const submitData: any = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || undefined,
        imageUrl: imageUrl,
        categoryId: formData.categoryId,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        isActive: formData.isActive,
        variants: finalVariants,
      };

      if (isEdit) {
        updateMutation.mutate(submitData);
      } else {
        createMutation.mutate(submitData);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể upload ảnh');
    }
  };

  if (isEdit && isLoadingProduct) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Image */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Ảnh sản phẩm (tùy chọn)</Text>
          
          {formData.imageUri ? (
            <View className="mb-3">
              <View className="relative">
                <Image
                  source={{ uri: formData.imageUri }}
                  className="w-full h-64 rounded-xl bg-gray-200"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                  onPress={() => setFormData({ ...formData, imageUri: null })}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : formData.imageUrl && /^https?:\/\/.+/.test(formData.imageUrl.trim()) ? (
            <View className="mb-3">
              <View className="relative">
                <Image
                  source={{ uri: formData.imageUrl }}
                  className="w-full h-64 rounded-xl bg-gray-200"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                  onPress={() => setFormData({ ...formData, imageUrl: '' })}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-xl py-3 items-center flex-row justify-center"
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Chọn ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-500 rounded-xl py-3 items-center flex-row justify-center"
                onPress={takePhoto}
                disabled={uploading}
              >
                <Ionicons name="camera-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Chụp ảnh</Text>
              </TouchableOpacity>
            </View>
          )}

          {errors.imageUrl && (
            <Text className="text-red-500 text-sm mt-1">{errors.imageUrl}</Text>
          )}

          {uploading && (
            <View className="mt-2 flex-row items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="text-gray-600 text-sm ml-2">Đang upload ảnh...</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Tên sản phẩm <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập tên sản phẩm"
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

        {/* Category */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Danh mục <Text className="text-red-500">*</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category: any) => (
              <TouchableOpacity
                key={category.id}
                className={`px-4 py-2 rounded-full mr-2 ${
                  formData.categoryId === category.id
                    ? 'bg-blue-500'
                    : 'bg-white border border-gray-300'
                }`}
                onPress={() => {
                  setFormData({ ...formData, categoryId: category.id });
                  if (errors.categoryId) {
                    setErrors({ ...errors, categoryId: undefined });
                  }
                }}
              >
                <Text
                  className={`font-semibold ${
                    formData.categoryId === category.id ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.categoryId && (
            <Text className="text-red-500 text-sm mt-1">{errors.categoryId}</Text>
          )}
        </View>

        {/* Price */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Giá (VND) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập giá sản phẩm"
            placeholderTextColor="#9CA3AF"
            value={formData.price}
            onChangeText={(text) => {
              setFormData({ ...formData, price: text.replace(/[^0-9]/g, '') });
              if (errors.price) {
                setErrors({ ...errors, price: undefined });
              }
            }}
            keyboardType="numeric"
          />
          {errors.price && <Text className="text-red-500 text-sm mt-1">{errors.price}</Text>}
        </View>

        {/* Stock */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Số lượng tồn kho</Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder="Nhập số lượng"
            placeholderTextColor="#9CA3AF"
            value={formData.stock}
            onChangeText={(text) => {
              setFormData({ ...formData, stock: text.replace(/[^0-9]/g, '') });
              if (errors.stock) {
                setErrors({ ...errors, stock: undefined });
              }
            }}
            keyboardType="numeric"
          />
          {errors.stock && <Text className="text-red-500 text-sm mt-1">{errors.stock}</Text>}
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Mô tả</Text>
          <TextInput
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-base"
            placeholder="Nhập mô tả sản phẩm"
            placeholderTextColor="#9CA3AF"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Variants Manager */}
        <VariantManager
          variants={formData.variants}
          onChange={(variants) => setFormData({ ...formData, variants })}
        />

        {/* Status */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Trạng thái</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border-2 ${
                formData.isActive
                  ? 'bg-green-50 border-green-500'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => setFormData({ ...formData, isActive: true })}
            >
              <Ionicons
                name={formData.isActive ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={formData.isActive ? '#10B981' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  formData.isActive ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                Đang bán
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border-2 ${
                !formData.isActive
                  ? 'bg-red-50 border-red-500'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => setFormData({ ...formData, isActive: false })}
            >
              <Ionicons
                name={!formData.isActive ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={!formData.isActive ? '#EF4444' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  !formData.isActive ? 'text-red-700' : 'text-gray-600'
                }`}
              >
                Tạm ngưng
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
            disabled={createMutation.isPending || updateMutation.isPending || uploading}
          >
            {(createMutation.isPending || updateMutation.isPending || uploading) ? (
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

export default AddProductScreen;

