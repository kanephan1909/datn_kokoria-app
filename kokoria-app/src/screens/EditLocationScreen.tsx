import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  PermissionsAndroid,
  FlatList,
} from 'react-native';
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
// Import Geolocation với fallback
let Geolocation: any = null;
try {
  Geolocation = require('@react-native-community/geolocation');
} catch (error) {
  console.log('Geolocation package not available');
}
import {GOOGLE_MAPS_API_KEY} from '../config/env';
import {MainRoutes} from '../navigation/Routes';

// Import MapView nếu có
let MapView: any = null;
let Marker: any = null;
try {
  const reactNativeMaps = require('react-native-maps');
  MapView = reactNativeMaps.default || reactNativeMaps;
  Marker = reactNativeMaps.Marker;
} catch (error) {
  console.log('react-native-maps not installed, using placeholder');
}

// Default location (Ho Chi Minh City)
const defaultLocation = {
  latitude: 10.762622,
  longitude: 106.660172,
};

interface RouteParams {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

const EditLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};

  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(params.initialLocation || defaultLocation);

  const [currentAddress, setCurrentAddress] = useState<string>(
    params.address || '',
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapViewRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGettingLocationRef = useRef(false);

  // Reverse geocode: chuyển tọa độ thành địa chỉ
  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        setIsGeocoding(true);
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          setCurrentAddress(result.formatted_address);
          return result.formatted_address;
        } else {
          setCurrentAddress('Không thể xác định địa chỉ');
          return null;
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setCurrentAddress('Không thể xác định địa chỉ');
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [],
  );

  // Google Places Autocomplete
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query,
      )}&key=${GOOGLE_MAPS_API_KEY}&language=vi&components=country:vn`;

      const response = await fetch(placesUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setSearchResults(data.predictions);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Places search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, []);

  // Geocode: chuyển địa chỉ thành tọa độ
  const geocodeAddress = useCallback(async (address: string) => {
    try {
      setIsSearching(true);
      setShowSearchResults(false);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address + ', Vietnam',
      )}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const newLocation = {
          latitude: location.lat,
          longitude: location.lng,
        };
        setMapLocation(newLocation);
        setCurrentAddress(data.results[0].formatted_address);

        // Animate map đến vị trí mới
        if (mapViewRef.current) {
          mapViewRef.current.animateToRegion(
            {
              ...newLocation,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
        }
        return newLocation;
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy địa chỉ');
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm địa chỉ');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Lấy địa chỉ chi tiết từ place_id
  const getPlaceDetails = useCallback(async (placeId: string) => {
    try {
      setIsSearching(true);
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=vi&fields=geometry,formatted_address`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const location = data.result.geometry.location;
        const newLocation = {
          latitude: location.lat,
          longitude: location.lng,
        };
        setMapLocation(newLocation);
        setCurrentAddress(data.result.formatted_address);
        setSearchQuery('');
        setShowSearchResults(false);

        // Animate map đến vị trí mới
        if (mapViewRef.current) {
          mapViewRef.current.animateToRegion(
            {
              ...newLocation,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin địa chỉ');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Lấy vị trí hiện tại của người dùng
  const requestLocationPermission = async (): Promise<boolean> => {
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
  };

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
      if (!Geolocation) {
        // Fallback: Sử dụng MapView với showsUserLocation
        Alert.alert(
          'Thông báo',
          'Tính năng lấy vị trí hiện tại đang được cập nhật. Vui lòng:\n\n1. Chạm vào bản đồ để chọn vị trí\n2. Sử dụng thanh tìm kiếm để tìm địa chỉ\n3. Rebuild app để sử dụng tính năng GPS',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsGettingLocation(false);
                isGettingLocationRef.current = false;
              },
            },
          ],
        );
        return;
      }

      Geolocation.getCurrentPosition(
        async (position: any) => {
          const {latitude, longitude} = position.coords;
          const newLocation = {latitude, longitude};
          setMapLocation(newLocation);

          // Animate map đến vị trí hiện tại
          if (mapViewRef.current) {
            mapViewRef.current.animateToRegion(
              {
                ...newLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500,
            );
          }

          // Reverse geocode để lấy địa chỉ
          await reverseGeocode(latitude, longitude);
          setIsGettingLocation(false);
          isGettingLocationRef.current = false;
        },
        (error: any) => {
          console.error('Location error:', error);
          setIsGettingLocation(false);
          isGettingLocationRef.current = false;

          let errorMessage = 'Không thể lấy vị trí hiện tại.';
          if (error.code === 1) {
            errorMessage = 'Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt.';
          } else if (error.code === 2) {
            errorMessage = 'Không thể xác định vị trí. Vui lòng kiểm tra kết nối GPS.';
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
  }, [reverseGeocode]);

  // Load địa chỉ ban đầu
  useEffect(() => {
    if (params.initialLocation) {
      reverseGeocode(
        params.initialLocation.latitude,
        params.initialLocation.longitude,
      );
    } else {
      reverseGeocode(defaultLocation.latitude, defaultLocation.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Xử lý khi map được nhấn
  const handleMapPress = (event: any) => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    setMapLocation({latitude, longitude});
    reverseGeocode(latitude, longitude);
  };

  // Xử lý khi marker được kéo
  const handleMarkerDragEnd = (event: any) => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    setMapLocation({latitude, longitude});
    reverseGeocode(latitude, longitude);
  };

  // Xử lý tìm kiếm với debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  // Xử lý khi chọn kết quả tìm kiếm
  const handleSelectSearchResult = (place: any) => {
    getPlaceDetails(place.place_id);
  };

  // Xử lý tìm kiếm khi nhấn nút search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      geocodeAddress(searchQuery.trim());
      setShowSearchResults(false);
    }
  };

  // Xác nhận vị trí
  const handleConfirm = () => {
    // Truyền dữ liệu về màn hình trước qua navigation params
    // Sử dụng navigate với merge để giữ nguyên các params khác
    (navigation as any).navigate({
      name: MainRoutes.Checkout2,
      params: {
        selectedLocation: {
          latitude: mapLocation.latitude,
          longitude: mapLocation.longitude,
          address: currentAddress,
        },
      },
      merge: true,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}>
          <View style={styles.headerButtonCircle}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>

        <TouchableOpacity
          onPress={handleSearch}
          style={styles.headerButton}
          activeOpacity={0.7}
          disabled={isSearching}>
          <View style={styles.headerButtonCircle}>
            {isSearching ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="search" size={20} color="#000" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm địa chỉ..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.place_id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#6B7280"
                    style={styles.searchResultIcon}
                  />
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultMainText}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.searchResultSecondaryText}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
              nestedScrollEnabled
            />
          </View>
        )}
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {MapView ? (
          <MapView
            ref={mapViewRef}
            style={styles.map}
            initialRegion={{
              latitude: mapLocation.latitude,
              longitude: mapLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: mapLocation.latitude,
              longitude: mapLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onPress={handleMapPress}
            onUserLocationChange={(event: any) => {
              if (event.nativeEvent.coordinate) {
                const {latitude, longitude} = event.nativeEvent.coordinate;
                // Chỉ cập nhật nếu đang trong quá trình lấy vị trí
                if (isGettingLocationRef.current) {
                  const newLocation = {latitude, longitude};
                  setMapLocation(newLocation);

                  if (mapViewRef.current) {
                    mapViewRef.current.animateToRegion(
                      {
                        ...newLocation,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      },
                      500,
                    );
                  }

                  reverseGeocode(latitude, longitude);
                  setIsGettingLocation(false);
                  isGettingLocationRef.current = false;
                }
              }
            }}>
            {/* Marker với bubble text */}
            <Marker
              coordinate={mapLocation}
              draggable
              onDragEnd={handleMarkerDragEnd}
              anchor={{x: 0.5, y: 1}}>
              <View style={styles.markerContainer}>
                {/* Bubble text */}
                <View style={styles.bubbleContainer}>
                  <Text style={styles.bubbleText}>
                    Đơn hàng sẽ được giao tại đây
                  </Text>
                  <View style={styles.bubbleArrow} />
                </View>
                {/* Pin icon */}
                <View style={styles.pinContainer}>
                  <Ionicons name="location" size={40} color="#F97316" />
                </View>
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#9CA3AF" />
            <Text style={styles.mapPlaceholderText}>
              Bản đồ đang được tải...
            </Text>
          </View>
        )}

        {/* Loading overlay khi geocoding */}
        {isGeocoding && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
          </View>
        )}

        {/* Nút lấy vị trí hiện tại */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          activeOpacity={0.8}
          disabled={isGettingLocation}>
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="locate" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Address Info Section */}
      <View style={styles.addressSection}>
        <View style={styles.addressInfo}>
          <Ionicons
            name="location-outline"
            size={20}
            color="#6B7280"
            style={styles.addressIcon}
          />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Địa chỉ</Text>
            {isGeocoding ? (
              <ActivityIndicator size="small" color="#F97316" />
            ) : (
              <Text style={styles.addressValue} numberOfLines={2}>
                {currentAddress || 'Đang tải địa chỉ...'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              // Có thể mở màn hình chỉnh sửa địa chỉ chi tiết
              Alert.alert('Chỉnh sửa', 'Tính năng đang phát triển');
            }}
            style={styles.editButton}>
            <Ionicons name="pencil-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleConfirm}
          style={styles.confirmButton}
          activeOpacity={0.8}
          disabled={isGeocoding}>
          <Text style={styles.confirmButtonText}>Xác nhận vị trí đã chọn</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  markerContainer: {
    alignItems: 'center',
  },
  bubbleContainer: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
    maxWidth: 200,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F97316',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  addressSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultIcon: {
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultMainText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultSecondaryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default EditLocationScreen;
