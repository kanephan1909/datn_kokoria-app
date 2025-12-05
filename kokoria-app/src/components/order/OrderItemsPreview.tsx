import {Text, View, Image, StyleSheet} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface OrderItem {
  id?: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
}

interface OrderItemsPreviewProps {
  items: OrderItem[];
  formatPrice: (price: number) => string;
}

const OrderItemsPreview = ({items, formatPrice}: OrderItemsPreviewProps) => {
  const previewItems = items.slice(0, 3);
  const remainingCount = items.length - 3;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sản phẩm đã đặt</Text>
      {previewItems.map((item, index) => {
        const product = item.product;
        const itemId = item.id || item.productId || `item-${index}`;
        const productName = product?.name || 'Sản phẩm';
        const productImageUrl = product?.imageUrl;

        return (
          <View key={itemId} style={styles.itemRow}>
            <View style={styles.imageContainer}>
              {productImageUrl ? (
                <Image
                  source={{uri: productImageUrl}}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="restaurant" size={24} color="#EA580C" />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {productName}
              </Text>
              <Text style={styles.itemQuantity}>Số lượng: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatPrice(item.price * item.quantity)}
            </Text>
          </View>
        );
      })}
      {remainingCount > 0 && (
        <Text style={styles.moreItemsText}>và {remainingCount} sản phẩm khác</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  moreItemsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default OrderItemsPreview;

