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
}

interface Location {
  latitude: number;
  longitude: number;
}

const EditLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};

  const [mapLocation, setMapLocation] = useState<Location>(
    params.initialLocation || defaultLocation,
  );
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
  }, [navigation, mapLocation, currentAddress]);

  // Load địa chỉ ban đầu
  useEffect(() => {
    const loadInitialAddress = async () => {
      const location = params.initialLocation || defaultLocation;
      const address = await reverseGeocode(location.latitude, location.longitude);
      if (address) {
        setCurrentAddress(address);
      } else {
        setCurrentAddress('Không thể xác định địa chỉ');
      }
    };
    loadInitialAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
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
