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
  StatusBar,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchAddressById, updateAddress} from '../../api/apiClient';
import {useCurrentLocation} from '../hooks/useCurrentLocation';
import {useGeocoding} from '../hooks/useGeocoding';
import {MainRoutes} from '../navigation/Routes';
import {GOOGLE_MAPS_API_KEY} from '../config/env';

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
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

  // Hooks cho location
  const {isGeocoding, geocodeAddress} = useGeocoding();

  // Hàm parse địa chỉ từ Google Maps API response
  const parseAddressComponents = useCallback(
    (addressComponents: any[]): {
      streetNumber: string;
      route: string;
      ward: string;
      district: string;
      city: string;
    } => {
      let streetNumber = '';
      let routeName = '';
      let wardName = '';
      let districtName = '';
      let cityName = '';

      addressComponents.forEach((component: any) => {
        const types = component.types || [];

        if (types.includes('street_number')) {
          streetNumber = component.long_name || '';
        }
        if (types.includes('route')) {
          routeName = component.long_name || '';
        }
        if (
          types.includes('sublocality_level_1') ||
          types.includes('sublocality') ||
          types.includes('ward')
        ) {
          wardName = component.long_name || '';
        }
        if (
          types.includes('administrative_area_level_2') ||
          types.includes('district')
        ) {
          districtName = component.long_name || '';
        }
        if (
          types.includes('administrative_area_level_1') ||
          types.includes('locality')
        ) {
          cityName = component.long_name || '';
        }
      });

      return {
        streetNumber,
        route: routeName,
        ward: wardName,
        district: districtName,
        city: cityName,
      };
    },
    [],
  );

  // Xử lý khi location được cập nhật
  const handleLocationUpdate = useCallback(
    async (location: {latitude: number; longitude: number}) => {
      setLatitude(location.latitude);
      setLongitude(location.longitude);

      try {
        // Reverse geocode để lấy địa chỉ đầy đủ
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const components = parseAddressComponents(result.address_components);

          // Điền các trường địa chỉ
          if (components.streetNumber || components.route) {
            setAddress(
              [components.streetNumber, components.route]
                .filter(Boolean)
                .join(' '),
            );
          }
          if (components.ward) {
            setWard(components.ward);
          }
          if (components.district) {
            setDistrict(components.district);
          }
          if (components.city) {
            setCity(components.city);
          }

          Alert.alert('Thành công', 'Đã xác định vị trí và điền địa chỉ');
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin địa chỉ từ vị trí này');
        }
      } catch (error) {
        console.error('Error parsing address:', error);
        Alert.alert('Lỗi', 'Không thể xử lý địa chỉ');
      }
    },
    [parseAddressComponents],
  );

  const {getCurrentLocation, isGettingLocation} = useCurrentLocation(
    handleLocationUpdate,
  );

  const loadAddress = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetchAddressById(addressId);
      if (response.success && response.data) {
        const addr = response.data;
        
        // Map từ backend format sang frontend format
        // Backend trả về: mobile, street, locality
        // Frontend cần: phone, address, ward, district, city
        const localityParts = addr.locality
          ? addr.locality.split(',').map((s: string) => s.trim())
          : [];

        setName(addr.name || '');
        setPhone(addr.mobile || addr.phone || '');
        setAddress(addr.street || addr.address || '');
        setWard(addr.ward || localityParts[0] || '');
        setDistrict(addr.district || localityParts[1] || '');
        setCity(addr.city || (localityParts[2] || localityParts.slice(2).join(', ') || ''));
        setIsDefault(addr.isDefault || false);
        setLatitude(addr.latitude);
        setLongitude(addr.longitude);

        // Nếu có địa chỉ nhưng chưa có tọa độ, geocode để lấy tọa độ
        const mappedAddress = addr.street || addr.address || '';
        const mappedWard = addr.ward || localityParts[0] || '';
        const mappedDistrict = addr.district || localityParts[1] || '';
        const mappedCity = addr.city || (localityParts[2] || localityParts.slice(2).join(', ') || '');

        if (
          (!addr.latitude || !addr.longitude) &&
          (mappedAddress || mappedWard || mappedDistrict || mappedCity)
        ) {
          const addressString = [
            mappedAddress,
            mappedWard,
            mappedDistrict,
            mappedCity,
          ]
            .filter(Boolean)
            .join(', ');

          if (addressString) {
            try {
              const location = await geocodeAddress(addressString);
              if (location) {
                setLatitude(location.latitude);
                setLongitude(location.longitude);
              }
            } catch (error) {
              console.error('Error geocoding address:', error);
              // Không hiển thị lỗi, chỉ log
            }
          }
        }
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
  }, [addressId, navigation, geocodeAddress]);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  // Lắng nghe khi quay lại từ EditLocationScreen
  useFocusEffect(
    useCallback(() => {
      const routeParams = (route.params as any) || {};
      if (routeParams.selectedLocation) {
        const {latitude: selectedLat, longitude: selectedLng} =
          routeParams.selectedLocation;
        handleLocationUpdate({latitude: selectedLat, longitude: selectedLng});
        // Xóa selectedLocation để tránh xử lý lại
        (route.params as any).selectedLocation = undefined;
      }
    }, [route.params, handleLocationUpdate]),
  );

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !ward.trim() || !district.trim() || !city.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      // Chỉ gửi latitude và longitude nếu chúng có giá trị hợp lệ
      const updateData: any = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
        isDefault,
      };

      // Chỉ thêm latitude và longitude nếu chúng không phải null/undefined
      if (latitude != null && longitude != null) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
      }

      const response = await updateAddress(addressId, updateData);
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
      <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header */}
        <View className="bg-orange-500 px-4 py-4 flex-row items-center" style={{paddingTop: statusBarHeight + 16}}>
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

              {/* Location Buttons */}
              <View className="mt-4 space-y-2">
                <TouchableOpacity
                  onPress={getCurrentLocation}
                  disabled={isGettingLocation || isGeocoding}
                  className={`flex-row items-center justify-center bg-blue-50 rounded-lg px-4 py-3 border ${
                    isGettingLocation || isGeocoding
                      ? 'border-gray-300 opacity-50'
                      : 'border-blue-200'
                  }`}>
                  {isGettingLocation || isGeocoding ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Ionicons name="locate" size={20} color="#3B82F6" />
                  )}
                  <Text
                    className={`ml-2 font-semibold ${
                      isGettingLocation || isGeocoding
                        ? 'text-gray-400'
                        : 'text-blue-600'
                    }`}>
                    {isGettingLocation || isGeocoding
                      ? 'Đang xác định vị trí...'
                      : 'Xác định vị trí hiện tại'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Tạo địa chỉ đầy đủ từ các trường
                    const fullAddress = [address, ward, district, city]
                      .filter(Boolean)
                      .join(', ');

                    console.log('Navigating to EditLocation with:', {
                      hasCoordinates: !!(latitude && longitude),
                      latitude,
                      longitude,
                      address: fullAddress,
                    });

                    (navigation as any).navigate(MainRoutes.EditLocation, {
                      // Nếu có tọa độ, truyền cả tọa độ và địa chỉ
                      // Nếu không có tọa độ, chỉ truyền địa chỉ để geocode
                      initialLocation:
                        latitude && longitude
                          ? {latitude, longitude}
                          : undefined,
                      address: fullAddress || undefined,
                      returnTo: 'EditAddress',
                      addressId: addressId,
                    });
                  }}
                  className="flex-row items-center justify-center bg-green-50 rounded-lg px-4 py-3 border border-green-200">
                  <Ionicons name="map" size={20} color="#10B981" />
                  <Text className="ml-2 font-semibold text-green-600">
                    Chọn trên bản đồ
                  </Text>
                </TouchableOpacity>

                {latitude && longitude && (
                  <View className="bg-gray-50 rounded-lg px-4 py-2 mt-2">
                    <Text className="text-xs text-gray-500">
                      Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </View>

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

