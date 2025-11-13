import {Image} from 'react-native';
import {cssInterop} from 'nativewind';

// Cấu hình NativeWind để hỗ trợ className cho các component không hỗ trợ mặc định
cssInterop(Image, {className: 'style'});

