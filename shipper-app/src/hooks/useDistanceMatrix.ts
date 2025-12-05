import {useEffect, useState, useCallback} from 'react';
import {GOOGLE_MAPS_API_KEY} from '../config/env';

interface Location {
  latitude: number;
  longitude: number;
}

interface DistanceMatrixResult {
  distance: {
    text: string; // "5.2 km"
    value: number; // 5200 (meters)
  };
  duration: {
    text: string; // "15 phút"
    value: number; // 900 (seconds)
  };
  status: string;
}

interface UseDistanceMatrixOptions {
  origin: Location | null;
  destination: Location | null;
  enabled?: boolean;
  updateInterval?: number; // milliseconds - 0 để không tự động update
}

export const useDistanceMatrix = (options: UseDistanceMatrixOptions) => {
  const {
    origin,
    destination,
    enabled = true,
    updateInterval = 10000, // Mặc định 10 giây
  } = options;

  const [result, setResult] = useState<DistanceMatrixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = useCallback(async () => {
    if (!origin || !destination || !enabled) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&language=vi&mode=driving&units=metric`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.rows && data.rows.length > 0) {
        const element = data.rows[0].elements[0];

        if (element.status === 'OK') {
          setResult({
            distance: {
              text: element.distance.text,
              value: element.distance.value,
            },
            duration: {
              text: element.duration.text,
              value: element.duration.value,
            },
            status: 'OK',
          });
        } else {
          setError(`Không thể tính toán: ${element.status}`);
          setResult(null);
        }
      } else {
        setError(`API Error: ${data.status}`);
        setResult(null);
      }
    } catch (err: any) {
      console.error('Distance Matrix API error:', err);
      setError(err.message || 'Không thể tính toán khoảng cách');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, enabled]);

  // Tính toán ngay khi origin hoặc destination thay đổi
  useEffect(() => {
    calculateDistance();
  }, [calculateDistance]);

  // Tự động cập nhật theo interval nếu được bật
  useEffect(() => {
    if (!enabled || !origin || !destination || updateInterval === 0) {
      return;
    }

    const interval = setInterval(() => {
      calculateDistance();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enabled, origin, destination, updateInterval, calculateDistance]);

  return {
    result,
    isLoading,
    error,
    refetch: calculateDistance,
  };
};
