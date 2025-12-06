import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {updateUser, uploadImage} from '../../api/apiClient';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';

const EditProfileScreen = () => {
  const {user, updateUser: updateUserContext} = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatarUrl: (user as any)?.avatarUrl || '',
  });

  const [avatarUri, setAvatarUri] = useState<string | null>(
    (user as any)?.avatarUrl || null,
  );

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: (user as any)?.avatarUrl || '',
      });
      setAvatarUri((user as any)?.avatarUrl || null);
    }
  }, [user]);

  const handleImagePicker = () => {
    console.log('=== handleImagePicker called ===');
    try {
      Alert.alert(
        'Chọn ảnh đại diện',
        'Bạn muốn chọn ảnh từ đâu?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => console.log('User cancelled'),
          },
          {
            text: 'Thư viện',
            onPress: () => {
              console.log('User selected library');
              pickImageFromLibrary();
            },
          },
          {
            text: 'Camera',
            onPress: () => {
              console.log('User selected camera');
              takePhoto();
            },
          },
        ],
        {cancelable: true},
      );
    } catch (error) {
      console.error('Error in handleImagePicker:', error);
      Alert.alert('Lỗi', 'Không thể mở dialog. Vui lòng thử lại.');
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Android 13+ (API 33+) sử dụng READ_MEDIA_IMAGES
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Quyền truy cập thư viện ảnh',
              message: 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện',
              buttonNeutral: 'Để sau',
              buttonNegative: 'Từ chối',
              buttonPositive: 'Đồng ý',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 12 trở xuống
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Quyền truy cập thư viện ảnh',
              message: 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện',
              buttonNeutral: 'Để sau',
              buttonNegative: 'Từ chối',
              buttonPositive: 'Đồng ý',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions được xử lý tự động
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Quyền truy cập camera',
            message: 'Ứng dụng cần quyền truy cập camera để chụp ảnh đại diện',
            buttonNeutral: 'Để sau',
            buttonNegative: 'Từ chối',
            buttonPositive: 'Đồng ý',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions được xử lý tự động
  };

  const pickImageFromLibrary = async () => {
    try {
      console.log('pickImageFromLibrary called');
      const hasPermission = await requestStoragePermission();
      console.log('Storage permission:', hasPermission);
      if (!hasPermission) {
        Alert.alert(
          'Quyền bị từ chối',
          'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh. Vui lòng vào Cài đặt để cấp quyền.',
        );
        return;
      }

      console.log('Launching image library...');
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        selectionLimit: 1,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        console.log('Image picker response:', JSON.stringify(response, null, 2));
        if (response.didCancel) {
          return;
        }
        if (response.errorMessage) {
          Alert.alert('Lỗi', response.errorMessage);
          return;
        }
        if (response.errorCode) {
          let errorMsg = 'Không thể mở thư viện ảnh';
          if (response.errorCode === 'permission') {
            errorMsg = 'Không có quyền truy cập thư viện ảnh';
          } else if (response.errorCode === 'others') {
            errorMsg = response.errorMessage || 'Đã xảy ra lỗi';
          }
          Alert.alert('Lỗi', errorMsg);
          return;
        }
        if (response.assets && response.assets[0]) {
          const uri = response.assets[0].uri;
          if (uri) {
            setAvatarUri(uri);
            uploadImageToServer(uri);
          }
        }
      });
    } catch (error: any) {
      console.error('Pick image error:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh. Vui lòng thử lại.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('takePhoto called');
      const hasPermission = await requestCameraPermission();
      console.log('Camera permission:', hasPermission);
      if (!hasPermission) {
        Alert.alert(
          'Quyền bị từ chối',
          'Bạn cần cấp quyền truy cập camera để chụp ảnh. Vui lòng vào Cài đặt để cấp quyền.',
        );
        return;
      }

      console.log('Launching camera...');
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        saveToPhotos: false,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        console.log('Camera response:', JSON.stringify(response, null, 2));
        if (response.didCancel) {
          return;
        }
        if (response.errorMessage) {
          Alert.alert('Lỗi', response.errorMessage);
          return;
        }
        if (response.errorCode) {
          let errorMsg = 'Không thể mở camera';
          if (response.errorCode === 'permission') {
            errorMsg = 'Không có quyền truy cập camera';
          } else if (response.errorCode === 'camera_unavailable') {
            errorMsg = 'Camera không khả dụng';
          } else if (response.errorCode === 'others') {
            errorMsg = response.errorMessage || 'Đã xảy ra lỗi';
          }
          Alert.alert('Lỗi', errorMsg);
          return;
        }
        if (response.assets && response.assets[0]) {
          const uri = response.assets[0].uri;
          if (uri) {
            setAvatarUri(uri);
            uploadImageToServer(uri);
          }
        }
      });
    } catch (error: any) {
      console.error('Take photo error:', error);
      Alert.alert('Lỗi', 'Không thể mở camera. Vui lòng thử lại.');
    }
  };

  const uploadImageToServer = async (uri: string) => {
    try {
      setUploadingImage(true);
      const response = await uploadImage(uri);
      if (response.success && response.data?.url) {
        setFormData({...formData, avatarUrl: response.data.url});
        setAvatarUri(response.data.url);
        Alert.alert('Thành công', 'Ảnh đã được tải lên');
      } else {
        Alert.alert('Lỗi', 'Không thể tải ảnh lên server');
      }
    } catch (error: any) {
      console.error('Upload image error:', error);
      // Nếu upload thất bại, vẫn giữ ảnh local để user có thể lưu sau
      Alert.alert(
        'Lỗi',
        error.response?.data?.message ||
          'Không thể tải ảnh lên. Bạn vẫn có thể lưu thông tin và tải ảnh sau.',
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (formData.phone) {
        updateData.phone = formData.phone.trim();
      }

      if (formData.avatarUrl) {
        updateData.avatarUrl = formData.avatarUrl;
      }

      const response = await updateUser(user.id, updateData);

      if (response.success && response.data) {
        // Cập nhật user trong context
        updateUserContext(response.data);
        Alert.alert('Thành công', 'Đã cập nhật thông tin thành công', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể cập nhật thông tin');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message ||
          'Không thể cập nhật thông tin. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) {
      return 'U';
    }
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              console.log('=== TOUCH DETECTED ===');
              handleImagePicker();
            }}
            onPressIn={() => console.log('Avatar pressed in')}
            onPressOut={() => console.log('Avatar pressed out')}
            disabled={uploadingImage}
            activeOpacity={0.8}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            {avatarUri ? (
              <Image source={{uri: avatarUri}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getUserInitials(formData.name || 'U')}
                </Text>
              </View>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            Nhấn vào ảnh để thay đổi ảnh đại diện
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={text => setFormData({...formData, name: text})}
              placeholder="Nhập tên của bạn"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={text => setFormData({...formData, email: text})}
              placeholder="Nhập email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={text => setFormData({...formData, phone: text})}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#EA580C',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#EA580C',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    pointerEvents: 'none', // Không chặn touch events
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;
