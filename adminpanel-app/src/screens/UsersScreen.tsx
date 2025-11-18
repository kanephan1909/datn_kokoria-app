import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, getMe, logout, deleteUser } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const UsersScreen = () => {
  const { user: currentUser, logout: logoutUser } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['users', selectedRole, searchQuery],
    queryFn: () => fetchUsers({ 
      page: 1, 
      limit: 20, 
      role: selectedRole || undefined,
      search: searchQuery || undefined,
    }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert('Thành công', 'Người dùng đã được xóa');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa người dùng');
    },
  });

  const users = usersData?.data || [];
  const filteredUsers = users.filter((user: any) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
        },
      },
    ]);
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      ADMIN: 'bg-red-100 text-red-800',
      USER: 'bg-blue-100 text-blue-800',
      DRIVER: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 pt-10"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {/* Current User Info */}
      <View 
        className="bg-white p-5 mb-5 mx-4 rounded-2xl border border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center mb-5">
          <View 
            className="bg-blue-500 rounded-full p-4 mr-4"
            style={{
              backgroundColor: '#3B82F6',
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <Ionicons name="person" size={28} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {currentUser?.name || 'Admin'}
            </Text>
            <Text className="text-gray-600 text-sm mb-2">{currentUser?.email}</Text>
            <View className={`self-start px-3 py-1.5 rounded-full ${getRoleColor(currentUser?.role || 'ADMIN')}`}>
              <Text className="text-xs font-bold">{currentUser?.role || 'ADMIN'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          className="bg-red-500 rounded-xl py-3.5 items-center flex-row justify-center"
          onPress={handleLogout}
          style={{
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text className="text-white font-bold ml-2">Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <View className="px-4">
        <View className="mb-3">
          <Text className="text-xl font-bold text-gray-900">Danh sách người dùng</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {filteredUsers.length} người dùng
          </Text>
        </View>

        {/* Action Buttons */}
        {isAdmin && (
          <View className="flex-row items-center gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-green-500 rounded-xl py-2.5"
              onPress={() => (navigation as any).navigate('Drivers')}
              style={{
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Ionicons name="car" size={18} color="white" />
              <Text 
                className="text-white font-semibold ml-1.5 text-sm"
                numberOfLines={1}
                style={{ flexShrink: 0 }}
              >
                Tài Xế
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-blue-500 rounded-xl py-2.5"
              onPress={() => (navigation as any).navigate('AddUser')}
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text 
                className="text-white font-semibold ml-1.5 text-sm"
                numberOfLines={1}
              >
                Thêm
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        {isAdmin && (
          <View 
            className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-200"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Tìm kiếm người dùng..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Role Filter */}
        {isAdmin && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedRole === null ? 'bg-blue-500' : 'bg-gray-200'
              }`}
              onPress={() => setSelectedRole(null)}
            >
              <Text
                className={`font-semibold ${
                  selectedRole === null ? 'text-white' : 'text-gray-700'
                }`}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
            {['ADMIN', 'USER', 'DRIVER'].map((role) => (
              <TouchableOpacity
                key={role}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedRole === role ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                onPress={() => setSelectedRole(role)}
              >
                <Text
                  className={`font-semibold ${
                    selectedRole === role ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {filteredUsers.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4 text-lg">
              {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user: any) => (
            <View
              key={user.id}
              className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
              
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">{user.name}</Text>
                  <Text className="text-gray-600 text-sm mb-1">{user.email}</Text>
                  {user.phone && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">{user.phone}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center space-x-2">
                  <View className={`px-3 py-1.5 rounded-lg ${getRoleColor(user.role)} border`}>
                    <Text className="text-xs font-bold">{user.role}</Text>
                  </View>
                  {isAdmin && (
                    <View className="flex-row items-center ml-2">
                      <TouchableOpacity
                        className="bg-blue-50 rounded-xl p-2.5 mr-2 border border-blue-200"
                        onPress={() => (navigation as any).navigate('EditUser', { userId: user.id })}
                        style={{
                          shadowColor: '#3B82F6',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="pencil" size={18} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-red-50 rounded-xl p-2.5 border border-red-200"
                        onPress={() => {
                          Alert.alert(
                            'Xác nhận',
                            'Bạn có chắc muốn xóa người dùng này?',
                            [
                              { text: 'Hủy', style: 'cancel' },
                              {
                                text: 'Xóa',
                                style: 'destructive',
                                onPress: () => deleteUserMutation.mutate(user.id),
                              },
                            ]
                          );
                        }}
                        style={{
                          shadowColor: '#EF4444',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default UsersScreen;
