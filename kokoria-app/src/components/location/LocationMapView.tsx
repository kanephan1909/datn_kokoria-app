import React, {useRef, useEffect, forwardRef, useImperativeHandle} from 'react';
import {View, StyleSheet, ActivityIndicator, Text} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import LocationMarker from './LocationMarker';

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationMapViewProps {
  location: Location;
  onMapPress?: (location: Location) => void;
  onMarkerDragEnd?: (location: Location) => void;
  onUserLocationChange?: (location: Location) => void;
  isGeocoding?: boolean;
  showsUserLocation?: boolean;
}

export interface LocationMapViewRef {
  animateToRegion: (region: Location & {latitudeDelta: number; longitudeDelta: number}, duration?: number) => void;
}

const LocationMapView = forwardRef<LocationMapViewRef, LocationMapViewProps>(({
  location,
  onMapPress,
  onMarkerDragEnd,
  onUserLocationChange,
  isGeocoding = false,
  showsUserLocation = true,
}, ref) => {
  const mapViewRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Location & {latitudeDelta: number; longitudeDelta: number}, duration = 500) => {
      mapViewRef.current?.animateToRegion(region, duration);
    },
  }));

  useEffect(() => {
    if (mapViewRef.current && location) {
      mapViewRef.current.animateToRegion(
        {
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  }, [location]);

  const handleMapPress = (event: any) => {
    if (onMapPress) {
      const {latitude, longitude} = event.nativeEvent.coordinate;
      onMapPress({latitude, longitude});
    }
  };

  const handleMarkerDragEnd = (event: any) => {
    if (onMarkerDragEnd) {
      const {latitude, longitude} = event.nativeEvent.coordinate;
      onMarkerDragEnd({latitude, longitude});
    }
  };

  const handleUserLocationChange = (event: any) => {
    if (onUserLocationChange && event.nativeEvent.coordinate) {
      const {latitude, longitude} = event.nativeEvent.coordinate;
      onUserLocationChange({latitude, longitude});
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onUserLocationChange={handleUserLocationChange}>
        <Marker
          coordinate={location}
          draggable
          onDragEnd={handleMarkerDragEnd}
          anchor={{x: 0.5, y: 1}}>
          <LocationMarker />
        </Marker>
      </MapView>

      {/* Loading overlay khi geocoding */}
      {isGeocoding && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
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
});

LocationMapView.displayName = 'LocationMapView';

export default LocationMapView;
