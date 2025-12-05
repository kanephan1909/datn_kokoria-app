import {useCallback, useState, useRef, useEffect} from 'react';
import {GOOGLE_MAPS_API_KEY} from '../config/env';

interface PlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface Location {
  latitude: number;
  longitude: number;
}

export const useLocationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Lấy địa chỉ chi tiết từ place_id
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<{location: Location; address: string} | null> => {
      try {
        setIsSearching(true);
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=vi&fields=geometry,formatted_address`;

        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
          const location = data.result.geometry.location;
          return {
            location: {
              latitude: location.lat,
              longitude: location.lng,
            },
            address: data.result.formatted_address,
          };
        }
        return null;
      } catch (error) {
        console.error('Place details error:', error);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  // Xử lý tìm kiếm với debounce
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(text);
      }, 300);
    },
    [searchPlaces],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchQuery,
    searchResults,
    showSearchResults,
    isSearching,
    handleSearchChange,
    clearSearch,
    getPlaceDetails,
    setShowSearchResults,
  };
};
