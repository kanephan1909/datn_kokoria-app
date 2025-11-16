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
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

const AddCategoryScreen = () => {
  const navigation = useNavigation()
  const [formData, setFormData] = useState({
    name: '',
    status: 'active', // active hoặc inactive
    image: null as string | null,
  })
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({})
  const [loading, setLoading] = useState(false)

  const validateURL = (url: string) => {
    try {
      const urlPattern = /^https?:\/\/.+/
      return urlPattern.test(url.trim())
    } catch {
      return false
    }
  }

  const validateForm = () => {
    const newErrors: { name?: string; image?: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên danh mục sản phẩm không được để trống'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên danh mục sản phẩm phải có ít nhất 2 ký tự'
    }

    if (!formData.image || !formData.image.trim()) {
      newErrors.image = 'Vui lòng nhập URL ảnh từ Cloudinary'
    } else if (!validateURL(formData.image)) {
      newErrors.image = 'URL ảnh không hợp lệ. Vui lòng nhập URL đầy đủ (bắt đầu bằng http:// hoặc https://)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // TODO: Gọi API để thêm danh mục
      // await addCategoryAPI(formData)
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
    } catch (error) {
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi thêm danh mục. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigation.goBack()
  }

  return (
    <ScrollView className='flex-1 bg-gray-50'>
      <View className='p-4'>
        {/* URL ảnh danh mục */}
        <View className='mb-4'>
          <Text className='text-gray-700 font-semibold mb-2 text-base'>
            URL ảnh từ Cloudinary <Text className='text-red-500'>*</Text>
          </Text>
          <TextInput
            className={`bg-white rounded-lg px-4 py-3 border ${
              errors.image ? 'border-red-500' : 'border-gray-300'
            } text-base`}
            placeholder='Nhập URL ảnh từ Cloudinary (ví dụ: https://res.cloudinary.com/...)'
            placeholderTextColor='#9CA3AF'
            value={formData.image || ''}
            onChangeText={(text) => {
              setFormData({ ...formData, image: text })
              if (errors.image) {
                setErrors({ ...errors, image: undefined })
              }
            }}
            autoCapitalize='none'
            autoCorrect={false}
            keyboardType='url'
          />
          {errors.image && (
            <Text className='text-red-500 text-sm mt-1'>{errors.image}</Text>
          )}
          {formData.image && formData.image.trim() && validateURL(formData.image) && (
            <View className='mt-3'>
              <Text className='text-gray-700 font-semibold mb-2 text-sm'>
                Preview ảnh:
              </Text>
              <View className='relative'>
                <Image
                  source={{ uri: formData.image }}
                  className='w-full h-48 rounded-lg bg-gray-200'
                  resizeMode='cover'
                />
                <TouchableOpacity
                  className='absolute top-2 right-2 bg-red-500 rounded-full p-2'
                  onPress={() => setFormData({ ...formData, image: '' })}
                >
                  <Ionicons name='close' size={20} color='white' />
                </TouchableOpacity>
              </View>
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
                formData.status === 'active'
                  ? 'bg-green-50 border-green-500'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => setFormData({ ...formData, status: 'active' })}
            >
              <Ionicons
                name={formData.status === 'active' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={formData.status === 'active' ? '#10B981' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  formData.status === 'active' ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                Hoạt động
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border-2 ${
                formData.status === 'inactive'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => setFormData({ ...formData, status: 'inactive' })}
            >
              <Ionicons
                name={formData.status === 'inactive' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={formData.status === 'inactive' ? '#EF4444' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  formData.status === 'inactive' ? 'text-red-700' : 'text-gray-600'
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
            disabled={loading}
          >
            <Text className='text-gray-700 font-semibold text-base'>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='flex-1 bg-blue-500 rounded-lg py-3 items-center justify-center flex-row'
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='white' />
            ) : (
              <>
                <Ionicons name='checkmark-circle' size={20} color='white' />
                <Text className='text-white font-semibold ml-2 text-base'>Lưu</Text>
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