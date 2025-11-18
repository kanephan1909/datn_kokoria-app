import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrderById,
  confirmOrder,
  updateOrderStatus,
} from "../api/apiClient";
import { Ionicons } from "@expo/vector-icons";

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const orderId = (route.params as any)?.orderId;

  const {
    data: orderData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrderById(orderId),
  });

  const confirmMutation = useMutation({
    mutationFn: (message?: string) => confirmOrder(orderId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      Alert.alert("Thành công", "Đơn hàng đã được xác nhận");
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể xác nhận đơn hàng"
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, message }: { status: string; message?: string }) =>
      updateOrderStatus(orderId, status, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      Alert.alert("Thành công", "Trạng thái đơn hàng đã được cập nhật");
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    },
  });

  const order = orderData?.data;

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PREPARING: "bg-purple-100 text-purple-800",
      READY_FOR_PICKUP: "bg-indigo-100 text-indigo-800",
      PICKED_UP: "bg-pink-100 text-pink-800",
      DELIVERING: "bg-cyan-100 text-cyan-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: { [key: string]: string } = {
      PENDING: "CONFIRMED",
      CONFIRMED: "PREPARING",
      PREPARING: "READY_FOR_PICKUP",
      READY_FOR_PICKUP: "PICKED_UP",
      PICKED_UP: "DELIVERING",
      DELIVERING: "COMPLETED",
    };
    return statusFlow[currentStatus];
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-red-500 text-lg font-semibold mt-4 text-center">
          Không tìm thấy đơn hàng
        </Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-lg px-6 py-3 mt-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-semibold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextStatus = getNextStatus(order.status);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View className="p-4">
        {/* Order Header */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Đơn #{order.id.slice(-8)}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${getStatusColor(
                order.status
              )}`}
            >
              <Text className="text-xs font-semibold">{order.status}</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-blue-600">
            {formatCurrency(order.totalAmount)}
          </Text>
        </View>

        {/* Customer Info */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Thông tin khách hàng
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text className="text-gray-800 ml-2">
                {order.user?.name || "N/A"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-2">
                {order.user?.email || "N/A"}
              </Text>
            </View>
            {order.user?.phone && (
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text className="text-gray-600 ml-2">{order.user.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Driver Info */}
        {order.driver && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">Tài xế</Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Ionicons name="car-outline" size={20} color="#6B7280" />
                <Text className="text-gray-800 ml-2">{order.driver.name}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text className="text-gray-600 ml-2">{order.driver.phone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Items */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-800 mb-3">Sản phẩm</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item: any, index: number) => (
              <View
                key={index}
                className="flex-row justify-between items-center py-2 border-b border-gray-100"
              >
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">
                    {item.name || "Sản phẩm"}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    x{item.quantity || 1}
                  </Text>
                </View>
                <Text className="text-gray-800 font-semibold">
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">Không có sản phẩm</Text>
          )}
        </View>

        {/* Order Logs */}
        {order.logs && order.logs.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Lịch sử
            </Text>
            {order.logs.map((log: any, index: number) => (
              <View
                key={index}
                className="mb-2 pb-2 border-b border-gray-100 last:border-0"
              >
                <Text className="text-gray-600 text-sm">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </Text>
                <Text className="text-gray-800">
                  {log.oldStatus && `${log.oldStatus} → `}
                  {log.newStatus}
                </Text>
                {log.message && (
                  <Text className="text-gray-500 text-sm mt-1">
                    {log.message}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {order.status === "PENDING" && (
          <TouchableOpacity
            className="bg-green-500 rounded-lg py-3 items-center mb-3"
            onPress={() => {
              Alert.alert("Xác nhận", "Xác nhận đơn hàng này?", [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Xác nhận",
                  onPress: () => confirmMutation.mutate(),
                },
              ]);
            }}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Xác nhận đơn hàng
              </Text>
            )}
          </TouchableOpacity>
        )}

        {nextStatus &&
          order.status !== "COMPLETED" &&
          order.status !== "CANCELED" && (
            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-3 items-center mb-3"
              onPress={() => {
                Alert.alert(
                  "Cập nhật",
                  `Chuyển sang trạng thái ${nextStatus}?`,
                  [
                    { text: "Hủy", style: "cancel" },
                    {
                      text: "Xác nhận",
                      onPress: () =>
                        updateStatusMutation.mutate({ status: nextStatus }),
                    },
                  ]
                );
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Chuyển sang {nextStatus}
                </Text>
              )}
            </TouchableOpacity>
          )}
      </View>
    </ScrollView>
  );
};

export default OrderDetailScreen;
