import {useCallback, useState} from 'react';
import {GOOGLE_MAPS_API_KEY} from '../config/env';

interface Location {
  latitude: number;
  longitude: number;
}

interface Route {
  coordinates: Location[];
  distance: string;
  duration: string;
}

export const useDirections = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);

  // Tính toán route từ origin đến destination
  const calculateRoute = useCallback(
    async (
      origin: Location,
      destination: Location,
    ): Promise<Route | null> => {
      try {
        setIsCalculating(true);

        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&language=vi&mode=driving`;

        const response = await fetch(directionsUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          const leg = routeData.legs[0];

          // Decode polyline để lấy danh sách tọa độ
          const coordinates: Location[] = [];
          if (routeData.overview_polyline?.points) {
            const decoded = decodePolyline(routeData.overview_polyline.points);
            if (decoded && decoded.length > 0) {
              coordinates.push(...decoded);
              console.log(`✅ Decoded ${decoded.length} points from polyline`);
            } else {
              console.warn('⚠️ Polyline decode returned empty, using step-by-step coordinates');
              // Fallback: lấy tọa độ từ các steps trong leg
              if (leg.steps && leg.steps.length > 0) {
                leg.steps.forEach((step: any) => {
                  if (step.start_location) {
                    coordinates.push({
                      latitude: step.start_location.lat,
                      longitude: step.start_location.lng,
                    });
                  }
                });
                // Thêm điểm cuối
                if (leg.end_location) {
                  coordinates.push({
                    latitude: leg.end_location.lat,
                    longitude: leg.end_location.lng,
                  });
                }
              } else {
                coordinates.push(origin, destination);
              }
            }
          } else {
            console.warn('⚠️ No overview_polyline, using step-by-step coordinates');
            // Fallback: lấy tọa độ từ các steps
            if (leg.steps && leg.steps.length > 0) {
              leg.steps.forEach((step: any) => {
                if (step.start_location) {
                  coordinates.push({
                    latitude: step.start_location.lat,
                    longitude: step.start_location.lng,
                  });
                }
              });
              if (leg.end_location) {
                coordinates.push({
                  latitude: leg.end_location.lat,
                  longitude: leg.end_location.lng,
                });
              }
            } else {
              coordinates.push(origin, destination);
            }
          }

          const newRoute: Route = {
            coordinates,
            distance: leg.distance?.text || 'N/A',
            duration: leg.duration?.text || 'N/A',
          };

          console.log(`✅ Route calculated: ${coordinates.length} points, ${leg.distance?.text}, ${leg.duration?.text}`);
          setRoute(newRoute);
          return newRoute;
        } else {
          console.error('❌ Directions API error:', data.status, data.error_message);
          // Fallback: tạo route đơn giản từ origin đến destination
          const fallbackRoute: Route = {
            coordinates: [origin, destination],
            distance: 'N/A',
            duration: 'N/A',
          };
          setRoute(fallbackRoute);
          return fallbackRoute;
        }
      } catch (error) {
        console.error('Directions calculation error:', error);
        // Fallback: tạo route đơn giản
        const fallbackRoute: Route = {
          coordinates: [origin, destination],
          distance: 'N/A',
          duration: 'N/A',
        };
        setRoute(fallbackRoute);
        return fallbackRoute;
      } finally {
        setIsCalculating(false);
      }
    },
    [],
  );

  return {
    calculateRoute,
    route,
    isCalculating,
  };
};

// Hàm decode polyline từ Google Maps
// Polyline là cách Google Maps mã hóa đường đi để tiết kiệm băng thông
function decodePolyline(encoded: string): Location[] {
  const poly: Location[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return poly;
}
