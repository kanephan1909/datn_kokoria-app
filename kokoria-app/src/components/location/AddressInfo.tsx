import React from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface AddressInfoProps {
  address: string;
  isLoading?: boolean;
  onEdit?: () => void;
}

const AddressInfo: React.FC<AddressInfoProps> = ({
  address,
  isLoading = false,
  onEdit,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      Alert.alert('Chỉnh sửa', 'Tính năng đang phát triển');
    }
  };

  return (
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
          {isLoading ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Text style={styles.addressValue} numberOfLines={2}>
              {address || 'Đang tải địa chỉ...'}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default AddressInfo;
