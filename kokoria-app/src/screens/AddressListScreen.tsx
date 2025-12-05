import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchAddresses, deleteAddress} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import {useCallback} from 'react';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

// Map backend format to frontend format
const mapBackendToFrontend = (backendAddress: any): Address => {
  // Backend trả về: mobile, street, locality
  // Frontend cần: phone, address, ward, district, city
  const localityParts = backendAddress.locality
    ? backendAddress.locality.split(',').map((s: string) => s.trim())
    : [];
  
  return {
    id: backendAddress.id,
    name: backendAddress.name || '',
    phone: backendAddress.mobile || backendAddress.phone || '',
    address: backendAddress.street || backendAddress.address || '',
    ward: localityParts[0] || '',
    district: localityParts[1] || '',
    city: localityParts[2] || localityParts.slice(2).join(', ') || '',
    isDefault: backendAddress.isDefault || false,
  };
};

const AddressListScreen = () => {
  const navigation = useNavigation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchAddresses();
      if (response.success && response.data) {
        const addressesList = Array.isArray(response.data)
          ? response.data
          : response.data.addresses || response.data.data || [];
        // Map từ backend format sang frontend format
        const mappedAddresses = addressesList.map(mapBackendToFrontend);
        setAddresses(mappedAddresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload khi screen được focus (khi quay lại từ AddAddressScreen)
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );


  const handleDelete = (addressId: string) => {
    Alert.alert('Xóa địa chỉ', 'Bạn có chắc chắn muốn xóa địa chỉ này?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await deleteAddress(addressId);
            if (response.success) {
              await loadAddresses();
            }
          } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa địa chỉ');
          }
        },
      },
    ]);
  };

  if (isLoading) {
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
      {/* Header */}
      <View className="bg-orange-500 px-4 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">Địa chỉ giao hàng</Text>
        <TouchableOpacity
          onPress={() => {
            (navigation as any).navigate(MainRoutes.AddAddress);
          }}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="location-outline" size={80} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg font-semibold mt-4">
            Chưa có địa chỉ nào
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            Thêm địa chỉ để nhận hàng nhanh chóng
          </Text>
          <TouchableOpacity
            onPress={() => {
              (navigation as any).navigate(MainRoutes.AddAddress);
            }}
            className="bg-orange-500 rounded-xl px-6 py-3 mt-6">
            <Text className="text-white font-semibold">Thêm địa chỉ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
            {addresses.map((address) => (
              <View
                key={address.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-gray-800 font-bold text-base">
                        {address.name}
                      </Text>
                      {address.isDefault && (
                        <View className="bg-orange-500 px-2 py-0.5 rounded-full ml-2">
                          <Text className="text-white text-xs font-bold">Mặc định</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-600 text-sm">{address.phone}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(address.id)}
                    className="ml-2">
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-600 text-sm leading-5">
                  {address.address}, {address.ward}, {address.district}, {address.city}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    (navigation as any).navigate(MainRoutes.EditAddress, {
                      addressId: address.id,
                    });
                  }}
                  className="mt-3 pt-3 border-t border-gray-100">
                  <Text className="text-orange-500 font-semibold text-center">
                    Chỉnh sửa
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default AddressListScreen;

