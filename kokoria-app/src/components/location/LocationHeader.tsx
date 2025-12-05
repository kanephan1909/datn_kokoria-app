import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface LocationHeaderProps {
  onBack: () => void;
  onSearch: () => void;
  isSearching?: boolean;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  onBack,
  onSearch,
  isSearching = false,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerButton}
        activeOpacity={0.7}>
        <View style={styles.headerButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#000" />
        </View>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>

      <TouchableOpacity
        onPress={onSearch}
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
  );
};

const styles = StyleSheet.create({
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
});

export default LocationHeader;
