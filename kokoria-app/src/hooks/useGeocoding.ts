import {useCallback, useState} from 'react';
import {GOOGLE_MAPS_API_KEY} from '../config/env';

interface Location {
  latitude: number;
  longitude: number;
}

export const useGeocoding = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode: chuyển tọa độ thành địa chỉ
  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      try {
        setIsGeocoding(true);
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        } else {
          return null;
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [],
  );

  // Geocode: chuyển địa chỉ thành tọa độ
  const geocodeAddress = useCallback(
    async (address: string): Promise<Location | null> => {
      try {
        setIsGeocoding(true);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address + ', Vietnam',
        )}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          return {
            latitude: location.lat,
            longitude: location.lng,
          };
        } else {
          return null;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [],
  );

  return {
    reverseGeocode,
    geocodeAddress,
    isGeocoding,
  };
};
