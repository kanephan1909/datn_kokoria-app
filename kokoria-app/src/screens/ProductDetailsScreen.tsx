import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchProductById, Product} from '../../api/apiClient';
import {useCart} from '../store/useCartStore';
import {MainRoutes} from '../navigation/Routes';
import OptionSelector from '../components/OptionSelector';

const {width} = Dimensions.get('window');

const ProductDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {productId} = route.params as {productId: string};
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  // State để lưu các options đã chọn: { variantType: optionId }
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string;
  }>({});
  const {addItem, cartItems, totalPrice} = useCart();

  const loadProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchProductById(productId);
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy sản phẩm');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [productId, navigation]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Tính toán giá dựa trên options đã chọn
  const calculatedPrice = useMemo(() => {
    if (!product) {
      return 0;
    }
    let calculatedTotal = product.price;

    if (product.variants) {
      product.variants.forEach(variant => {
        const selectedOptionId = selectedOptions[variant.type];
        if (selectedOptionId && variant.options) {
          const option = variant.options.find(opt => opt && opt.id === selectedOptionId);
          if (option && option.price !== undefined) {
            calculatedTotal += option.price;
          }
        }
      });
    }

    return calculatedTotal;
  }, [product, selectedOptions]);

  // Kiểm tra xem đã chọn đủ options bắt buộc chưa
  const isOptionsValid = useMemo(() => {
    if (!product?.variants) {
      return true;
    }

    return product.variants.every(variant => {
      if (!variant.required) {
        return true;
      }
      return !!selectedOptions[variant.type];
    });
  }, [product, selectedOptions]);

  // Tự động chọn option đầu tiên nếu là required và chưa có selection
  useEffect(() => {
    if (product?.variants) {
      const newSelections: {[key: string]: string} = {...selectedOptions};
      let hasChange = false;

      product.variants.forEach(variant => {
        if (variant.required && !newSelections[variant.type] && variant.options && variant.options.length > 0) {
          const firstOption = variant.options[0];
          // Đảm bảo option có id
          if (firstOption && firstOption.id) {
            newSelections[variant.type] = firstOption.id;
            hasChange = true;
          }
        }
      });

      if (hasChange) {
        setSelectedOptions(newSelections);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleOptionSelect = (variantType: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [variantType]: optionId,
    }));
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && (!product?.stock || newQuantity <= product.stock)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    // Kiểm tra options bắt buộc
    if (!isOptionsValid) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ các tùy chọn bắt buộc');
      return;
    }

    if (product.stock !== undefined && quantity > product.stock) {
      Alert.alert('Lỗi', 'Số lượng vượt quá tồn kho');
      return;
    }

    try {
      // Tạo note chứa thông tin options đã chọn
      const optionsNote = product.variants
        ? product.variants
            .map(variant => {
              const selectedOptionId = selectedOptions[variant.type];
              if (selectedOptionId && variant.options) {
                const option = variant.options.find(opt => opt && opt.id === selectedOptionId);
                if (option && option.name) {
                  return `${variant.name || variant.type}: ${option.name}`;
                }
              }
              return null;
            })
            .filter(Boolean)
            .join(', ')
        : '';

      await addItem(product.id, quantity, optionsNote);
      // Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {product.imageUrl ? (
            <Image
              source={{uri: product.imageUrl}}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant" size={80} color="#EA580C" />
            </View>
          )}

          {/* Header Buttons */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.7}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#EF4444' : '#000'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Info Section */}
        <View style={styles.contentContainer}>
          {/* Product Name and Price */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.price}>{formatPrice(calculatedPrice)}</Text>
            </View>

            {/* Rating and Stock Info */}
            <View style={styles.metaRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#FBBF24" />
                <Text style={styles.ratingText}>
                  {product.rating || '4.8'}
                </Text>
                <Text style={styles.reviewsText}>
                  ({product.reviews || '1.2K'} đánh giá)
                </Text>
              </View>
              {product.stock !== undefined && (
                <View style={styles.stockContainer}>
                  <Ionicons
                    name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={product.stock > 0 ? '#10B981' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.stockText,
                      product.stock > 0
                        ? styles.stockTextAvailable
                        : styles.stockTextOutOfStock,
                    ]}>
                    {product.stock > 0
                      ? `Còn ${product.stock} sản phẩm`
                      : 'Hết hàng'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Options/Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.optionsSection}>
              {product.variants.map((variant, index) => {
                // Đảm bảo tất cả options có id
                const variantWithIds = {
                  ...variant,
                  options: variant.options?.map((option, optIndex) => ({
                    ...option,
                    id: option.id || `variant-${index}-option-${optIndex}-${Date.now()}`,
                  })) || [],
                };
                // Sử dụng unique key kết hợp type và index để tránh duplicate key
                const variantKey = `${variant.type}-${index}-${variant.name || ''}`;
                return (
                  <OptionSelector
                    key={variantKey}
                    variant={variantWithIds}
                    selectedOptionId={selectedOptions[variant.type]}
                    onSelect={optionId => handleOptionSelect(variant.type, optionId)}
                  />
                );
              })}
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Số lượng</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}>
                <Ionicons
                  name="remove"
                  size={22}
                  color={quantity <= 1 ? '#D1D5DB' : '#000'}
                />
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  product.stock !== undefined &&
                    quantity >= product.stock &&
                    styles.quantityButtonDisabled,
                ]}
                onPress={() => handleQuantityChange(1)}
                disabled={
                  product.stock !== undefined && quantity >= product.stock
                }>
                <Ionicons
                  name="add"
                  size={22}
                  color={
                    product.stock !== undefined && quantity >= product.stock
                      ? '#D1D5DB'
                      : '#000'
                  }
                />
              </TouchableOpacity>
            </View>
            {product.stock !== undefined && (
              <Text style={styles.stockHint}>
                Tối đa {product.stock} sản phẩm
              </Text>
            )}
          </View>

          {/* Total Price Preview */}
          <View style={styles.totalPreview}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>
              {formatPrice(calculatedPrice * quantity)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {totalItems > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.cartTotalLabel}>Giỏ hàng</Text>
            <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
            <Text style={styles.totalItems}>{totalItems} sản phẩm</Text>
          </View>
          <TouchableOpacity
            style={styles.goToOrdersButton}
            activeOpacity={0.8}
            onPress={() => {
              (navigation as any).navigate('MainTabs', {
                screen: MainRoutes.Order,
              });
            }}>
            <Ionicons name="cart" size={20} color="#FFFFFF" />
            <Text style={styles.goToOrdersText}>Xem giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              product.stock !== undefined &&
                product.stock === 0 &&
                styles.addToCartButtonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={
              (product.stock !== undefined && product.stock === 0) ||
              !isOptionsValid
            }
            activeOpacity={0.8}>
            <Ionicons
              name="cart-outline"
              size={22}
              color="#FFFFFF"
              style={styles.cartIcon}
            />
            <Text style={styles.addToCartText}>
              {product.stock !== undefined && product.stock === 0
                ? 'Hết hàng'
                : `Thêm vào giỏ - ${formatPrice(calculatedPrice * quantity)}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  heroContainer: {
    width: '100%',
    height: width * 0.75,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 12,
    lineHeight: 36,
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  stockTextAvailable: {
    color: '#10B981',
  },
  stockTextOutOfStock: {
    color: '#EF4444',
  },
  descriptionSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
  },
  optionsSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  stockHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginLeft: 4,
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarLeft: {
    flex: 1,
  },
  cartTotalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  totalItems: {
    fontSize: 13,
    color: '#6B7280',
  },
  goToOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#EA580C',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  goToOrdersText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: '#EA580C',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  cartIcon: {
    marginRight: 8,
  },
  addToCartText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ProductDetailsScreen;
