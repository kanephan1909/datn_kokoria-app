import React from 'react';
import {View, FlatList, TouchableOpacity, Text, StyleSheet} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface PlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationSearchResultsProps {
  results: PlacePrediction[];
  onSelectResult: (place: PlacePrediction) => void;
  visible: boolean;
}

const LocationSearchResults: React.FC<LocationSearchResultsProps> = ({
  results,
  onSelectResult,
  visible,
}) => {
  if (!visible || results.length === 0) {
    return null;
  }

  return (
    <View style={styles.searchResultsContainer}>
      <FlatList
        data={results}
        keyExtractor={item => item.place_id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => onSelectResult(item)}>
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
  );
};

const styles = StyleSheet.create({
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
});

export default LocationSearchResults;
