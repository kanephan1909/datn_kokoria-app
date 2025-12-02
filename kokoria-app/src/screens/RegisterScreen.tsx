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
import { useAuth } from '../context/AuthContext';
import { register as apiRegister, getMe } from '../../api/apiClient';
import { AuthRoutes } from '../navigation/Routes';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login: setUser } = useAuth();
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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password: password,
        phone: phone.trim() || undefined,
      });

      if (response.success) {
        // Lấy thông tin user sau khi register thành công
        const userResponse = await getMe();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
          Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
          // Navigation sẽ được xử lý tự động bởi RootNavigator dựa trên isAuthenticated
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
        }
      } else {
        Alert.alert('Lỗi', response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Đã xảy ra lỗi khi đăng ký';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with gradient effect using multiple Views */}
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
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Logo section */}
            <Animated.View
              style={[
                styles.logoSection,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <View style={styles.logoContainer}>
                <View style={styles.logoGradient}>
                  <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={styles.appName}>Tạo tài khoản</Text>
              <Text style={styles.tagline}>Điền thông tin để đăng ký</Text>
            </Animated.View>

            {/* Register card */}
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <View style={styles.blurCard}>
                <View style={styles.card}>
                  <Text style={styles.welcomeText}>Đăng ký</Text>
                  <Text style={styles.subtitleText}>Nhập thông tin của bạn</Text>

                  {/* Name input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="person-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Họ và tên *"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Email input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email của bạn *"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Phone input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Số điện thoại"
                        placeholderTextColor="#999"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Password input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu *"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
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

                  {/* Confirm Password input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Xác nhận mật khẩu *"
                        placeholderTextColor="#999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeButton}>
                        <Ionicons
                          name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Register button */}
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={handleRegister}
                    disabled={isLoading}
                    activeOpacity={0.8}>
                    <View style={styles.registerGradient}>
                      <Text style={styles.registerButtonText}>
                        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#FFF" />
                    </View>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>hoặc</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social login buttons */}
                  <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-google" size={24} color="#4285F4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-apple" size={24} color="#000000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Login link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(AuthRoutes.Login as never)}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
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
  logoImage: {
    width: 100,
    height: 100,
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 12,
  },
  blurCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginRight: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  loginLink: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
