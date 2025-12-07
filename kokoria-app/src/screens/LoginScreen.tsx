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
  Image,
  Animated,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, getMe, socialLogin } from '../../api/apiClient';
import { AuthRoutes } from '../navigation/Routes';
import { handleApiError } from '../utils/errorHandler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';
import appleAuth, {
  AppleRequestOperation,
  AppleRequestScope,
} from '@invertase/react-native-apple-authentication';

// Kiểm tra xem module Google Sign-In có sẵn sàng không
const isGoogleSignInAvailable = () => {
  try {
    // Thử truy cập module để kiểm tra
    return GoogleSignin && typeof GoogleSignin.configure === 'function';
  } catch (error) {
    return false;
  }
};



const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    // Khởi tạo Google Sign-In (chỉ khi module đã được link)
    // Lưu ý: Cần rebuild app sau khi cài đặt native modules
    if ((Platform.OS === 'android' || Platform.OS === 'ios') && isGoogleSignInAvailable()) {
      try {
        GoogleSignin.configure({
          webClientId: '232946850530-fu8gj3p6o604h9m511tmmbrhnkd4e9id.apps.googleusercontent.com',
          offlineAccess: true,
        });
      } catch (error) {
        console.warn('Google Sign-In module chưa được link. Vui lòng rebuild app:', error);
      }
    } else {
      console.warn('Google Sign-In module chưa sẵn sàng. Vui lòng rebuild app.');
    }
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiLogin(email.trim(), password);
      if (response.success) {
        // Lấy thông tin user sau khi login thành công
        const userResponse = await getMe();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
          // Navigation sẽ được xử lý tự động bởi RootNavigator dựa trên isAuthenticated
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
        }
      } else {
        Alert.alert('Lỗi', response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      // Sử dụng error handler để hiển thị thông báo lỗi thân thiện
      handleApiError(error, 'Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true);
    try {
      let providerId = '';
      let socialEmail = '';
      let socialName = '';
      let avatarUrl = '';
      let phone = '';

      if (provider === 'google') {
        // Google Sign-In
        if (!isGoogleSignInAvailable()) {
          Alert.alert(
            'Lỗi',
            'Google Sign-In chưa được cấu hình. Vui lòng rebuild ứng dụng sau khi cài đặt module.'
          );
          setIsLoading(false);
          return;
        }
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          if (userInfo.user) {
            providerId = userInfo.user.id;
            socialEmail = userInfo.user.email || '';
            socialName = userInfo.user.name || '';
            avatarUrl = userInfo.user.photo || '';
          }
        } catch (error: any) {
          if (error.code === 'SIGN_IN_CANCELLED') {
            setIsLoading(false);
            return;
          }
          throw error;
        }
      } else if (provider === 'facebook') {
        // Facebook Login
        const loginResult = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        if (loginResult.isCancelled) {
          setIsLoading(false);
          return;
        }
        const data = await AccessToken.getCurrentAccessToken();
        if (!data) {
          Alert.alert('Lỗi', 'Không thể lấy thông tin từ Facebook');
          setIsLoading(false);
          return;
        }

        providerId = data.userID;

        // Lấy thông tin user từ Facebook Graph API
        const userInfo = await new Promise<any>((resolve, reject) => {
          const responseInfoCallback = (error: any, fbResult: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(fbResult);
            }
          };

          const infoRequest = new GraphRequest(
            '/me',
            {
              parameters: {
                fields: {
                  string: 'email,name,picture.type(large)',
                },
              },
            },
            responseInfoCallback,
          );
          new GraphRequestManager().addRequest(infoRequest).start();
        });

        socialEmail = userInfo.email || '';
        socialName = userInfo.name || '';
        avatarUrl = userInfo.picture?.data?.url || '';
      } else if (provider === 'apple') {
        // Apple Sign-In (chỉ iOS)
        if (Platform.OS !== 'ios') {
          Alert.alert('Thông báo', 'Đăng nhập Apple chỉ khả dụng trên iOS');
          setIsLoading(false);
          return;
        }

        const appleAuthRequestResponse = await appleAuth.performRequest({
          requestedOperation: AppleRequestOperation.LOGIN,
          requestedScopes: [AppleRequestScope.EMAIL, AppleRequestScope.FULL_NAME],
        });

        if (!appleAuthRequestResponse.identityToken) {
          setIsLoading(false);
          return;
        }

        providerId = appleAuthRequestResponse.user;
        socialEmail = appleAuthRequestResponse.email || '';
        socialName = appleAuthRequestResponse.fullName
          ? `${appleAuthRequestResponse.fullName.givenName || ''} ${appleAuthRequestResponse.fullName.familyName || ''}`.trim()
          : '';
      }

      if (!providerId || !socialEmail || !socialName) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin từ tài khoản xã hội');
        setIsLoading(false);
        return;
      }

      // Gọi API đăng nhập xã hội
      const response = await socialLogin({
        provider,
        providerId,
        email: socialEmail,
        name: socialName,
        avatarUrl: avatarUrl || undefined,
        phone: phone || undefined,
      });

      if (response.success) {
        // Lấy thông tin user sau khi login thành công
        const userResponse = await getMe();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
        }
      } else {
        Alert.alert('Lỗi', response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === 'E_SIGN_IN_CANCELLED') {
        // User đã hủy đăng nhập
        return;
      }
      handleApiError(error, `Đã xảy ra lỗi khi đăng nhập bằng ${provider}`);
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
              <Text style={styles.appName}>KOKORIA CHICKEN</Text>
              <Text style={styles.tagline}>Thức ăn ngon, giao nhanh đến tay</Text>
            </Animated.View>

            {/* Login card */}
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}>
              <View style={styles.blurCard}>
                <View style={styles.card}>
                  <Text style={styles.welcomeText}>Đăng nhập</Text>
                  <Text style={styles.subtitleText}>Nhập thông tin để tiếp tục</Text>

                  {/* Email input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email của bạn"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Password input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu"
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

                  {/* Forgot password */}
                  <TouchableOpacity
                    style={styles.forgotButton}
                    onPress={() => navigation.navigate(AuthRoutes.ForgotPassword as never)}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>

                  {/* Login button */}
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}>
                    <View style={styles.loginGradient}>
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin('google')}
                      disabled={isLoading}>
                      <Ionicons name="logo-google" size={24} color="#4285F4" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin('facebook')}
                      disabled={isLoading}>
                      <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => handleSocialLogin('apple')}
                        disabled={isLoading}>
                        <Ionicons name="logo-apple" size={24} color="#000000" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

                  {/* Register link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(AuthRoutes.Register as never)}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600' as const,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  registerLink: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
