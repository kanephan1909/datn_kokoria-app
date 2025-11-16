import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons';

const CategoriesScreen = () => {
    const navigation = useNavigation();
  return (
    <View className='flex-1 bg-gray-50'>
        <View className='flex-row items-center justify-between px-4 py-4'>
            <Text className='text-xl font-bold text-gray-800'>Danh Mục Sản Phẩm</Text>
            <TouchableOpacity className='flex-row items-center bg-blue-500 rounded-lg px-3 py-2' onPress={() => navigation.navigate('AddCategory')}>
                <Ionicons name='add-circle' size={24} color='white' />
                <Text className='text-white font-semibold ml-2'>Thêm</Text>
            </TouchableOpacity>
        </View>
    </View>
  )
}

export default CategoriesScreen

const styles = StyleSheet.create({})