import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrderById, fetchRestaurants} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import MapView, {Marker, Polyline} from 'react-native-maps';
import {useDirections} from '../hooks/useDirections';
import {useGeocoding} from '../hooks/useGeocoding';
import {useSocket} from '../hooks/useSocket';
import {RESTAURANT_ADDRESS, DEFAULT_RESTAURANT_LOCATION} from '../constants/restaurant';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  driverId?: string;
  address?: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
}

// Vị trí mặc định (Thành phố Hồ Chí Minh)
const defaultLocation = {
  latitude: 10.762622,
  longitude: 106.660172,
};

const LiveTrackingMapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {orderId} = route.params as {orderId: string};
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Vị trí đích đến (địa chỉ giao hàng)
  const [destinationLocation, setDestinationLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Vị trí quán (restaurant)
  const [restaurantLocation, setRestaurantLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Hooks
  const {calculateRoute, route: calculatedRoute, isCalculating} = useDirections();
  const {geocodeAddress} = useGeocoding();

  // Socket để nhận vị trí shipper real-time và cập nhật trạng thái đơn hàng
  useSocket({
    autoConnect: true,
    events: {
      'driver:locationUpdate': (data: {
        orderId: string;
        latitude: number;
        longitude: number;
        timestamp: string;
      }) => {
        // Chỉ cập nhật nếu là đơn hàng hiện tại
        if (data.orderId === orderId) {
          setDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      },
      'order:statusUpdate': (data: {
        orderId: string;
        status: string;
        order?: Order;
      }) => {
        // Kiểm tra nếu là đơn hàng hiện tại và status = COMPLETED
        if (data.orderId === orderId && data.status === 'COMPLETED') {
          // Cập nhật order state
          if (data.order) {
            setOrder(data.order);
          }
          // Điều hướng đến màn hình OrderDelivered sau 2 giây
          setTimeout(() => {
            (navigation as any).navigate(MainRoutes.OrderDelivered, {
              orderId: orderId,
            });
          }, 2000);
        } else if (data.orderId === orderId && data.order) {
          // Cập nhật order state cho các status khác
          setOrder(data.order);
        }
      },
    },
  });

  // Lấy vị trí quán từ API hoặc geocode địa chỉ
  const loadRestaurantLocation = useCallback(async () => {
    try {
      // Thử lấy từ API trước
      const restaurantsResponse = await fetchRestaurants();
      if (
        restaurantsResponse.success &&
        restaurantsResponse.data?.restaurants &&
        restaurantsResponse.data.restaurants.length > 0
      ) {
        const restaurant = restaurantsResponse.data.restaurants[0];
        if (restaurant.latitude && restaurant.longitude) {
          setRestaurantLocation({
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          });
          return {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          };
        }
      }
    } catch (error) {
      console.warn('Error fetching restaurant from API:', error);
    }

    // Nếu không lấy được từ API, geocode địa chỉ quán
    try {
      const location = await geocodeAddress(RESTAURANT_ADDRESS);
      if (location) {
        setRestaurantLocation(location);
        return location;
      }
    } catch (error) {
      console.warn('Error geocoding restaurant address:', error);
    }

    // Fallback: sử dụng tọa độ mặc định
    setRestaurantLocation(DEFAULT_RESTAURANT_LOCATION);
    return DEFAULT_RESTAURANT_LOCATION;
  }, [geocodeAddress]);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load đơn hàng và địa chỉ quán song song
      const [orderResponse, restaurantLoc] = await Promise.all([
        fetchOrderById(orderId),
        loadRestaurantLocation(),
      ]);

      if (orderResponse.success && orderResponse.data) {
        setOrder(orderResponse.data as Order);

        // Thiết lập vị trí đích đến (địa chỉ giao hàng)
        let destLat: number;
        let destLng: number;

        if (
          orderResponse.data.address?.latitude &&
          orderResponse.data.address?.longitude
        ) {
          // Sử dụng tọa độ từ database
          destLat = orderResponse.data.address.latitude;
          destLng = orderResponse.data.address.longitude;
        } else if (orderResponse.data.address) {
          // Geocode địa chỉ nếu không có tọa độ
          const addressString = [
            orderResponse.data.address.address,
            orderResponse.data.address.ward,
            orderResponse.data.address.district,
            orderResponse.data.address.city,
          ]
            .filter(Boolean)
            .join(', ');

          if (addressString) {
            const location = await geocodeAddress(addressString);
            if (location) {
              destLat = location.latitude;
              destLng = location.longitude;
            } else {
              destLat = defaultLocation.latitude + 0.01;
              destLng = defaultLocation.longitude + 0.01;
            }
          } else {
            destLat = defaultLocation.latitude + 0.01;
            destLng = defaultLocation.longitude + 0.01;
          }
        } else {
          destLat = defaultLocation.latitude + 0.01;
          destLng = defaultLocation.longitude + 0.01;
        }

        setDestinationLocation({
          latitude: destLat,
          longitude: destLng,
        });

        // Thiết lập vị trí ban đầu của driver (bắt đầu từ quán)
        if (restaurantLoc) {
          setDriverLocation({
            latitude: restaurantLoc.latitude,
            longitude: restaurantLoc.longitude,
          });
        } else {
          // Fallback: lệch một chút so với đích đến
          setDriverLocation({
            latitude: destLat - 0.005,
            longitude: destLng - 0.003,
          });
        }
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy đơn hàng');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigation, loadRestaurantLocation, geocodeAddress]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Kiểm tra order status khi order được load hoặc cập nhật
  useEffect(() => {
    if (order?.status === 'COMPLETED') {
      // Điều hướng đến màn hình OrderDelivered sau 2 giây
      const timer = setTimeout(() => {
        (navigation as any).navigate(MainRoutes.OrderDelivered, {
          orderId: orderId,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, orderId, navigation]);

  // Tính toán route từ quán đến địa chỉ giao hàng (chỉ khi chưa có driver location)
  useEffect(() => {
    if (restaurantLocation && destinationLocation && !driverLocation) {
      calculateRoute(restaurantLocation, destinationLocation);
    }
  }, [restaurantLocation, destinationLocation, driverLocation, calculateRoute]);

  // Tính toán route từ driver đến destination khi có driver location
  useEffect(() => {
    if (driverLocation && destinationLocation) {
      calculateRoute(driverLocation, destinationLocation);
    }
  }, [driverLocation, destinationLocation, calculateRoute]);

  // Sử dụng dữ liệu từ Directions API thay vì Distance Matrix API
  // Directions API đã trả về distance và duration, không cần gọi Distance Matrix API riêng
  const distanceAndTime = useMemo(() => {
    if (calculatedRoute && calculatedRoute.distance !== 'N/A' && calculatedRoute.duration !== 'N/A') {
      return {
        distance: calculatedRoute.distance,
        duration: calculatedRoute.duration,
      };
    }
    return null;
  }, [calculatedRoute]);

  // Debug log
  useEffect(() => {
    if (driverLocation && destinationLocation) {
      console.log('📍 Driver location:', driverLocation);
      console.log('📍 Destination location:', destinationLocation);
      console.log('📊 Route distance & time:', distanceAndTime);
    }
  }, [driverLocation, destinationLocation, distanceAndTime]);

  // Mô phỏng cập nhật vị trí driver (di chuyển theo route)
  // CHỈ chạy khi không có vị trí shipper thực tế từ socket
  useEffect(() => {
    // Nếu route chỉ có 2 điểm (đường thẳng), không mô phỏng
    if (!driverLocation || !destinationLocation || !calculatedRoute) {
      return;
    }

    const routeCoords = calculatedRoute.coordinates;
    // Nếu route chỉ có 2 điểm (origin, destination), không mô phỏng di chuyển
    if (routeCoords.length <= 2) {
      console.log('⚠️ Route chỉ có 2 điểm, không mô phỏng di chuyển');
      return;
    }

    let currentRouteIndex = 0;

    const interval = setInterval(() => {
      setDriverLocation(prev => {
        if (!prev) {
          return prev;
        }

        // Tìm điểm gần nhất trên route
        let minDistance = Infinity;
        let nearestIndex = currentRouteIndex;

        for (let i = currentRouteIndex; i < routeCoords.length; i++) {
          const coord = routeCoords[i];
          const distance =
            Math.abs(coord.latitude - prev.latitude) +
            Math.abs(coord.longitude - prev.longitude);

          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = i;
          }
        }

        currentRouteIndex = nearestIndex;

        // Di chuyển đến điểm tiếp theo trên route
        if (currentRouteIndex < routeCoords.length - 1) {
          const nextCoord = routeCoords[currentRouteIndex + 1];
          const deltaLat = (nextCoord.latitude - prev.latitude) * 0.1;
          const deltaLng = (nextCoord.longitude - prev.longitude) * 0.1;

          // Kiểm tra xem đã đến gần đích chưa
          const distanceToDest =
            Math.abs(destinationLocation.latitude - prev.latitude) +
            Math.abs(destinationLocation.longitude - prev.longitude);

          if (distanceToDest < 0.0001) {
            // Đã đến đích
            return prev;
          }

          return {
            latitude: prev.latitude + deltaLat,
            longitude: prev.longitude + deltaLng,
          };
        } else {
          // Đã đến cuối route
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [driverLocation, destinationLocation, calculatedRoute]);

  // Lấy tọa độ tuyến đường cho polyline
  const getRouteCoordinates = () => {
    if (calculatedRoute && calculatedRoute.coordinates.length > 2) {
      // Chỉ sử dụng route nếu có nhiều hơn 2 điểm (có route thực tế)
      console.log(`✅ Using route with ${calculatedRoute.coordinates.length} points`);
      return calculatedRoute.coordinates;
    }

    // Nếu route chỉ có 2 điểm hoặc không có route, không vẽ đường thẳng
    // (để tránh hiển thị đường xuyên tường)
    if (calculatedRoute && calculatedRoute.coordinates.length === 2) {
      console.warn('⚠️ Route chỉ có 2 điểm, không vẽ polyline để tránh đường thẳng');
      return [];
    }

    return [];
  };

  if (isLoading || isCalculating) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>
            {isCalculating ? 'Đang tính toán đường đi...' : 'Đang tải bản đồ...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!order || !driverLocation || !destinationLocation) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Container bản đồ - Toàn màn hình */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (driverLocation.latitude + destinationLocation.latitude) / 2,
            longitude: (driverLocation.longitude + destinationLocation.longitude) / 2,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}>
          {/* Tuyến đường Polyline */}
          {getRouteCoordinates().length > 0 && (
            <Polyline
              coordinates={getRouteCoordinates()}
              strokeColor="#FF6B35"
              strokeWidth={4}
            />
          )}

          {/* Marker Quán (Restaurant) */}
          {restaurantLocation && (
            <Marker coordinate={restaurantLocation}>
              <View style={styles.restaurantMarker}>
                <Ionicons name="restaurant" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Marker Driver */}
          <Marker
            coordinate={driverLocation}
            anchor={{x: 0.5, y: 0.5}}>
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerText}>🛵</Text>
              {distanceAndTime && (
                <Text style={styles.driverTime}>{distanceAndTime.duration}</Text>
              )}
            </View>
          </Marker>

          {/* Marker Đích đến */}
          <Marker coordinate={destinationLocation}>
            <View style={styles.destinationMarker}>
              <Ionicons name="location" size={32} color="#FF6B35" />
            </View>
          </Marker>
        </MapView>
      </View>

      {/* Điều khiển phía trên */}
      <View style={styles.topControls}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topButton}>
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topButton}>
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Card phía dưới */}
      <View style={styles.bottomCard}>
        {/* Header trạng thái */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Đang trên đường đến bạn</Text>
        </View>

        {/* Thông tin đến nơi */}
        <Text style={styles.arrivalText}>
          {distanceAndTime
            ? `Khoảng cách: ${distanceAndTime.distance} • Thời gian: ${distanceAndTime.duration}`
            : isCalculating
            ? 'Đang tính toán...'
            : 'Đang tải thông tin...'}
        </Text>

        {/* Các bước tiến trình */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {/* Bước 1: Nhà hàng */}
            <View
              style={[
                styles.progressStep,
                ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING', 'COMPLETED'].includes(
                  order?.status || '',
                )
                  ? styles.progressStepCompleted
                  : styles.progressStepInactive,
              ]}>
              <Ionicons name="restaurant" size={16} color="#FFFFFF" />
            </View>
            <View
              style={[
                styles.progressLine,
                ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING', 'COMPLETED'].includes(
                  order?.status || '',
                )
                  ? {}
                  : styles.progressLineInactive,
              ]}
            />
            {/* Bước 2: Shipper đang giao */}
            <View
              style={[
                styles.progressStep,
                ['PICKED_UP', 'DELIVERING', 'COMPLETED'].includes(order?.status || '')
                  ? styles.progressStepCompleted
                  : ['READY_FOR_PICKUP'].includes(order?.status || '')
                  ? styles.progressStepActive
                  : styles.progressStepInactive,
              ]}>
              <Ionicons name="bicycle" size={16} color="#FFFFFF" />
            </View>
            <View
              style={[
                styles.progressLine,
                ['DELIVERING', 'COMPLETED'].includes(order?.status || '')
                  ? {}
                  : styles.progressLineInactive,
              ]}
            />
            {/* Bước 3: Đang đến */}
            <View
              style={[
                styles.progressStep,
                ['DELIVERING'].includes(order?.status || '')
                  ? styles.progressStepActive
                  : ['COMPLETED'].includes(order?.status || '')
                  ? styles.progressStepCompleted
                  : styles.progressStepInactive,
              ]}>
              <Ionicons name="home" size={16} color="#FFFFFF" />
            </View>
            <View
              style={[
                styles.progressLine,
                ['COMPLETED'].includes(order?.status || '') ? {} : styles.progressLineInactive,
              ]}
            />
            {/* Bước 4: Hoàn thành */}
            <View
              style={[
                styles.progressStep,
                ['COMPLETED'].includes(order?.status || '')
                  ? styles.progressStepCompleted
                  : styles.progressStepInactive,
              ]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.progressMessage}>
            {order?.status === 'DELIVERING'
              ? 'Shipper đang trên đường đến bạn.'
              : order?.status === 'PICKED_UP'
              ? 'Shipper đã lấy hàng và đang chuẩn bị giao.'
              : order?.status === 'COMPLETED'
              ? 'Đơn hàng đã được giao thành công!'
              : 'Vui lòng đợi shipper giao hàng cho bạn.'}
          </Text>
        </View>

        {/* Thông tin người giao hàng */}
        <View style={styles.delivererContainer}>
          <View style={styles.delivererInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {order?.driver?.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'NK'}
              </Text>
            </View>
            <View style={styles.delivererTextContainer}>
              <Text style={styles.delivererTitle}>Người giao hàng</Text>
              <Text style={styles.delivererName}>
                {order?.driver?.name || 'Nhat Khang'}
              </Text>
            </View>
          </View>
          <View style={styles.delivererActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                (navigation as any).navigate(MainRoutes.Chat, {
                  orderId: orderId,
                  recipientName: order?.driver?.name,
                  recipientId: order?.driverId,
                });
              }}>
              <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút chi tiết đơn hàng */}
        <TouchableOpacity
          style={styles.orderDetailsButton}
          onPress={() => {
            (navigation as any).navigate(MainRoutes.OrderDetails, {orderId});
          }}>
          <Text style={styles.orderDetailsButtonText}>Chi tiết đơn hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  driverMarker: {
    alignItems: 'center',
  },
  driverMarkerText: {
    fontSize: 32,
  },
  driverTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  restaurantMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusHeader: {
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  arrivalText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepCompleted: {
    backgroundColor: '#FF6B35',
  },
  progressStepActive: {
    backgroundColor: '#FF6B35',
  },
  progressStepInactive: {
    backgroundColor: '#E5E7EB',
  },
  progressLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#FF6B35',
    marginHorizontal: 4,
  },
  progressLineInactive: {
    backgroundColor: '#E5E7EB',
  },
  progressMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  delivererContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  delivererInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  delivererTextContainer: {
    justifyContent: 'center',
  },
  delivererTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  delivererName: {
    fontSize: 14,
    color: '#6B7280',
  },
  delivererActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetailsButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  orderDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LiveTrackingMapScreen;
