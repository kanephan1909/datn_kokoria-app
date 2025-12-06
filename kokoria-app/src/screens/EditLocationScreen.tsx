import React, {useState, useCallback, useEffect, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {MainRoutes} from '../navigation/Routes';

// Components
import {
  LocationHeader,
  LocationSearchBar,
  LocationSearchResults,
  LocationMapView,
  CurrentLocationButton,
  AddressInfo,
  type LocationMapViewRef,
} from '../components/location';

// Hooks
import {useGeocoding} from '../hooks/useGeocoding';
import {useLocationSearch} from '../hooks/useLocationSearch';
import {useCurrentLocation} from '../hooks/useCurrentLocation';

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
  returnTo?: string;
  addressId?: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

const EditLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};

  // Khởi tạo state: nếu có initialLocation thì dùng, nếu không thì dùng defaultLocation
  // Nhưng nếu chỉ có address, sẽ geocode ngay trong useEffect
  const [mapLocation, setMapLocation] = useState<Location>(() => {
    if (params.initialLocation) {
      return params.initialLocation;
    }
    return defaultLocation;
  });
  const [currentAddress, setCurrentAddress] = useState<string>(
    params.address || '',
  );

  const mapViewRef = useRef<LocationMapViewRef>(null);

  // Hooks
  const {reverseGeocode, geocodeAddress, isGeocoding} = useGeocoding();
  const {
    searchQuery,
    searchResults,
    showSearchResults,
    isSearching,
    handleSearchChange,
    clearSearch,
    getPlaceDetails,
    setShowSearchResults,
  } = useLocationSearch();

  // Xử lý khi location được cập nhật
  const handleLocationUpdate = useCallback(
    async (location: Location) => {
      setMapLocation(location);
      const address = await reverseGeocode(location.latitude, location.longitude);
      if (address) {
        setCurrentAddress(address);
      } else {
        setCurrentAddress('Không thể xác định địa chỉ');
      }
    },
    [reverseGeocode],
  );

  const {getCurrentLocation, isGettingLocation, isGettingLocationRef} =
    useCurrentLocation(handleLocationUpdate);

  // Xử lý khi map được nhấn
  const handleMapPress = useCallback(
    (location: Location) => {
      handleLocationUpdate(location);
    },
    [handleLocationUpdate],
  );

  // Xử lý khi marker được kéo
  const handleMarkerDragEnd = useCallback(
    (location: Location) => {
      handleLocationUpdate(location);
    },
    [handleLocationUpdate],
  );

  // Xử lý khi user location thay đổi
  const handleUserLocationChange = useCallback(
    (location: Location) => {
      // Chỉ cập nhật nếu đang trong quá trình lấy vị trí
      if (isGettingLocationRef?.current) {
        handleLocationUpdate(location);
        if (isGettingLocationRef.current) {
          isGettingLocationRef.current = false;
        }
      }
    },
    [handleLocationUpdate, isGettingLocationRef],
  );

  // Xử lý khi chọn kết quả tìm kiếm
  const handleSelectSearchResult = useCallback(
    async (place: any) => {
      const result = await getPlaceDetails(place.place_id);
      if (result) {
        setMapLocation(result.location);
        setCurrentAddress(result.address);
        clearSearch();

        // Animate map đến vị trí mới
        if (mapViewRef.current) {
          mapViewRef.current.animateToRegion(
            {
              ...result.location,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
        }
      }
    },
    [getPlaceDetails, clearSearch],
  );

  // Xử lý tìm kiếm khi nhấn nút search
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      const location = await geocodeAddress(searchQuery.trim());
      if (location) {
        setMapLocation(location);
        const address = await reverseGeocode(
          location.latitude,
          location.longitude,
        );
        if (address) {
          setCurrentAddress(address);
        }

        // Animate map đến vị trí mới
        if (mapViewRef.current) {
          mapViewRef.current.animateToRegion(
            {
              ...location,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
        }
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy địa chỉ');
      }
      setShowSearchResults(false);
    }
  }, [searchQuery, geocodeAddress, reverseGeocode, setShowSearchResults]);

  // Xác nhận vị trí
  const handleConfirm = useCallback(() => {
    const selectedLocation = {
      latitude: mapLocation.latitude,
      longitude: mapLocation.longitude,
      address: currentAddress,
    };

    if (params.returnTo === 'EditAddress' && params.addressId) {
      // Quay lại EditAddressScreen với location đã chọn
      (navigation as any).navigate({
        name: MainRoutes.EditAddress,
        params: {
          addressId: params.addressId,
          selectedLocation,
        },
        merge: true,
      });
    } else {
      // Mặc định navigate đến Checkout2
      (navigation as any).navigate({
        name: MainRoutes.Checkout2,
        params: {
          selectedLocation,
        },
        merge: true,
      });
    }
  }, [params.returnTo, params.addressId, navigation, mapLocation, currentAddress]);

  // Hàm helper để animate map đến vị trí với retry
  const animateToLocation = useCallback(
    (location: Location, retries = 5, delay = 300) => {
      const tryAnimate = (attempt: number) => {
        if (mapViewRef.current) {
          mapViewRef.current.animateToRegion(
            {
              ...location,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
          console.log('Map animated to location:', location);
        } else if (attempt < retries) {
          // Nếu map chưa sẵn sàng, thử lại sau một chút
          setTimeout(() => tryAnimate(attempt + 1), delay);
        } else {
          console.warn('Map ref not ready after retries');
        }
      };
      tryAnimate(0);
    },
    [],
  );

  // Load địa chỉ ban đầu
  useEffect(() => {
    const loadInitialAddress = async () => {
      // Nếu có initialLocation, sử dụng nó
      if (params.initialLocation) {
        const location = params.initialLocation;
        console.log('Using initialLocation:', location);
        // Ưu tiên sử dụng address string nếu có (chính xác hơn)
        if (params.address) {
          setCurrentAddress(params.address);
        } else {
          // Nếu không có address string, reverse geocode từ tọa độ
          const address = await reverseGeocode(location.latitude, location.longitude);
          if (address) {
            setCurrentAddress(address);
          } else {
            setCurrentAddress('Không thể xác định địa chỉ');
          }
        }
        // Set location và animate map
        setMapLocation(location);
        // Đợi một chút để map render xong rồi mới animate
        setTimeout(() => {
          animateToLocation(location);
        }, 500);
      } else if (params.address && params.address.trim()) {
        // Nếu có address string nhưng không có initialLocation, geocode address NGAY
        console.log('Geocoding address:', params.address);
        try {
          const location = await geocodeAddress(params.address.trim());
          if (location) {
            console.log('Geocode thành công:', location);
            // Set location và address
            setMapLocation(location);
            setCurrentAddress(params.address);
            // Animate map đến vị trí sau khi geocode xong
            // Đợi một chút để map render xong
            setTimeout(() => {
              animateToLocation(location);
            }, 500);
          } else {
            console.log('Geocode thất bại, sử dụng default location');
            // Nếu geocode thất bại, sử dụng default location
            setMapLocation(defaultLocation);
            const address = await reverseGeocode(
              defaultLocation.latitude,
              defaultLocation.longitude,
            );
            if (address) {
              setCurrentAddress(address);
            } else {
              setCurrentAddress('Không thể xác định địa chỉ');
            }
          }
        } catch (error) {
          console.error('Error geocoding:', error);
          // Nếu có lỗi, vẫn sử dụng default location
          setMapLocation(defaultLocation);
          setCurrentAddress(params.address || 'Không thể xác định địa chỉ');
        }
      } else {
        // Không có gì, sử dụng default location
        console.log('No params, using default location');
        const location = defaultLocation;
        const address = await reverseGeocode(location.latitude, location.longitude);
        if (address) {
          setCurrentAddress(address);
        } else {
          setCurrentAddress('Không thể xác định địa chỉ');
        }
      }
    };
    loadInitialAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <LocationHeader
        onBack={() => navigation.goBack()}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      <View style={styles.searchWrapper}>
        <LocationSearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearch}
          onClear={clearSearch}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowSearchResults(true);
            }
          }}
        />
        <LocationSearchResults
          results={searchResults}
          onSelectResult={handleSelectSearchResult}
          visible={showSearchResults}
        />
      </View>

      <View style={styles.mapWrapper}>
        <LocationMapView
          ref={mapViewRef}
          location={mapLocation}
          onMapPress={handleMapPress}
          onMarkerDragEnd={handleMarkerDragEnd}
          onUserLocationChange={handleUserLocationChange}
          isGeocoding={isGeocoding}
          showsUserLocation={true}
        />
        <CurrentLocationButton
          onPress={getCurrentLocation}
          isLoading={isGettingLocation}
        />
      </View>

      <AddressInfo address={currentAddress} isLoading={isGeocoding} />

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
  searchWrapper: {
    backgroundColor: '#FFFFFF',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
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
});

export default EditLocationScreen;
