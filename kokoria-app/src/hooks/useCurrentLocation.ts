import {useCallback, useState, useRef} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

interface Location {
  latitude: number;
  longitude: number;
}

export const useCurrentLocation = (
  onLocationUpdate: (location: Location) => void,
) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const isGettingLocationRef = useRef(false);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Quyền truy cập vị trí',
            message:
              'Ứng dụng cần quyền truy cập vị trí để lấy vị trí hiện tại của bạn',
            buttonNeutral: 'Để sau',
            buttonNegative: 'Từ chối',
            buttonPositive: 'Đồng ý',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Quyền truy cập',
        'Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này',
      );
      return;
    }

    setIsGettingLocation(true);
    isGettingLocationRef.current = true;

    try {
      Geolocation.getCurrentPosition(
        async (position: any) => {
          const {latitude, longitude} = position.coords;
          const newLocation = {latitude, longitude};
          onLocationUpdate(newLocation);
          setIsGettingLocation(false);
          isGettingLocationRef.current = false;
        },
        (error: any) => {
          console.error('Location error:', error);
          setIsGettingLocation(false);
          isGettingLocationRef.current = false;

          let errorMessage = 'Không thể lấy vị trí hiện tại.';
          if (error.code === 1) {
            errorMessage =
              'Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt.';
          } else if (error.code === 2) {
            errorMessage =
              'Không thể xác định vị trí. Vui lòng kiểm tra kết nối GPS.';
          } else if (error.code === 3) {
            errorMessage = 'Hết thời gian chờ lấy vị trí. Vui lòng thử lại.';
          }

          Alert.alert('Lỗi', errorMessage, [
            {
              text: 'OK',
              style: 'default',
            },
            {
              text: 'Chọn trên bản đồ',
              onPress: () => {
                // Người dùng có thể chọn vị trí trên bản đồ
              },
            },
          ]);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error: any) {
      console.error('Get location error:', error);
      Alert.alert(
        'Lỗi',
        'Không thể lấy vị trí hiện tại. Vui lòng chọn vị trí trên bản đồ hoặc sử dụng thanh tìm kiếm.',
      );
      setIsGettingLocation(false);
      isGettingLocationRef.current = false;
    }
  }, [requestLocationPermission, onLocationUpdate]);

  return {
    getCurrentLocation,
    isGettingLocation,
    isGettingLocationRef,
  };
};
