import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import React, {useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNavigation} from '@react-navigation/native';
import {MainRoutes, RootRoutes} from '../navigation/Routes';
import {navigationRef} from '../navigation/Navigation';

interface SettingItem {
  id: string;
  title: string;
  icon: string;
  subtitle?: string;
  type?: 'switch';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
}

const SettingsScreen = () => {
  const {logout, user} = useAuth();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const navigation = useNavigation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Thực hiện logout
              await logout();

              // RootNavigator sẽ tự động re-render khi isAuthenticated thay đổi
              // Nhưng để đảm bảo, reset navigation stack
              setTimeout(() => {
                try {
                  if (navigationRef.current?.isReady()) {
                    navigationRef.current.reset({
                      index: 0,
                      routes: [{name: RootRoutes.AuthStack}],
                    });
                  }
                } catch (navError) {
                  console.error('Navigation reset error:', navError);
                  // Ignore navigation error, RootNavigator sẽ tự động chuyển
                }
              }, 50);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  };

  const settingsSections: Array<{title: string; items: SettingItem[]}> = [
    {
      title: 'Tài khoản',
      items: [
        {
          id: 'profile',
          title: 'Thông tin cá nhân',
          icon: 'person-outline',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
          },
        },
        {
          id: 'password',
          title: 'Đổi mật khẩu',
          icon: 'lock-closed-outline',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
          },
        },
        {
          id: 'addresses',
          title: 'Địa chỉ giao hàng',
          icon: 'location-outline',
          onPress: () => {
            (navigation as any).navigate(MainRoutes.AddressList);
          },
        },
      ],
    },
    {
      title: 'Thông báo',
      items: [
        {
          id: 'notifications',
          title: 'Thông báo đẩy',
          icon: 'notifications-outline',
          type: 'switch',
          value: pushNotifications,
          onValueChange: setPushNotifications,
        },
        {
          id: 'email',
          title: 'Thông báo qua email',
          icon: 'mail-outline',
          type: 'switch',
          value: emailNotifications,
          onValueChange: setEmailNotifications,
        },
      ],
    },
    {
      title: 'Ứng dụng',
      items: [
        {
          id: 'language',
          title: 'Ngôn ngữ',
          icon: 'language-outline',
          subtitle: 'Tiếng Việt',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
          },
        },
        {
          id: 'theme',
          title: 'Giao diện',
          icon: 'color-palette-outline',
          subtitle: 'Sáng',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
          },
        },
        {
          id: 'about',
          title: 'Về ứng dụng',
          icon: 'information-circle-outline',
          onPress: () => {
            Alert.alert(
              'Về ứng dụng',
              'Kokoria App\nVersion 1.0.0\n\nỨng dụng đặt đồ ăn trực tuyến',
            );
          },
        },
        {
          id: 'help',
          title: 'Trợ giúp & Hỗ trợ',
          icon: 'help-circle-outline',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
          },
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {(user as any)?.avatarUrl ? (
              <Image
                source={{uri: (user as any).avatarUrl}}
                style={styles.avatar}
              />
            ) : user?.name ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#EA580C" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => {
                const isSwitch = item.type === 'switch';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.settingItem,
                      itemIndex !== section.items.length - 1 &&
                        styles.settingItemBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={item.onPress}
                    disabled={isSwitch}>
                    <View style={styles.settingItemLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons
                          name={item.icon as any}
                          size={24}
                          color="#000"
                        />
                      </View>
                      <View style={styles.settingItemText}>
                        <Text style={styles.settingItemTitle}>{item.title}</Text>
                        {item.subtitle && (
                          <Text style={styles.settingItemSubtitle}>
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isSwitch && item.value !== undefined && item.onValueChange ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{false: '#E5E7EB', true: '#EA580C'}}
                        thumbColor="#FFFFFF"
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#EA580C',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});

export default SettingsScreen;
