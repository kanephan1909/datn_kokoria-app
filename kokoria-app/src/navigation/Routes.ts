import { NavigatorScreenParams } from '@react-navigation/native';

// Enum for the root routes
export enum RootRoutes {
    AuthStack = 'AuthStack',
    MainTabs = 'MainTabs'
}

export enum AuthRoutes {
    Login = 'Login',
    Register = 'Register',
    ForgotPassword = 'ForgotPassword',
    VerifyEmail = 'VerifyEmail',
    ResetPassword = 'ResetPassword',
    VerifyCode = 'VerifyCode',
    VerifyPhone = 'VerifyPhone'
}

// Enum for the main routes
export enum MainRoutes {
    Home = 'Trang chủ',
    Menu = 'Menu',
    Order = 'Đơn Hàng',
    ProductDetails = 'Chi tiết sản phẩm',
    Category = 'Category',
    Checkout = 'Thanh toán',
    Checkout2 = 'Thanh toán 2',
    OrderDetails = 'Chi tiết đơn hàng',
    OrderHistory = 'Lịch sử đơn hàng',
    Profile = 'Tôi',
    Settings = 'Cài đặt',
    Notifications = 'Thông báo',
    AddressList = 'Danh sách địa chỉ',
    AddAddress = 'Thêm địa chỉ',
    EditAddress = 'Sửa địa chỉ',
    Payment = 'Phương thức thanh toán',
    PaymentWebView = 'Thanh toán WebView',
    OrderConfirmation = 'Xác nhận đơn hàng',
    LiveTrackingMap = 'Theo dõi đơn hàng',
    Chatbot = 'Chatbot',
    EditLocation = 'Chỉnh sửa vị trí'
}

// Type for the root stack param list
export type RootStackParamList = {
    [RootRoutes.AuthStack]: undefined;
    [RootRoutes.MainTabs]: undefined;
}

// Type for the auth stack param list
export type AuthStackParamList = {
    [AuthRoutes.Login]: undefined;
    [AuthRoutes.Register]: undefined;
    [AuthRoutes.ForgotPassword]: undefined;
    [AuthRoutes.VerifyEmail]: undefined;
    [AuthRoutes.ResetPassword]: { email?: string; phone?: string; method?: 'email' | 'sms' };
    [AuthRoutes.VerifyCode]: undefined;
    [AuthRoutes.VerifyPhone]: undefined;
}

export type MainTabParamList = {
    [MainRoutes.Home]:undefined;
    [MainRoutes.Menu]:undefined;
    [MainRoutes.Order]:undefined;
}

// Type for the main stack param list
export type MainStackParamList = {
    TabNavigator:NavigatorScreenParams<MainTabParamList>;
    [MainRoutes.ProductDetails]:{productId:string};
    [MainRoutes.Category]:{categoryId:string};
    [MainRoutes.Checkout]:undefined;
    [MainRoutes.Checkout2]:{
      addressId?: string;
      voucherId?: string;
      selectedLocation?: {
        latitude: number;
        longitude: number;
        address: string;
      };
    };
    [MainRoutes.OrderDetails]:{orderId:string};
    [MainRoutes.OrderHistory]:undefined;
    [MainRoutes.Profile]:undefined;
    [MainRoutes.Settings]:undefined;
    [MainRoutes.Notifications]:undefined;
    [MainRoutes.AddressList]:undefined;
    [MainRoutes.AddAddress]:undefined;
    [MainRoutes.EditAddress]:{addressId:string};
    [MainRoutes.Payment]:{orderDraft: any};
    [MainRoutes.PaymentWebView]:{
      paymentUrl: string;
      orderId: string;
      paymentMethod: string;
    };
    [MainRoutes.OrderConfirmation]:{orderId: string};
    [MainRoutes.LiveTrackingMap]:{orderId: string};
    [MainRoutes.Chatbot]:undefined;
    [MainRoutes.EditLocation]:{
      initialLocation?: {latitude: number; longitude: number};
      address?: string;
    };
}
