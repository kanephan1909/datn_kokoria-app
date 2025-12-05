import {useEffect, useRef, useState} from 'react';
import * as Location from 'expo-location';
import {updateDriverLocation} from '../api/apiClient';
import {useSocketContext} from '../context/SocketContext';

interface UseDriverLocationOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  orderId?: string; // Chỉ cập nhật khi đang giao đơn hàng này
}

export const useDriverLocation = (options: UseDriverLocationOptions = {}) => {
  const {enabled = false, interval = 5000, orderId} = options;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const {emit, isConnected} = useSocketContext();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const requestPermission = async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Quyền truy cập vị trí bị từ chối');
          return false;
        }
        return true;
      } catch (err) {
        setError('Không thể yêu cầu quyền truy cập vị trí');
        return false;
      }
    };

    const updateLocation = async () => {
      try {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation(currentLocation);

        // Cập nhật lên server
        setIsUpdating(true);
        try {
          await updateDriverLocation(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
          );

          // Emit qua socket để real-time update cho customer
          if (isConnected && orderId) {
            emit('driver:locationUpdate', {
              orderId,
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error updating driver location:', err);
        } finally {
          setIsUpdating(false);
        }
      } catch (err: any) {
        console.error('Error getting location:', err);
        setError(err.message || 'Không thể lấy vị trí');
      }
    };

    // Cập nhật ngay lập tức
    updateLocation();

    // Sau đó cập nhật định kỳ
    intervalRef.current = setInterval(updateLocation, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, orderId, emit, isConnected]);

  return {
    location,
    error,
    isUpdating,
  };
};
