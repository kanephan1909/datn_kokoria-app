import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Image
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { createCategory, updateCategory, fetchCategory, uploadImage } from '../api/apiClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const AddCategoryScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const queryClient = useQueryClient()
  const categoryId = (route.params as any)?.categoryId
  const isEdit = !!categoryId
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    image: null as string | null,
    imageUri: null as string | null, // Local URI từ image picker
  })
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({})
  const [uploading, setUploading] = useState(false)

  // Fetch category nếu đang edit
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => fetchCategory(categoryId),
    enabled: isEdit,
  })

  // Xử lý data khi fetch thành công
  useEffect(() => {
    if (categoryData?.success && categoryData?.data) {
      const category = categoryData.data
      setFormData({
        name: category.name || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        image: category.imageUrl || null,
        imageUri: null,
      })
    }
  }, [categoryData])

  const pickImage = async () => {
    // Yêu cầu quyền truy cập
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh')
      return
    }

    // Mở image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        imageUri: result.assets[0].uri,
        image: null, // Clear URL nếu có
      })
      if (errors.image) {
        setErrors({ ...errors, image: undefined })
      }
    }
  }

  const takePhoto = async () => {
    // Yêu cầu quyền truy cập camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh')
      return
    }

    // Mở camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        imageUri: result.assets[0].uri,
        image: null, // Clear URL nếu có
      })
      if (errors.image) {
        setErrors({ ...errors, image: undefined })
      }
    }
  }

  const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
    try {
      setUploading(true)
      const response = await uploadImage(imageUri)
      if (response.success && response.data?.url) {
        return response.data.url
      }
      throw new Error(response.message || 'Upload ảnh thất bại')
    } catch (error: any) {
      // Xử lý network error
      if (error?.isNetworkError || !error?.response) {
        throw new Error(error?.message || 'Không thể kết nối đến server để upload ảnh. Vui lòng kiểm tra kết nối mạng.')
      }
      // Xử lý các lỗi khác
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload ảnh thất bại'
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: { name?: string; image?: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên danh mục sản phẩm không được để trống'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên danh mục sản phẩm phải có ít nhất 2 ký tự'
    }

    // Chỉ validate ảnh khi tạo mới, không bắt buộc khi edit (có thể giữ ảnh cũ)
    if (!isEdit && !formData.imageUri && !formData.image) {
      newErrors.image = 'Vui lòng chọn ảnh hoặc nhập URL ảnh'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  // Sử dụng useMutation để tạo category
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; imageUrl: string; isActive?: boolean }) => createCategory(data),
    onSuccess: () => {
      // Invalidate cache để refetch danh sách categories
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      Alert.alert(
        'Thành công',
        'Danh mục đã được thêm thành công',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi thêm danh mục. Vui lòng thử lại.'
      Alert.alert(
        'Lỗi',
        errorMessage
      )
    }
  })

  // Sử dụng useMutation để cập nhật category
  const updateCategoryMutation = useMutation({
    mutationFn: (data: { name: string; imageUrl: string; isActive?: boolean }) => updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] })
      Alert.alert(
        'Thành công',
        'Danh mục đã được cập nhật thành công',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật danh mục. Vui lòng thử lại.'
      Alert.alert(
        'Lỗi',
        errorMessage
      )
    }
  })

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      let imageUrl = formData.image?.trim() || ''

      // Nếu có ảnh từ image picker, upload lên Cloudinary
      if (formData.imageUri) {
        try {
          imageUrl = await uploadImageToCloudinary(formData.imageUri)
        } catch (uploadError: any) {
          // Hiển thị lỗi upload riêng
          Alert.alert('Lỗi upload ảnh', uploadError?.message || 'Không thể upload ảnh. Vui lòng thử lại.')
          return
        }
      }

      // Gọi mutation để tạo hoặc cập nhật category
      if (isEdit) {
        // Khi edit, chỉ gửi imageUrl nếu có ảnh mới, nếu không thì giữ nguyên ảnh cũ
        if (imageUrl) {
          updateCategoryMutation.mutate({
            name: formData.name.trim(),
            imageUrl: imageUrl,
            isActive: formData.isActive
          })
        } else {
          // Nếu không có ảnh mới, chỉ cập nhật tên (giữ nguyên ảnh cũ)
          updateCategoryMutation.mutate({
            name: formData.name.trim(),
            imageUrl: formData.image || '', // Giữ nguyên ảnh cũ
            isActive: formData.isActive
          })
        }
      } else {
        createCategoryMutation.mutate({
          name: formData.name.trim(),
          imageUrl: imageUrl,
          isActive: formData.isActive
        })
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể upload ảnh')
    }
  }

  const handleCancel = () => {
    navigation.goBack()
  }

  if (isEdit && isLoadingCategory) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <ScrollView className='flex-1 bg-gray-50'>
      <View className='p-4'>
        {/* Ảnh danh mục */}
        <View className='mb-4'>
          <Text className='text-gray-700 font-semibold mb-2 text-base'>
            Ảnh danh mục <Text className='text-red-500'>*</Text>
          </Text>
          
          {formData.imageUri ? (
            <View className='mb-3'>
              <View className='relative'>
                <Image
                  source={{ uri: formData.imageUri }}
                  className='w-full h-64 rounded-xl bg-gray-200'
                  resizeMode='cover'
                />
                <TouchableOpacity
                  className='absolute top-2 right-2 bg-red-500 rounded-full p-2'
                  onPress={() => setFormData({ ...formData, imageUri: null })}
                >
                  <Ionicons name='close' size={20} color='white' />
                </TouchableOpacity>
              </View>
            </View>
          ) : formData.image ? (
            <View className='mb-3'>
              <View className='relative'>
                <Image
                  source={{ uri: formData.image }}
                  className='w-full h-64 rounded-xl bg-gray-200'
                  resizeMode='cover'
                />
                <TouchableOpacity
                  className='absolute top-2 right-2 bg-red-500 rounded-full p-2'
                  onPress={() => setFormData({ ...formData, image: null })}
                >
                  <Ionicons name='close' size={20} color='white' />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className='flex-row gap-2 mb-3'>
              <TouchableOpacity
                className='flex-1 bg-blue-500 rounded-xl py-3 items-center flex-row justify-center'
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name='image-outline' size={20} color='white' />
                <Text className='text-white font-semibold ml-2'>Chọn ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className='flex-1 bg-green-500 rounded-xl py-3 items-center flex-row justify-center'
                onPress={takePhoto}
                disabled={uploading}
              >
                <Ionicons name='camera-outline' size={20} color='white' />
                <Text className='text-white font-semibold ml-2'>Chụp ảnh</Text>
              </TouchableOpacity>
            </View>
          )}

          {errors.image && (
            <Text className='text-red-500 text-sm mt-1'>{errors.image}</Text>
          )}

          {uploading && (
            <View className='mt-2 flex-row items-center'>
              <ActivityIndicator size='small' color='#3B82F6' />
              <Text className='text-gray-600 text-sm ml-2'>Đang upload ảnh...</Text>
            </View>
          )}
        </View>

        {/* Tên danh mục */}
        <View className='mb-4'>
          <Text className='text-gray-700 font-semibold mb-2 text-base'>
            Tên danh mục <Text className='text-red-500'>*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder='Nhập tên danh mục'
            placeholderTextColor='#9CA3AF'
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text })
              if (errors.name) {
                setErrors({ ...errors, name: undefined })
              }
            }}
            maxLength={100}
          />
          {errors.name && (
            <Text className='text-red-500 text-sm mt-1'>{errors.name}</Text>
          )}
        </View>

        {/* Trạng thái */}
        <View className='mb-6'>
          <Text className='text-gray-700 font-semibold mb-2 text-base'>
            Trạng thái
          </Text>
          <View className='flex-row gap-3'>
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
                Hoạt động
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
                Tạm khóa
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View className='flex-row gap-3 mt-4'>
          <TouchableOpacity
            className='flex-1 bg-gray-200 rounded-lg py-3 items-center justify-center'
            onPress={handleCancel}
            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          >
            <Text className='text-gray-700 font-semibold text-base'>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='flex-1 bg-blue-500 rounded-lg py-3 items-center justify-center flex-row'
            onPress={handleSubmit}
            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending || uploading}
          >
            {(createCategoryMutation.isPending || updateCategoryMutation.isPending || uploading) ? (
              <ActivityIndicator color='white' />
            ) : (
              <>
                <Ionicons name='checkmark-circle' size={20} color='white' />
                <Text className='text-white font-semibold ml-2 text-base'>
                  {isEdit ? 'Cập nhật' : 'Lưu'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

export default AddCategoryScreen

const styles = StyleSheet.create({})