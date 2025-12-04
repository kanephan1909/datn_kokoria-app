import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { resetPassword } from '../../api/apiClient';
import { AuthRoutes, AuthStackParamList } from '../navigation/Routes';
import { handleApiError } from '../utils/errorHandler';

type ResetPasswordScreenRouteProp = RouteProp<
  AuthStackParamList,
  AuthRoutes.ResetPassword
>;

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const email = route.params?.email || '';
  const phone = route.params?.phone || '';
  const method = route.params?.method || (email ? 'email' : 'sms');

  // Nếu không có email hoặc phone, quay lại màn hình quên mật khẩu
  useEffect(() => {
    if (!email && !phone) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập email hoặc số điện thoại trước',
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [email, phone, navigation]);

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleResetPassword = async () => {
    // Validation
    if (!code.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã xác nhận');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword({
        email: email || undefined,
        phone: phone || undefined,
        code: code.trim(),
        newPassword: newPassword,
        method: method as 'email' | 'sms',
      });

      if (response.success) {
        Alert.alert(
          'Thành công',
          'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => {
                navigation.navigate(AuthRoutes.Login as never);
              },
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (error: any) {
      handleApiError(error, 'Không thể đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with gradient effect */}
      <View style={styles.gradientBackground} />
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            {/* Logo section */}
            <Animated.View
              style={[
                styles.logoSection,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <View style={styles.logoGradient}>
                  <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={styles.appName}>ĐẶT LẠI MẬT KHẨU</Text>
              <Text style={styles.tagline}>
                Nhập mã xác nhận và mật khẩu mới
              </Text>
              {email && (
                <Text style={styles.emailText}>
                  📧 {email}
                </Text>
              )}
              {phone && (
                <Text style={styles.emailText}>
                  📱 {phone}
                </Text>
              )}
            </Animated.View>

            {/* Card */}
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <View style={styles.blurCard}>
                <View style={styles.card}>
                  <Text style={styles.welcomeText}>Mật khẩu mới</Text>
                  <Text style={styles.subtitleText}>
                    Nhập mã xác nhận và mật khẩu mới của bạn
                  </Text>

                  {/* Code input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="key-outline"
                        size={20}
                        color="#FF6B35"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Mã xác nhận"
                        placeholderTextColor="#999"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={6}
                      />
                    </View>
                  </View>

                  {/* New password input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#FF6B35"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu mới"
                        placeholderTextColor="#999"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}>
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm password input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#FF6B35"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Xác nhận mật khẩu mới"
                        placeholderTextColor="#999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={styles.eyeButton}>
                        <Ionicons
                          name={
                            showConfirmPassword ? 'eye-outline' : 'eye-off-outline'
                          }
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Submit button */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    activeOpacity={0.8}>
                    <View style={styles.submitGradient}>
                      <Text style={styles.submitButtonText}>
                        {isLoading
                          ? 'Đang xử lý...'
                          : 'Đặt lại mật khẩu'}
                      </Text>
                      {!isLoading && (
                        <Ionicons name="chevron-forward" size={20} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Back to login */}
                  <View style={styles.backToLoginContainer}>
                    <Text style={styles.backToLoginText}>
                      Nhớ mật khẩu?{' '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate(AuthRoutes.Login as never)}>
                      <Text style={styles.backToLoginLink}>Đăng nhập</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B35',
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7931E',
    opacity: 0.5,
  },
  gradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFC837',
    opacity: 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 120,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: 100,
    right: -60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: -20,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    marginBottom: 24,
  },
  blurCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 15,
    color: '#6B7280',
  },
  backToLoginLink: {
    fontSize: 15,
    color: '#FF6B35',
    fontWeight: '700' as const,
  },
});

export default ResetPasswordScreen;

