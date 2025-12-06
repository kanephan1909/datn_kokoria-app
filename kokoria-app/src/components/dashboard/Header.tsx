import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MainRoutes, MainStackParamList} from '../../navigation/Routes';
import {Ionicons} from '@react-native-vector-icons/ionicons';

const Header = () => {
  const nav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [notificationCount] = useState(3); // Số thông báo chưa đọc

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left Section - Order Info */}
        <View style={styles.leftSection}>
          <Text style={styles.subtitle}>Đơn hàng đã bắt đầu từ</Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>15 Phút</Text>
            <View style={styles.flashIconContainer}>
              <Ionicons name="flash" size={20} color="#FFE66D" />
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.orderInfoContainer}>
            <Text style={styles.orderText}>560024 - Kane Phan</Text>
            <Ionicons
              name="chevron-down-outline"
              size={14}
              color="#FFFFFF"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Right Section - Action Buttons */}
        <View style={styles.rightSection}>
          {/* Notification Button */}
          <TouchableOpacity
            onPress={() => nav.navigate(MainRoutes.Notifications)}
            activeOpacity={0.7}
            style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => nav.navigate(MainRoutes.Profile)}
            activeOpacity={0.7}
            style={styles.iconButton}>
            <Ionicons name="person-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: -0.5,
  },
  flashIconContainer: {
    backgroundColor: 'rgba(255, 230, 109, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  orderInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orderText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 1,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default Header;
