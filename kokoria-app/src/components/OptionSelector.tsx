import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import {ProductVariant} from '../../api/apiClient';

interface OptionSelectorProps {
  variant: ProductVariant;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

const OptionSelector = ({
  variant,
  selectedOptionId,
  onSelect,
}: OptionSelectorProps) => {
  const formatPrice = (price: number) => {
    if (price === 0) {
      return '';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {variant.name || variant.type || 'Tùy chọn'}
          {variant.required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      <View style={styles.optionsContainer}>
        {variant.options && variant.options.length > 0 ? (
          variant.options
            .filter((option) => option && option.id && option.name)
            .map((option) => {
              const isSelected = selectedOptionId === option.id;
              const price = typeof option.price === 'number' ? option.price : 0;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => onSelect(option.id)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                    {option.name}
                  </Text>
                  {price !== 0 && (
                    <Text
                      style={[
                        styles.optionPrice,
                        isSelected && styles.optionPriceSelected,
                      ]}>
                      {formatPrice(price)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
        ) : (
          <Text style={styles.emptyText}>Không có tùy chọn nào</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  required: {
    color: '#EF4444',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#EA580C',
  },
  optionPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  optionPriceSelected: {
    color: '#EA580C',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default OptionSelector;

