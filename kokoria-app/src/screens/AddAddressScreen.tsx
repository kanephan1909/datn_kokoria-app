import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {createAddress} from '../../api/apiClient';

const AddAddressScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !ward.trim() || !district.trim() || !city.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const addressData = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
        isDefault,
      };

      console.log('Creating address with data:', addressData);

      const response = await createAddress(addressData);

      console.log('Create address response:', response);

      if (response.success) {
        // Reset form
        setName('');
        setPhone('');
        setAddress('');
        setWard('');
        setDistrict('');
        setCity('');
        setIsDefault(false);

        Alert.alert('Thành công', 'Đã thêm địa chỉ mới', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể thêm địa chỉ');
      }
    } catch (error: any) {
      console.error('Error creating address:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Không thể thêm địa chỉ. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}>
        {/* Header */}
        <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm địa chỉ</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={16} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Họ và tên <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="call-outline" size={16} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Số điện thoại <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Địa chỉ */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location-outline" size={16} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Địa chỉ <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Số nhà, tên đường"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Phường/Xã */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="business-outline" size={16} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Phường/Xã <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={ward}
                  onChangeText={setWard}
                  placeholder="Nhập phường/xã"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Quận/Huyện */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="map-outline" size={16} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Quận/Huyện <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="Nhập quận/huyện"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Tỉnh/Thành phố */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location" size={16} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.label}>Tỉnh/Thành phố <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Nhập tỉnh/thành phố"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Checkbox địa chỉ mặc định */}
            <TouchableOpacity
              onPress={() => setIsDefault(!isDefault)}
              style={styles.checkboxContainer}
              activeOpacity={0.7}>
              <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                {isDefault && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Đặt làm địa chỉ mặc định</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex1: {
    flex: 1,
  },
  header: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: 'transparent',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  checkboxLabel: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  saveButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddAddressScreen;

