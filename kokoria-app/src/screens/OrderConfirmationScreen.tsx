import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import {fetchOrderById} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import {formatPrice, formatDate} from '../utils/formatters';
import SuccessHeader from '../components/order/SuccessHeader';
import OrderInfoCard from '../components/order/OrderInfoCard';
import DeliveryAddressCard from '../components/order/DeliveryAddressCard';
import OrderItemsPreview from '../components/order/OrderItemsPreview';
import OrderConfirmationActions from '../components/order/OrderConfirmationActions';

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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total?: number;
  totalAmount?: number;
  items: OrderItem[];
  address?: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    city: string;
  };
  createdAt: string;
  note?: string;
}

const OrderConfirmationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {orderId} = route.params as {orderId: string};
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigation]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleTrackOrder = () => {
    if (order) {
      (navigation as any).navigate(MainRoutes.LiveTrackingMap, {
        orderId: order.id,
      });
    }
  };

  const handleViewOrderDetails = () => {
    if (order) {
      (navigation as any).navigate(MainRoutes.OrderDetails, {
        orderId: order.id,
      });
    }
  };

  const handleGoHome = () => {
    (navigation as any).navigate('TabNavigator', {
      screen: MainRoutes.Home,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const total = order.total || order.totalAmount || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SuccessHeader />

        <OrderInfoCard
          orderNumber={orderNumber}
          createdAt={order.createdAt}
          total={total}
          formatPrice={formatPrice}
          formatDate={formatDate}
        />

        {order.address && <DeliveryAddressCard address={order.address} />}

        <OrderItemsPreview items={order.items} formatPrice={formatPrice} />
      </ScrollView>

      <OrderConfirmationActions
        onTrackOrder={handleTrackOrder}
        onViewDetails={handleViewOrderDetails}
        onGoHome={handleGoHome}
      />
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default OrderConfirmationScreen;
