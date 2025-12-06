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
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  forgotPasswordByEmail,
  forgotPasswordBySMS,
} from '../../api/apiClient';
import { AuthRoutes } from '../navigation/Routes';
import { handleApiError } from '../utils/errorHandler';

type MethodType = 'email' | 'sms';

const ForgotPasswordScreen = () => {
  const [method, setMethod] = useState<MethodType>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const navigation = useNavigation();

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

  // Reset khi đổi phương thức
  useEffect(() => {
    setIsCodeSent(false);
    setEmail('');
    setPhone('');
  }, [method]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue.trim());
  };

  const validatePhone = (phoneValue: string): boolean => {
    // Validate số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0 hoặc +84)
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    const cleanPhoneValue = phoneValue.replace(/\s/g, '');
    return phoneRegex.test(cleanPhoneValue);
  };

  const handleForgotPassword = async () => {
    if (method === 'email') {
      const emailValue = email.trim();
      if (!emailValue) {
        Alert.alert('Lỗi', 'Vui lòng nhập email của bạn');
        return;
      }

      if (!validateEmail(emailValue)) {
        Alert.alert('Lỗi', 'Email không hợp lệ');
        return;
      }

      setIsLoading(true);
      try {
        const response = await forgotPasswordByEmail(emailValue);

        if (response.success) {
          setIsCodeSent(true);
          Alert.alert(
            'Thành công',
            `Mã xác nhận đã được gửi đến email ${emailValue}. Vui lòng kiểm tra hộp thư của bạn.`,
            [
              {
                text: 'Tiếp tục',
                onPress: () => {
                  (navigation as any).navigate(AuthRoutes.ResetPassword, {
                    email: emailValue,
                    method: 'email',
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Lỗi',
            response.message || 'Không thể gửi email. Vui lòng thử lại.'
          );
        }
      } catch (error: any) {
        handleApiError(error, 'Không thể gửi email đặt lại mật khẩu');
      } finally {
        setIsLoading(false);
      }
    } else {
      // SMS method
      const phoneValue = phone.trim();
      if (!phoneValue) {
        Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại của bạn');
        return;
      }

      const cleanPhone = phoneValue.replace(/\s/g, '');
      if (!validatePhone(cleanPhone)) {
        Alert.alert(
          'Lỗi',
          'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số).'
        );
        return;
      }

      setIsLoading(true);
      try {
        const response = await forgotPasswordBySMS(cleanPhone);

        if (response.success) {
          setIsCodeSent(true);
          Alert.alert(
            'Thành công',
            `Mã xác nhận đã được gửi đến số điện thoại ${cleanPhone}. Vui lòng kiểm tra tin nhắn.`,
            [
              {
                text: 'Tiếp tục',
                onPress: () => {
                  (navigation as any).navigate(AuthRoutes.ResetPassword, {
                    phone: cleanPhone,
                    method: 'sms',
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Lỗi',
            response.message || 'Không thể gửi SMS. Vui lòng thử lại.'
          );
        }
      } catch (error: any) {
        handleApiError(error, 'Không thể gửi SMS đặt lại mật khẩu');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatPhoneNumber = (text: string): string => {
    // Chỉ giữ lại số
    const numbers = text.replace(/\D/g, '');
    // Format: 0xxx xxx xxx
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
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
              <Text style={styles.appName}>QUÊN MẬT KHẨU</Text>
              <Text style={styles.tagline}>
                Chọn phương thức nhận mã xác nhận
              </Text>
            </Animated.View>

            {/* Card */}
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <View style={styles.blurCard}>
                <View style={styles.card}>
                  <Text style={styles.welcomeText}>Khôi phục mật khẩu</Text>
                  <Text style={styles.subtitleText}>
                    Chọn cách bạn muốn nhận mã xác nhận
                  </Text>

                  {/* Method selector */}
                  <View style={styles.methodSelector}>
                    <TouchableOpacity
                      style={[
                        styles.methodButton,
                        method === 'email' && styles.methodButtonActive,
                      ]}
                      onPress={() => setMethod('email')}
                      disabled={isLoading || isCodeSent}>
                      <Ionicons
                        name="mail-outline"
                        size={24}
                        color={method === 'email' ? '#FF6B35' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.methodButtonText,
                          method === 'email' && styles.methodButtonTextActive,
                        ]}>
                        Email
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.methodButton,
                        method === 'sms' && styles.methodButtonActive,
                      ]}
                      onPress={() => setMethod('sms')}
                      disabled={isLoading || isCodeSent}>
                      <Ionicons
                        name="phone-portrait-outline"
                        size={24}
                        color={method === 'sms' ? '#FF6B35' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.methodButtonText,
                          method === 'sms' && styles.methodButtonTextActive,
                        ]}>
                        SMS
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Email input */}
                  {method === 'email' && (
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#FF6B35"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Email của bạn"
                          placeholderTextColor="#999"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading && !isCodeSent}
                        />
                      </View>
                    </View>
                  )}

                  {/* Phone input */}
                  {method === 'sms' && (
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="phone-portrait-outline"
                          size={20}
                          color="#FF6B35"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Số điện thoại (0xxx xxx xxx)"
                          placeholderTextColor="#999"
                          value={phone}
                          onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading && !isCodeSent}
                          maxLength={13} // 0xxx xxx xxx
                        />
                      </View>
                    </View>
                  )}

                  {/* Submit button */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleForgotPassword}
                    disabled={isLoading || isCodeSent}
                    activeOpacity={0.8}>
                    <View style={styles.submitGradient}>
                      <Text style={styles.submitButtonText}>
                        {isLoading
                          ? 'Đang gửi...'
                          : isCodeSent
                          ? 'Đã gửi'
                          : `Gửi mã qua ${method === 'email' ? 'Email' : 'SMS'}`}
                      </Text>
                      {!isLoading && !isCodeSent && (
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    width: 100,
    height: 100,
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
    marginBottom: 24,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  methodButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  methodButtonTextActive: {
    color: '#FF6B35',
  },
  inputWrapper: {
    marginBottom: 24,
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
  hintText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
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

export default ForgotPasswordScreen;
