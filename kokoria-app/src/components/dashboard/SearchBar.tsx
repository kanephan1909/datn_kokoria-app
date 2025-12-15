import {
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useVoiceRecognition} from '../../hooks/useVoiceRecognition';
import {useQuery} from '@tanstack/react-query';
import {fetchCategories} from '../../../api/apiClient';

export interface SearchCriteria {
  text?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface Category {
  id: string;
  name: string;
}

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  onVoicePress?: () => void;
  searchCriteria?: SearchCriteria;
  onSearchCriteriaChange?: (criteria: SearchCriteria) => void;
  onSearch?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  onVoicePress,
  searchCriteria,
  onSearchCriteriaChange,
  onSearch,
}: SearchBarProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localCriteria, setLocalCriteria] = useState<SearchCriteria>({
    text: value,
    categoryId: searchCriteria?.categoryId,
    minPrice: searchCriteria?.minPrice,
    maxPrice: searchCriteria?.maxPrice,
    minRating: searchCriteria?.minRating,
  });

  // Sync value with localCriteria
  useEffect(() => {
    setLocalCriteria(prev => ({...prev, text: value}));
  }, [value]);

  // Sync searchCriteria props with localCriteria
  useEffect(() => {
    if (searchCriteria) {
      setLocalCriteria(prev => ({
        ...prev,
        categoryId: searchCriteria.categoryId,
        minPrice: searchCriteria.minPrice,
        maxPrice: searchCriteria.maxPrice,
        minRating: searchCriteria.minRating,
      }));
    }
  }, [searchCriteria]);

  // Fetch categories for filter
  const {data: categoriesData} = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetchCategories();
      if (response.success && response.data) {
        return response.data as Category[];
      }
      throw new Error(response.message || 'Failed to fetch categories');
    },
  });

  const {isRecording, startRecording, stopRecording} = useVoiceRecognition(
    (text) => {
      onChange(text);
    },
  );

  const handleVoicePress = () => {
    if (onVoicePress) {
      onVoicePress();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleApplyFilters = () => {
    const criteria: SearchCriteria = {
      text: localCriteria.text || value,
      categoryId: localCriteria.categoryId,
      minPrice: localCriteria.minPrice,
      maxPrice: localCriteria.maxPrice,
      minRating: localCriteria.minRating,
    };

    if (onSearchCriteriaChange) {
      onSearchCriteriaChange(criteria);
    }
    setShowFilterModal(false);
    // Trigger scroll to results when applying filters
    if (onSearch) {
      setTimeout(() => {
        onSearch();
      }, 100);
    }
  };

  const handleResetFilters = () => {
    const resetCriteria: SearchCriteria = {
      text: value,
    };
    setLocalCriteria(resetCriteria);
    if (onSearchCriteriaChange) {
      onSearchCriteriaChange(resetCriteria);
    }
    setShowFilterModal(false);
  };

  const hasActiveFilters = () => {
    return !!(
      localCriteria.categoryId ||
      localCriteria.minPrice ||
      localCriteria.maxPrice ||
      localCriteria.minRating
    );
  };

  const countActiveFilters = () => {
    let count = 0;
    if (localCriteria.categoryId) {
      count++;
    }
    if (localCriteria.minPrice) {
      count++;
    }
    if (localCriteria.maxPrice) {
      count++;
    }
    if (localCriteria.minRating) {
      count++;
    }
    return count;
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingVertical: 14,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.05)',
        }}>
        <TouchableOpacity
          onPress={() => {
            // Trigger search khi click vào icon search bên trái
            const trimmedValue = value.trim();
            if (trimmedValue) {
              // Đảm bảo cả onChange và onSearchCriteriaChange đều được gọi
              onChange(trimmedValue);
              if (onSearchCriteriaChange) {
                onSearchCriteriaChange({
                  ...searchCriteria,
                  text: trimmedValue,
                });
              }
              // Trigger scroll to results
              if (onSearch) {
                onSearch();
              }
            }
          }}
          activeOpacity={0.7}
          disabled={!value.trim() || isRecording}>
          <Ionicons
            name="search-outline"
            size={24}
            color={value.trim() && !isRecording ? '#F97316' : '#6B7280'}
          />
        </TouchableOpacity>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Tìm kiếm gà rán, combo, đồ uống..."
          placeholderTextColor="#9CA3AF"
          style={{
            marginLeft: 12,
            flex: 1,
            fontSize: 16,
            color: '#1F2937',
            fontWeight: '500',
          }}
          editable={!isRecording}
          returnKeyType="search"
          onSubmitEditing={() => {
            // Trigger search when user presses enter/return
            const trimmedValue = value.trim();
            if (trimmedValue) {
              onChange(trimmedValue);
              if (onSearchCriteriaChange) {
                onSearchCriteriaChange({
                  ...searchCriteria,
                  text: trimmedValue,
                });
              }
              // Trigger scroll to results
              if (onSearch) {
                onSearch();
              }
            }
          }}
        />
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
            style={{marginRight: 8, position: 'relative'}}>
            <Ionicons
              name="options-outline"
              size={24}
              color={hasActiveFilters() ? '#F97316' : '#6B7280'}
            />
            {hasActiveFilters() && countActiveFilters() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {countActiveFilters()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {value.length > 0 && !isRecording && (
            <TouchableOpacity
              onPress={() => {
                onChange('');
                // Reset search criteria khi clear text
                if (onSearchCriteriaChange) {
                  const resetCriteria = {...searchCriteria};
                  delete resetCriteria.text;
                  onSearchCriteriaChange(resetCriteria);
                }
              }}
              activeOpacity={0.7}
              style={{marginRight: 8}}>
              <Ionicons name="close-circle" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleVoicePress}
            activeOpacity={0.7}
            style={{marginLeft: 4}}
            disabled={isRecording}>
            {isRecording ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons
                name="mic-outline"
                size={24}
                color={isRecording ? '#EF4444' : '#6B7280'}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Danh mục</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}>
                  <TouchableOpacity
                    onPress={() =>
                      setLocalCriteria({...localCriteria, categoryId: undefined})
                    }
                    style={[
                      styles.categoryChip,
                      !localCriteria.categoryId && styles.categoryChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        !localCriteria.categoryId && styles.categoryChipTextActive,
                      ]}>
                      Tất cả
                    </Text>
                  </TouchableOpacity>
                  {categoriesData?.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() =>
                        setLocalCriteria({
                          ...localCriteria,
                          categoryId: category.id,
                        })
                      }
                      style={[
                        styles.categoryChip,
                        localCriteria.categoryId === category.id &&
                          styles.categoryChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.categoryChipText,
                          localCriteria.categoryId === category.id &&
                            styles.categoryChipTextActive,
                        ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Khoảng giá (VNĐ)</Text>
                <View style={styles.priceRangeContainer}>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceLabel}>Từ</Text>
                    <TextInput
                      value={
                        localCriteria.minPrice
                          ? localCriteria.minPrice.toString()
                          : ''
                      }
                      onChangeText={text => {
                        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                        setLocalCriteria({
                          ...localCriteria,
                          minPrice: isNaN(num) ? undefined : num,
                        });
                      }}
                      placeholder="0"
                      keyboardType="numeric"
                      style={styles.priceInput}
                    />
                  </View>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceLabel}>Đến</Text>
                    <TextInput
                      value={
                        localCriteria.maxPrice
                          ? localCriteria.maxPrice.toString()
                          : ''
                      }
                      onChangeText={text => {
                        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                        setLocalCriteria({
                          ...localCriteria,
                          maxPrice: isNaN(num) ? undefined : num,
                        });
                      }}
                      placeholder="Không giới hạn"
                      keyboardType="numeric"
                      style={styles.priceInput}
                    />
                  </View>
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Đánh giá tối thiểu</Text>
                <View style={styles.ratingContainer}>
                  {[4, 3, 2, 1].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() =>
                        setLocalCriteria({
                          ...localCriteria,
                          minRating:
                            localCriteria.minRating === rating
                              ? undefined
                              : rating,
                        })
                      }
                      style={[
                        styles.ratingChip,
                        localCriteria.minRating === rating &&
                          styles.ratingChipActive,
                      ]}>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons
                            key={star}
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={18}
                            color={
                              star <= rating
                                ? '#F97316'
                                : localCriteria.minRating === rating
                                  ? '#F97316'
                                  : '#D1D5DB'
                            }
                          />
                        ))}
                      </View>
                      <Text
                        style={[
                          styles.ratingText,
                          localCriteria.minRating === rating &&
                            styles.ratingTextActive,
                        ]}>
                        {rating}+ sao
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={styles.resetButton}
                activeOpacity={0.7}>
                <Text style={styles.resetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                style={styles.applyButton}
                activeOpacity={0.7}>
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F97316',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Dimensions.get('window').height * 0.85,
    width: '100%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingChipActive: {
    backgroundColor: '#FEF3E2',
    borderColor: '#F97316',
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingTextActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
