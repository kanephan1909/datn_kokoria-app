import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrderById} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';

// Import MapView nếu có, nếu không thì dùng placeholder
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
try {
  const reactNativeMaps = require('react-native-maps');
  MapView = reactNativeMaps.default || reactNativeMaps;
  Marker = reactNativeMaps.Marker;
  Polyline = reactNativeMaps.Polyline;
} catch (error) {
  console.log('react-native-maps not installed, using placeholder');
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
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
}

// Default location (Ho Chi Minh City)
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

  // Destination location
  const [destinationLocation, setDestinationLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setOrder(response.data);

        // Set destination location
        const destLat = response.data.address?.latitude || defaultLocation.latitude + 0.01;
        const destLng = response.data.address?.longitude || defaultLocation.longitude + 0.01;
        setDestinationLocation({
          latitude: destLat,
          longitude: destLng,
        });

        // Set initial driver location (slightly offset from destination)
        setDriverLocation({
          latitude: destLat - 0.005,
          longitude: destLng - 0.003,
        });
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
  }, [orderId, navigation]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Simulate driver location updates
  useEffect(() => {
    if (!driverLocation || !destinationLocation) {
      return;
    }

    const interval = setInterval(() => {
      setDriverLocation(prev => {
        if (!prev) {
          return prev;
        }
        // Move slightly towards destination
        const deltaLat = (destinationLocation.latitude - prev.latitude) * 0.05;
        const deltaLng = (destinationLocation.longitude - prev.longitude) * 0.05;
        return {
          latitude: prev.latitude + deltaLat,
          longitude: prev.longitude + deltaLng,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [driverLocation, destinationLocation]);

  // Calculate route coordinates for polyline
  const getRouteCoordinates = () => {
    if (!driverLocation || !destinationLocation) {
      return [];
    }
    return [
      driverLocation,
      {
        latitude: (driverLocation.latitude + destinationLocation.latitude) / 2,
        longitude: (driverLocation.longitude + destinationLocation.longitude) / 2 + 0.002,
      },
      destinationLocation,
    ];
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      </View>
    );
  }

  if (!order || !driverLocation || !destinationLocation) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Map Container - Full Screen */}
      <View style={styles.mapContainer}>
        {MapView ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (driverLocation.latitude + destinationLocation.latitude) / 2,
              longitude: (driverLocation.longitude + destinationLocation.longitude) / 2,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}>
            {/* Route Polyline */}
            <Polyline
              coordinates={getRouteCoordinates()}
              strokeColor="#FF6B35"
              strokeWidth={4}
            />

            {/* Driver Marker */}
            <Marker
              coordinate={driverLocation}
              anchor={{x: 0.5, y: 0.5}}>
              <View style={styles.driverMarker}>
                <Text style={styles.driverMarkerText}>🛵</Text>
                <Text style={styles.driverTime}>9:41</Text>
              </View>
            </Marker>

            {/* Destination Marker */}
            <Marker coordinate={destinationLocation}>
              <View style={styles.destinationMarker}>
                <Ionicons name="location" size={32} color="#FF6B35" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#9CA3AF" />
            <Text style={styles.mapPlaceholderText}>Bản đồ đang được tải...</Text>
          </View>
        )}
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topButton}>
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topButton}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Heading your way</Text>
        </View>

        {/* Arrival Info */}
        <Text style={styles.arrivalText}>Arriving now</Text>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Ionicons name="restaurant" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.progressLine} />
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Ionicons name="bicycle" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.progressLine} />
            <View style={[styles.progressStep, styles.progressStepActive]}>
              <Ionicons name="home" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.progressLine, styles.progressLineInactive]} />
            <View style={[styles.progressStep, styles.progressStepInactive]}>
              <Ionicons name="checkmark" size={16} color="#9CA3AF" />
            </View>
          </View>
          <Text style={styles.progressMessage}>
            Give Khang a moment to drop off your order.
          </Text>
        </View>

        {/* Deliverer Info */}
        <View style={styles.delivererContainer}>
          <View style={styles.delivererInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>NK</Text>
            </View>
            <View style={styles.delivererTextContainer}>
              <Text style={styles.delivererTitle}>Deliverer</Text>
              <Text style={styles.delivererName}>Nhat Khang</Text>
            </View>
          </View>
          <View style={styles.delivererActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Details Button */}
        <TouchableOpacity
          style={styles.orderDetailsButton}
          onPress={() => {
            (navigation as any).navigate(MainRoutes.OrderDetails, {orderId});
          }}>
          <Text style={styles.orderDetailsButtonText}>Order Details</Text>
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
    fontSize: 14,
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
