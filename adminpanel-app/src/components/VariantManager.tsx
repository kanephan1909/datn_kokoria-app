import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ProductVariant, ProductOption} from '../types/product';

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

const VariantManager = ({variants, onChange}: VariantManagerProps) => {
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  const addVariant = () => {
    const newVariant: ProductVariant = {
      type: 'other',
      name: '',
      options: [],
      required: true,
    };
    onChange([...variants, newVariant]);
    setExpandedVariant(variants.length);
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants];
    updated[index] = {...updated[index], ...updates};
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    Alert.alert('Xóa variant', 'Bạn có chắc chắn muốn xóa variant này?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const updated = variants.filter((_, i) => i !== index);
          onChange(updated);
          if (expandedVariant === index) {
            setExpandedVariant(null);
          }
        },
      },
    ]);
  };

  const addOption = (variantIndex: number) => {
    const newOption: ProductOption = {
      id: `option-${Date.now()}`,
      name: '',
      price: 0,
    };
    const updated = [...variants];
    updated[variantIndex].options = [...updated[variantIndex].options, newOption];
    onChange(updated);
  };

  const updateOption = (
    variantIndex: number,
    optionIndex: number,
    updates: Partial<ProductOption>,
  ) => {
    const updated = [...variants];
    updated[variantIndex].options[optionIndex] = {
      ...updated[variantIndex].options[optionIndex],
      ...updates,
    };
    onChange(updated);
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].options = updated[variantIndex].options.filter(
      (_, i) => i !== optionIndex,
    );
    onChange(updated);
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-gray-900 font-bold text-lg">
            Tùy chọn sản phẩm (Variants)
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            Thêm các tùy chọn như kích thước, loại sốt, v.v.
          </Text>
        </View>
        <TouchableOpacity
          onPress={addVariant}
          className="bg-blue-600 px-4 py-2.5 rounded-xl flex-row items-center shadow-sm"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text className="text-white font-bold ml-1.5 text-sm">Thêm variant</Text>
        </TouchableOpacity>
      </View>

      {variants.length === 0 && (
        <View className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-dashed border-gray-300">
          <View className="items-center">
            <Ionicons name="options-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 text-center mt-3 font-medium">
              Chưa có variant nào
            </Text>
            <Text className="text-gray-400 text-center text-xs mt-1">
              Nhấn "Thêm variant" để bắt đầu
            </Text>
          </View>
        </View>
      )}

      {variants.map((variant, variantIndex) => (
        <View
          key={variantIndex}
          className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
          {/* Variant Header */}
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={() =>
                setExpandedVariant(
                  expandedVariant === variantIndex ? null : variantIndex,
                )
              }
              className="flex-1 flex-row items-center">
              <Ionicons
                name={
                  expandedVariant === variantIndex
                    ? 'chevron-down'
                    : 'chevron-forward'
                }
                size={20}
                color="#6B7280"
              />
              <Text className="text-gray-700 font-semibold ml-2">
                {variant.name || `Variant ${variantIndex + 1}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeVariant(variantIndex)}
              className="ml-2">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Variant Form */}
          {expandedVariant === variantIndex && (
            <View className="mt-3">
              {/* Variant Type */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold text-sm mb-2">
                  Loại variant
                </Text>
                <View className="flex-row" style={{gap: 10}}>
                  {(['size', 'sauce', 'other'] as const).map(type => {
                    const isSelected = variant.type === type;
                    const typeConfig = {
                      size: {label: 'Kích thước', icon: 'resize-outline', color: '#3B82F6'},
                      sauce: {label: 'Sốt', icon: 'water-outline', color: '#F59E0B'},
                      other: {label: 'Khác', icon: 'ellipsis-horizontal-outline', color: '#6B7280'},
                    };
                    const config = typeConfig[type];
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => updateVariant(variantIndex, {type})}
                        className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                shadowColor: config.color,
                                shadowOffset: {width: 0, height: 2},
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                              }
                            : {}
                        }>
                        <Ionicons
                          name={config.icon as any}
                          size={18}
                          color={isSelected ? config.color : '#9CA3AF'}
                        />
                        <Text
                          className={`ml-2 font-semibold text-sm ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                          {config.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Variant Name */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold text-sm mb-2">
                  Tên hiển thị
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Ionicons name="text-outline" size={18} color="#6B7280" />
                  <TextInput
                    value={variant.name}
                    onChangeText={text =>
                      updateVariant(variantIndex, {name: text})
                    }
                    placeholder="Ví dụ: Kích thước, Loại sốt"
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Required Toggle */}
              <View className="mb-4">
                <TouchableOpacity
                  onPress={() =>
                    updateVariant(variantIndex, {required: !variant.required})
                  }
                  className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <View
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mr-3 ${
                      variant.required
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}>
                    {variant.required && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-sm">
                      Bắt buộc chọn
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      Khách hàng phải chọn ít nhất một option
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View className="mt-2">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-gray-900 font-bold text-sm">
                      Options
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {variant.options.length} option{variant.options.length !== 1 ? 's' : ''} đã thêm
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => addOption(variantIndex)}
                    className="bg-green-500 px-4 py-2 rounded-xl flex-row items-center shadow-sm"
                    style={{
                      shadowColor: '#10B981',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }}>
                    <Ionicons name="add-circle" size={18} color="#fff" />
                    <Text className="text-white font-bold text-xs ml-1.5">
                      Thêm option
                    </Text>
                  </TouchableOpacity>
                </View>

                {variant.options.length === 0 && (
                  <View className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                    <View className="items-center">
                      <Ionicons name="list-outline" size={32} color="#9CA3AF" />
                      <Text className="text-gray-500 text-center mt-2 text-sm font-medium">
                        Chưa có option nào
                      </Text>
                      <Text className="text-gray-400 text-center text-xs mt-1">
                        Nhấn "Thêm option" để thêm
                      </Text>
                    </View>
                  </View>
                )}

                {variant.options.map((option, optionIndex) => (
                  <View
                    key={optionIndex}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 mb-3 border border-gray-200 shadow-sm"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className="bg-blue-100 rounded-full w-7 h-7 items-center justify-center mr-2">
                          <Text className="text-blue-600 font-bold text-xs">
                            {optionIndex + 1}
                          </Text>
                        </View>
                        <Text className="text-gray-700 font-semibold text-sm">
                          Option {optionIndex + 1}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeOption(variantIndex, optionIndex)}
                        className="bg-red-50 p-1.5 rounded-lg">
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <View>
                      <View className="mb-3">
                        <Text className="text-gray-600 text-xs font-medium mb-1.5">
                          Tên option
                        </Text>
                        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                          <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                          <TextInput
                            value={option.name}
                            onChangeText={text =>
                              updateOption(variantIndex, optionIndex, {name: text})
                            }
                            placeholder="Ví dụ: Nguyên con, Sốt tỏi"
                            className="flex-1 ml-3 text-gray-900 text-sm"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                      <View className="mb-2">
                        <Text className="text-gray-600 text-xs font-medium mb-1.5">
                          Giá bổ sung
                        </Text>
                        <View className="flex-row items-center">
                          <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                            <Ionicons name="cash-outline" size={18} color="#6B7280" />
                            <TextInput
                              value={option.price.toString()}
                              onChangeText={text => {
                                const num = parseFloat(text) || 0;
                                updateOption(variantIndex, optionIndex, {price: num});
                              }}
                              placeholder="0 = không đổi"
                              keyboardType="numeric"
                              className="flex-1 ml-3 text-gray-900 text-sm"
                              placeholderTextColor="#9CA3AF"
                            />
                          </View>
                          {option.price !== 0 && (
                            <View
                              className={`ml-3 px-3 py-3 rounded-xl ${
                                option.price > 0
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-red-50 border border-red-200'
                              }`}>
                              <Text
                                className={`font-bold text-sm ${
                                  option.price > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {option.price > 0 ? '+' : ''}
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(option.price)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-400 text-xs mt-1.5 ml-1">
                          {option.price === 0
                            ? 'Giá không thay đổi'
                            : option.price > 0
                            ? 'Tăng giá so với giá cơ bản'
                            : 'Giảm giá so với giá cơ bản'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export default VariantManager;

